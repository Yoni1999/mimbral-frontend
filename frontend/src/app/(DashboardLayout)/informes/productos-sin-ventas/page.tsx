'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Box, Typography, Divider, Snackbar, Alert, IconButton,
    Pagination, CircularProgress, Button, Menu, MenuItem, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Stack, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

import ProductosSinVentasTable from './components/ProductosSinVentas';
import { fetchWithToken } from '@/utils/fetchWithToken';
import { BACKEND_URL } from '@/config';

import HeaderSinVentasDrawer from './components/HeaderSinVentasDrawer';

// ---- Tipos (alineado al patrón de menos rentables) ----
type Order = 'asc' | 'desc';
type OrderBy = 'stockTotal' | 'createDate';

interface FiltroSinVentas {
    minStock?: number;          // default 0
    fechaInicio?: string;       // YYYY-MM-DD
    primerNivel?: string;
    categoria?: string;
    subcategoria?: string;
}

export interface ProductoSinVentas {
    itemCode: string;
    nombre: string;
    imagen?: string | null;
    primerNivel?: string | null;
    categoria?: string | null;
    subcategoria?: string | null;
    createDate?: string | null;
    stockTotal: number;
    warehouses: Record<string, number>;
    ocDocNum?: number | null;
    ocFecha?: string | null;
    ocProveedor?: string | null;
    ocCantidad?: number | null;
    ocCreadoPor?: string | null;
}

const limit = 20; // mismo patrón que el resto

// Si el backend usa /api/reportes/... cambia acá:
const ENDPOINT = '/api/informes/productos-sin-ventas';

