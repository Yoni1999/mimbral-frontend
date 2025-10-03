'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Box, Typography, Divider, Snackbar, Alert, IconButton,
    Pagination, CircularProgress, Button, Menu, MenuItem, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField,
    Table, TableHead, TableRow, TableCell, TableBody, Paper
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

// ---- Tipos ----
type Order = 'asc' | 'desc';
type OrderBy = 'stockTotal' | 'createDate';

interface FiltroSinVentas {
    sku?: string;              // filtro exclusivo por SKU
    minStock?: number;         // default 0
    fechaInicio?: string;      // YYYY-MM-DD
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

const limit = 20;
const ENDPOINT = '/api/informes/productos-sin-ventas';

const ProductosSinVentasPage: React.FC = () => {
    // Estado principal (tabla de sin ventas)
    const [filters, setFilters] = useState<FiltroSinVentas>({ minStock: 0 });
    const [data, setData] = useState<ProductoSinVentas[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);

    const [orden, setOrden] = useState<Order>('desc');
    const [ordenPor, setOrdenPor] = useState<OrderBy>('stockTotal');

    // Export
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openExportModal, setOpenExportModal] = useState(false);
    const [exportCount, setExportCount] = useState<number>(100);
    const [exportTarget, setExportTarget] = useState<'excel' | 'pdf'>('excel');

    // Snackbar informativo “fijo” (existente)
    const [showMensaje, setShowMensaje] = useState<boolean>(true);

    // Mensaje dinámico del endpoint (SKU con o sin ventas)
    const [endpointMsg, setEndpointMsg] = useState<string>('');

    // estado para vista de ventas por SKU ----
    const [skuSalesMode, setSkuSalesMode] = useState<boolean>(false);
    const [skuSalesItemCode, setSkuSalesItemCode] = useState<string>('');
    const [skuSales, setSkuSales] = useState<Array<{
        docNum: number;
        docDate: string;
        createDate: string;
        customer: string;
        quantity: number;
        price: number;
        currency: string;
        lineTotal: number;
    }>>([]);

    const totalPages = Math.ceil(Math.max(0, total) / limit);

    // Helpers
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

    // Fetch principal
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

            // Rama SKU (exclusiva)
            const skuTrim = (filtros.sku || '').trim();
            if (skuTrim) {
                // Siempre forzar order=desc al consultar por SKU
                const res = await fetchWithToken(
                    `${BACKEND_URL}${ENDPOINT}?order=desc&itemCode=${encodeURIComponent(skuTrim)}`
                );
                if (!res) {
                    // reset vista ventas
                    setSkuSalesMode(false);
                    setSkuSales([]);
                    setSkuSalesItemCode('');
                    setData([]);
                    setTotal(0);
                    return;
                }
                const json = await res.json();

                // Toaster con el message, si viene
                if (json?.message) {
                    setEndpointMsg(String(json.message));   // <<< lo guardamos para el snackbar info
                    setShowMensaje(true);                   // forzamos a que se muestre
                } else {
                    setEndpointMsg('');
                }


                // si hay ventas, activamos vista de ventas y mostramos salesLast4Months ---
                if (String(json?.mode) === 'lookupItemCodeWithSales' && Array.isArray(json?.salesLast4Months)) {
                    setSkuSalesMode(true);
                    setSkuSalesItemCode(String(json?.itemCode || skuTrim));
                    setSkuSales(json.salesLast4Months as any[]);
                    setData([]); // ocultamos tabla de sin ventas
                    setTotal(json.salesLast4Months.length || 0);
                    return;
                }

                // Si NO hay ventas: mostramos el producto igual (data != [])
                if (String(json?.mode) === 'lookupItemCodeNoSales') {
                    setSkuSalesMode(false);
                    setSkuSales([]);
                    setSkuSalesItemCode('');
                    const rows = Array.isArray(json?.data) ? json.data.map(mapRow) : [];
                    setData(rows);          // muestra el producto aunque no tenga ventas
                    const totalApi = typeof json?.total === 'number' ? json.total : undefined;
                    setTotal(totalApi ?? rows.length);
                    return;
                }


                // Si NO hay ventas (lookupItemCodeNoSales): mantener tabla de sin ventas (data puede venir vacía)
                setSkuSalesMode(false);
                setSkuSales([]);
                setSkuSalesItemCode('');
                const rows = Array.isArray(json?.data) ? json.data.map(mapRow) : [];
                setData(rows);
                const totalApi = typeof json?.total === 'number' ? json.total : undefined;
                setTotal(totalApi ?? rows.length);
                return;
            }

            // Rama SIN SKU (flujo tradicional)
            setSkuSalesMode(false);
            setSkuSales([]);
            setSkuSalesItemCode('');

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
            // si hubo error, asegúrate de no quedar "pegado" en modo ventas
            setSkuSalesMode(false);
            setSkuSales([]);
            setSkuSalesItemCode('');
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

    // Export (sin cambios de lógica respecto a lo existente)
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

            // Traer datos según límite
            const GUESS_MAX = 1000;
            let effectiveChunk = GUESS_MAX;
            let rows: ProductoSinVentas[] = [];