const ProductosSinVentasPage: React.FC = () => {
    // Estado
    const [filters, setFilters] = useState<FiltroSinVentas>({ minStock: 0 });
    const [data, setData] = useState<ProductoSinVentas[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const [showMensaje, setShowMensaje] = useState<boolean>(true);

    const [orden, setOrden] = useState<Order>('desc');
    const [ordenPor, setOrdenPor] = useState<OrderBy>('stockTotal');

    // Export unificado (idéntico al de menos rentables)
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openExportModal, setOpenExportModal] = useState(false);
    const [exportCount, setExportCount] = useState<number>(100);
    const [exportTarget, setExportTarget] = useState<'excel' | 'pdf'>('excel');

    const totalPages = Math.ceil(Math.max(0, total) / limit);

    // --- helpers locales (mismo patrón) ---
    const isYYYYMMDD = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);

    const splitProduct = (s?: string | null) => {
        const txt = s || '';
        const idx = txt.lastIndexOf(' / ');
        if (idx >= 0) return { nombre: txt.slice(0, idx).trim(), codeFromName: txt.slice(idx + 3).trim() };
        return { nombre: txt.trim(), codeFromName: '' };
    };

    const mapRow = (r: any): ProductoSinVentas => {
        const { image, product, itemCode, createDate } = r?.productDetail || {};
        const { nombre } = splitProduct(product);
        const [primerNivel, categoria] = String(r?.hierarchy || '').split(' / ').map((x: string) => x?.trim() || '') as [string, string];
        const subcategoria = r?.subcategory ?? '';
        const stockTotal = Number(r?.stock?.stockTotal ?? 0);
        const warehouses = (r?.stock?.warehouses || {}) as Record<string, number>;
        const po = r?.purchaseOrderDetail || {};
        return {
            itemCode: itemCode || '',
            nombre,
            imagen: image ?? null,
            primerNivel: primerNivel || null,
            categoria: categoria || null,
            subcategoria: subcategoria || null,
            createDate: createDate || null,
            stockTotal,
            warehouses,
            ocDocNum: po?.docNum ?? null,
            ocFecha: po?.createDate ?? null,
            ocProveedor: po?.supplier ?? null,
            ocCantidad: po?.quantity ?? null,
            ocCreadoPor: po?.createdBy ?? null,
        };
    };

    // --- fetch principal (calcado al flujo del otro informe) ---
    const fetchSinVentas = async (
        filtros: FiltroSinVentas,
        pageNumber = 1,
        campoOrden?: OrderBy,
        direccionOrden?: Order
    ) => {
        setLoading(true);
        try {
            const ob: OrderBy = campoOrden ?? ordenPor;
            const od: Order = direccionOrden ?? orden;

            const params = new URLSearchParams();
            if (typeof filtros.minStock === 'number') params.append('minStock', String(filtros.minStock));
            if (isYYYYMMDD(filtros.fechaInicio)) params.append('fechaInicio', String(filtros.fechaInicio));
            if (filtros.primerNivel) params.append('primerNivel', filtros.primerNivel);
            if (filtros.categoria) params.append('categoria', filtros.categoria);
            if (filtros.subcategoria) params.append('subcategoria', filtros.subcategoria);

            params.append('page', String(pageNumber));
            params.append('pageSize', String(limit));
            params.append('orderBy', ob);
            params.append('order', od);

            const res = await fetchWithToken(`${BACKEND_URL}${ENDPOINT}?${params.toString()}`);
            if (!res) {
                setData([]);
                setTotal(0);
                return;
            }
            const json = await res.json();

            const rows = Array.isArray(json?.data) ? json.data.map(mapRow) : [];
            setData(rows);

            const totalApi = typeof json?.total === 'number' ? json.total : undefined;
            const estimated = (pageNumber - 1) * limit + rows.length + (rows.length === limit ? 1 : 0);
            setTotal(totalApi ?? estimated);
        } catch (e) {
            console.error('Error al cargar productos sin ventas:', e);
            setData([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSinVentas(filters, 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        fetchSinVentas(filters, value);
    };

    const handleSortChange = (campo: OrderBy) => {
        const nuevoOrden = ordenPor === campo && orden === 'asc' ? 'desc' : 'asc';
        setOrden(nuevoOrden);
        setOrdenPor(campo);
        fetchSinVentas(filters, page, campo, nuevoOrden);
    };

    // ---- Export (menú + modal unificado, igual que en menos rentables) ----
    const handleOpenExportMenu = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
    const handleCloseExportMenu = () => setAnchorEl(null);
    const handleSelectExportFormat = (format: 'excel' | 'pdf') => {
        setAnchorEl(null);
        setExportTarget(format);
        setOpenExportModal(true);
    };

    const exportSinVentas = async (tipo: 'excel' | 'pdf', exportLimit: number | 'all') => {
        setLoading(true);
        try {
            const paramsBase = new URLSearchParams();
            if (typeof filters.minStock === 'number') paramsBase.append('minStock', String(filters.minStock));
            if (isYYYYMMDD(filters.fechaInicio)) paramsBase.append('fechaInicio', String(filters.fechaInicio));
            if (filters.primerNivel) paramsBase.append('primerNivel', filters.primerNivel);
            if (filters.categoria) paramsBase.append('categoria', filters.categoria);
            if (filters.subcategoria) paramsBase.append('subcategoria', filters.subcategoria);
            paramsBase.append('orderBy', ordenPor);
            paramsBase.append('order', orden);

            const fetchPage = async (pageNum: number, pageSize: number) => {
                const p = new URLSearchParams(paramsBase);
                p.append('page', String(pageNum));
                p.append('pageSize', String(pageSize));
                const res = await fetchWithToken(`${BACKEND_URL}${ENDPOINT}?${p.toString()}`);
                const json = await res!.json();
                const rows = Array.isArray(json?.data) ? json.data.map(mapRow) : [];
                const totalApi = typeof json?.total === 'number' ? json.total : undefined;
                return { rows, totalApi };
            };

            // ---- traer datos según límite ----
            const GUESS_MAX = 1000;              // intenta 1000 primero
            let effectiveChunk = GUESS_MAX;      // si la 1ra página vuelve 500, adoptamos 500

            let rows: ProductoSinVentas[] = [];

            if (exportLimit !== 'all') {
                const target = Math.max(0, Number(exportLimit));
                let collected = 0;
                let pageNum = 1;

                while (collected < target) {
                    const remainingBefore = target - collected;
                    const want = Math.min(effectiveChunk, remainingBefore);

                    const { rows: r } = await fetchPage(pageNum, want);

                    // --- detección de tope real del backend en la 1ra página (ej: 500) ---
                    let currentCap = effectiveChunk;
                    if (pageNum === 1 && r.length > 0 && r.length < want) {
                        currentCap = effectiveChunk = r.length;
                    }

                    rows.push(...r);
                    collected += r.length;

                    // lo que esperábamos para ESTA página (ya con cap ajustado)
                    const expectedForThisPage = Math.min(currentCap, remainingBefore);

                    // cortar solo si vino menos de lo que permite el cap para esta página
                    if (r.length < expectedForThisPage) break;

                    pageNum++;
                    if (pageNum > 5000) break; // guardrail
                }

                // recorte fino por seguridad
                if (rows.length > target) rows = rows.slice(0, target);

            } else {
                // “todos” → paginar hasta agotar, respetando el cap detectado
                let pageNum = 1;
                while (true) {
                    const want = effectiveChunk;
                    const { rows: r } = await fetchPage(pageNum, want);

                    if (pageNum === 1 && r.length > 0 && r.length < want) {
                        effectiveChunk = r.length; // ej: 500
                    }

                    rows.push(...r);

                    // si vino menos que el cap, no hay más
                    if (r.length < Math.min(effectiveChunk, want)) break;

                    pageNum++;
                    if (pageNum > 5000) break; // guardrail
                }
            }


            if (tipo === 'excel') {
                const ws = XLSX.utils.json_to_sheet(
                    rows.map((it, idx) => ({
                        '#': idx + 1,
                        SKU: it.itemCode,
                        Nombre: it.nombre,
                        'Primer Nivel': it.primerNivel || '',
                        Categoría: it.categoria || '',
                        Subcategoría: it.subcategoria || '',
                        'Fecha creación': it.createDate ? new Date(it.createDate).toLocaleDateString() : '',
                        'Stock Total': it.stockTotal,
                        'OC N°': it.ocDocNum ?? 'N/A',
                        'OC Fecha': it.ocFecha ? new Date(it.ocFecha).toLocaleDateString() : 'N/A',
                        'OC Proveedor': it.ocProveedor ?? 'N/A',
                        'OC Cant.': it.ocCantidad ?? 'N/A',
                    }))
                );
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Productos sin ventas');
                XLSX.writeFile(wb, 'productos_sin_ventas.xlsx');
            } else {
                const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
                doc.setFontSize(16);
                doc.text('Informe de Productos sin Ventas', 40, 40);

                doc.setFontSize(10);
                const info = [
                    `minStock: ${filters.minStock ?? 0}`,
                    `Fecha mínima creación: ${filters.fechaInicio || '-'}`,
                    `Jerarquía: ${(filters.primerNivel || '-')}/${(filters.categoria || '-')}/${(filters.subcategoria || '-')}`,
                    `Fecha: ${new Date().toLocaleString()}`
                ];
                let startY = 60;
                const lineHeight = 14;
                info.forEach((line) => { doc.text(line, 40, startY); startY += lineHeight; });

                doc.setDrawColor(200);
                doc.setLineWidth(1);
                const infoBlockBottom = startY + 6;
                doc.line(40, infoBlockBottom, 800, infoBlockBottom);

                autoTable(doc, {
                    startY: infoBlockBottom + 12,
                    head: [[
                        '#', 'SKU', 'Nombre', 'Primer Nivel', 'Categoría', 'Subcategoría',
                        'Fecha creación', 'Stock Total', 'OC N°', 'OC Fecha', 'OC Proveedor', 'OC Cant.'
                    ]],
                    body: rows.map((it, i) => [
                        i + 1,
                        it.itemCode,
                        it.nombre,
                        it.primerNivel || '',
                        it.categoria || '',
                        it.subcategoria || '',
                        it.createDate ? new Date(it.createDate).toLocaleDateString() : '',
                        it.stockTotal,
                        it.ocDocNum ?? 'N/A',
                        it.ocFecha ? new Date(it.ocFecha).toLocaleDateString() : 'N/A',
                        it.ocProveedor ?? 'N/A',
                        it.ocCantidad ?? 'N/A',
                    ]),
                    headStyles: { fillColor: [93, 135, 255], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
                    styles: { fontSize: 9, cellPadding: 4, valign: 'middle', textColor: 20 },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                });

                doc.save('productos_sin_ventas.pdf');
            }
        } catch (e) {
            console.error('Error al exportar productos sin ventas:', e);
        } finally {
            setLoading(false);
        }
    };

    const productosCountText = useMemo(() => {
        if (total === 0) return 'Sin productos para mostrar';
        return <>Mostrando del <strong>{(page - 1) * limit + 1}</strong> al <strong>{Math.min(page * limit, total)}</strong> de <strong>{total}</strong> productos</>;
    }, [page, total]);

    // Handlers de filtros (inline, colocados ANTES del Divider para mantener estructura)
    const handleFilterNumber =
        (key: keyof FiltroSinVentas) => (e: React.ChangeEvent<HTMLInputElement>) =>
            setFilters(prev => ({ ...prev, [key]: Number(e.target.value || 0) }));

    const handleFilterText =
        (key: keyof FiltroSinVentas) => (e: React.ChangeEvent<HTMLInputElement>) =>
            setFilters(prev => ({ ...prev, [key]: e.target.value }));

    const exportConfirm = () => {
        exportSinVentas(exportTarget, exportCount === -1 ? 'all' : exportCount);
        setOpenExportModal(false);
    };

    return (
        <Box p={0}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
                <RemoveShoppingCartIcon color="primary" fontSize="large" />
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Productos sin Ventas
                </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" gutterBottom>
                Revisa el detalle de productos sin ventas desde un mínimo de stock, fecha mínima de creación, categoría, subcategoría y más. (excluye almacén 04)
            </Typography>

            {/* Filtros (situados aquí como en el header de otros informes) */}
            {/* Filtros (drawer consistente con “Menos rentables”) */}
            <HeaderSinVentasDrawer
                currentFilters={filters}
                onFilterChange={(nf) => { setFilters(nf); setPage(1); }}
            />

            <Divider sx={{ my: 3 }} />

            {/* Barra con conteo + export (idéntica ubicación y estilo) */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2">{productosCountText}</Typography>

                <Box>
                    <Button variant="contained" onClick={handleOpenExportMenu} endIcon={<MoreVertIcon />}>
                        Exportar
                    </Button>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseExportMenu}>
                        <MenuItem onClick={() => handleSelectExportFormat('excel')}>Exportar a Excel</MenuItem>
                        <MenuItem onClick={() => handleSelectExportFormat('pdf')}>Exportar a PDF</MenuItem>
                    </Menu>
                </Box>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                    <CircularProgress />
                </Box>
            ) : (
                <ProductosSinVentasTable
                    data={data}
                    onSortChange={handleSortChange}
                    ordenActual={orden}
                    ordenPorActual={ordenPor}
                />
            )}

            {totalPages > 1 && !loading && (
                <Box display="flex" justifyContent="center" mt={3}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                        siblingCount={1}
                        boundaryCount={1}
                    />
                </Box>
            )}

            {/* Snackbar de “data freshness” (misma posición/estilo) */}
            <Snackbar open={showMensaje} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} autoHideDuration={null} sx={{ maxWidth: '400px' }}>
                <Alert
                    severity="warning"
                    variant="filled"
                    action={
                        <IconButton aria-label="close" color="inherit" size="small" onClick={() => setShowMensaje(false)}>
                            <CloseIcon fontSize="inherit" />
                        </IconButton>
                    }
                    sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 3, fontSize: '0.9rem' }}
                >
                    Este informe se actualiza a diario. Si necesitas información más reciente, pide al usuario ADMIN que actualice la información.
                </Alert>
            </Snackbar>

            {/* Modal unificado para elegir cantidad (Excel/PDF) */}
            <Dialog open={openExportModal} onClose={() => setOpenExportModal(false)}>
                <DialogTitle>Exportar {exportTarget === 'excel' ? 'Excel' : 'PDF'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Cantidad a exportar (usa -1 para todo)"
                        type="number"
                        fullWidth
                        value={exportCount}
                        onChange={(e) => setExportCount(parseInt(e.target.value || "", 10))}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenExportModal(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={() => {
                        exportSinVentas(exportTarget, exportCount === -1 ? 'all' : exportCount);
                        setOpenExportModal(false);
                    }}>Exportar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProductosSinVentasPage;