            if (exportLimit !== 'all') {
                const target = Math.max(0, Number(exportLimit));
                let collected = 0;
                let pageNum = 1;

                while (collected < target) {
                    const remainingBefore = target - collected;
                    const want = Math.min(effectiveChunk, remainingBefore);

                    const { rows: r } = await fetchPage(pageNum, want);

                    if (pageNum === 1 && r.length > 0 && r.length < want) {
                        effectiveChunk = r.length;
                    }

                    rows.push(...r);
                    collected += r.length;

                    const expectedForThisPage = Math.min(effectiveChunk, remainingBefore);
                    if (r.length < expectedForThisPage) break;

                    pageNum++;
                    if (pageNum > 5000) break;
                }

                if (rows.length > target) rows = rows.slice(0, target);

            } else {
                let pageNum = 1;
                while (true) {
                    const want = effectiveChunk;
                    const { rows: r } = await fetchPage(pageNum, want);

                    if (pageNum === 1 && r.length > 0 && r.length < want) {
                        effectiveChunk = r.length;
                    }

                    rows.push(...r);

                    if (r.length < Math.min(effectiveChunk, want)) break;

                    pageNum++;
                    if (pageNum > 5000) break;
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

    // Texto de conteo / encabezado dinámico
    const productosCountText = useMemo(() => {
        if (skuSalesMode) {
            return (
                <>Ventas últimos 4 meses para <strong>SKU {skuSalesItemCode}</strong>: <strong>{skuSales.length}</strong> movimientos</>
            );
        }
        if (total === 0) return 'Sin productos para mostrar';
        return <>Mostrando del <strong>{(page - 1) * limit + 1}</strong> al <strong>{Math.min(page * limit, total)}</strong> de <strong>{total}</strong> productos</>;
    }, [page, total, skuSalesMode, skuSales.length, skuSalesItemCode]);

    // tabla de ventas por SKU (inline, sin tocar componentes existentes) ----
    const SalesBySkuTable: React.FC<{
        rows: typeof skuSales;
    }> = ({ rows }) => {
        const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '');
        const fmtNumber = (n: number) => Intl.NumberFormat('es-CL').format(n);
        const fmtMoney = (n: number, currency: string) =>
            `${currency} ${Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)}`;

        return (
            <Paper variant="outlined" sx={{ width: '100%', overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Doc N°</strong></TableCell>
                            <TableCell><strong>Fecha</strong></TableCell>
                            <TableCell><strong>Cliente</strong></TableCell>
                            <TableCell align="right"><strong>Cantidad</strong></TableCell>
                            <TableCell align="right"><strong>Precio</strong></TableCell>
                            <TableCell align="right"><strong>Moneda</strong></TableCell>
                            <TableCell align="right"><strong>Total línea</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((r, idx) => (
                            <TableRow key={`${r.docNum}-${idx}`} hover>
                                <TableCell>{r.docNum}</TableCell>
                                <TableCell>{fmtDate(r.docDate || r.createDate)}</TableCell>
                                <TableCell>{r.customer}</TableCell>
                                <TableCell align="right">{fmtNumber(r.quantity)}</TableCell>
                                <TableCell align="right">{fmtMoney(r.price, r.currency)}</TableCell>
                                <TableCell align="right">{r.currency}</TableCell>
                                <TableCell align="right">{fmtMoney(r.lineTotal, r.currency)}</TableCell>
                            </TableRow>
                        ))}
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">Sin ventas para mostrar</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>
        );
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

            {/* Filtros (drawer) */}
            <HeaderSinVentasDrawer
                currentFilters={filters}
                onFilterChange={(nf) => { setFilters(nf); setPage(1); }}
            />

            <Divider sx={{ my: 3 }} />

            {/* Barra con conteo + export */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2">{productosCountText}</Typography>

                {!skuSalesMode && (
                    <Box>
                        <Button variant="contained" onClick={handleOpenExportMenu} endIcon={<MoreVertIcon />}>
                            Exportar
                        </Button>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseExportMenu}>
                            <MenuItem onClick={() => handleSelectExportFormat('excel')}>Exportar a Excel</MenuItem>
                            <MenuItem onClick={() => handleSelectExportFormat('pdf')}>Exportar a PDF</MenuItem>
                        </Menu>
                    </Box>
                )}
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                    <CircularProgress />
                </Box>
            ) : skuSalesMode ? (
                // vista de ventas por SKU cuando la API trae salesLast4Months ----
                <SalesBySkuTable rows={skuSales} />
            ) : (
                <ProductosSinVentasTable
                    data={data}
                    onSortChange={handleSortChange}
                    ordenActual={orden}
                    ordenPorActual={ordenPor}
                />
            )}

            {/* Paginación solo para la lista de sin ventas */}
            {totalPages > 1 && !loading && !skuSalesMode && (
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

            {/* Snackbar info existente */}
            <Snackbar
                open={showMensaje}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                autoHideDuration={null}
                sx={{ maxWidth: '400px' }}
            >
                <Alert
                    severity="warning"
                    variant="filled"
                    action={
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            size="small"
                            onClick={() => setShowMensaje(false)}
                        >
                            <CloseIcon fontSize="inherit" />
                        </IconButton>
                    }
                    sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 3, fontSize: '0.9rem' }}
                >
                    {endpointMsg
                        ? endpointMsg
                        : 'Este informe se actualiza a diario. Si necesitas información más reciente, pide al usuario ADMIN que actualice la información.'}
                </Alert>
            </Snackbar>

            {/* Modal export */}
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
