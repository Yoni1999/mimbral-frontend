// informes/productos-menos-rentables/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Box, Typography, Divider, Snackbar, Alert, IconButton,
    Pagination, CircularProgress, Button, Menu, MenuItem, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import HeaderVentasProductosDrawer from '../ventas-productos/components/HeaderVentasProductosDrawer';
import ProductosMenosRentablesTable from './components/ProductosMenosRentablesTable';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ---- Tipos (siguen el estilo de ventas-productos) ----
type Order = 'asc' | 'desc';
type OrderBy = 'cantidadVendida' | 'facturasUnicas' | 'totalVentas' | 'margenBruto' | 'precioPromedio';

interface FiltroVentas {
    canal?: string;
    periodo: string;
    fechaInicio?: string;
    fechaFin?: string;
    proveedor?: string;
    primerNivel?: string;
    categoria?: string;
    subcategoria?: string;
    tipoEnvio?: 'full' | 'colecta' | 'todas';
}

export interface ProductoMenosRentable {
    sku: string;
    nombre: string;
    imagen?: string;
    primerNivel?: string | null;
    categoria?: string | null;
    cantidadVendida: number;
    facturasUnicas: number;
    totalVentas: number;       // CLP
    margenBruto: number;       // CLP
    margenPorcentaje: number;  // %
    precioPromedio: number;    // CLP
    stockCanal: number;
    stockChorrillo?: number;
    stockOnOrder?: number;
}

// mock con los datos
export const MOCK_PRODUCTOS_MENOS_RENTABLES: ProductoMenosRentable[] = [
    {
        sku: '045001003',
        nombre: 'COPLA BRONCE SO SO 1/2',
        imagen: '',
        primerNivel: 'Gasfitería y Electricidad',
        categoria: 'Cañerías, Tubos y Fittings',
        cantidadVendida: 10,
        facturasUnicas: 1,
        totalVentas: 5800000, // $5.8k
        margenBruto: 3100000, // $3.1k
        margenPorcentaje: 53.07,
        precioPromedio: 68900, // $690
        stockCanal: 858,
        stockChorrillo: 858,
        stockOnOrder: 200,
    },
    {
        sku: '045006003',
        nombre: 'CODO BRONCE SO-SO 1/2',
        imagen: '',
        primerNivel: 'Gasfitería y Electricidad',
        categoria: 'Cañerías, Tubos y Fittings',
        cantidadVendida: 10,
        facturasUnicas: 1,
        totalVentas: 6300000, // $6.3k
        margenBruto: 2000000, // $2.0k
        margenPorcentaje: 32.14,
        precioPromedio: 75000, // $750
        stockCanal: 5894,
        stockChorrillo: 5894,
        stockOnOrder: 0,
    },
    {
        sku: '153003007',
        nombre: 'ABRAZADERA COBRE 13MM (1/2") MEC',
        imagen: '',
        primerNivel: 'Gasfitería y Electricidad',
        categoria: 'Llaves y Válvulas de Agua',
        cantidadVendida: 6,
        facturasUnicas: 1,
        totalVentas: 3500000, // $3.5k
        margenBruto: 2400000, // $2.4k
        margenPorcentaje: 69.73,
        precioPromedio: 68900, // $690
        stockCanal: 146,
        stockChorrillo: 146,
        stockOnOrder: 0,
    },
    {
        sku: '046005002',
        nombre: 'CAÑERIA COBRE TIPO M 1/2X8MT',
        imagen: '',
        primerNivel: 'Gasfitería y Electricidad',
        categoria: 'Cañerías, Tubos y Fittings',
        cantidadVendida: 4,
        facturasUnicas: 1,
        totalVentas: 90700000, // $90.7k
        margenBruto: 21100000, // $21.1k
        margenPorcentaje: 23.25,
        precioPromedio: 27000000, // $27.0k
        stockCanal: 353,
        stockChorrillo: 353,
        stockOnOrder: 600,
    },
    {
        sku: '075010001',
        nombre: 'MALLA ACMA CONSTRUCCION C92 15X15X2.80X5MT',
        imagen: '',
        primerNivel: 'Materiales De Construcción',
        categoria: 'Mallas y Alambres',
        cantidadVendida: 3,
        facturasUnicas: 1,
        totalVentas: 55400000, // $55.4k
        margenBruto: 11100000, // $11.1k
        margenPorcentaje: 20.10,
        precioPromedio: 22000000, // $22.0k
        stockCanal: 1573,
        stockChorrillo: 1573,
        stockOnOrder: 2400,
    },
    {
        sku: '555004077',
        nombre: 'RASPADOR CON MANGO 1.2M URO',
        imagen: '',
        primerNivel: 'Herramientas y Maquinarias',
        categoria: 'Herramientas de Construcción',
        cantidadVendida: 2,
        facturasUnicas: 2,
        totalVentas: 11700000, // $11.7k
        margenBruto: 5800000,  // $5.8k
        margenPorcentaje: 47.31,
        precioPromedio: 7000000, // $7.0k
        stockCanal: 71,
        stockChorrillo: 71,
        stockOnOrder: 0,
    },
    {
        sku: '046001002',
        nombre: 'CAÑERIA COBRE TIPO L 1/2X6MT',
        imagen: '',
        primerNivel: 'Gasfitería y Electricidad',
        categoria: 'Cañerías, Tubos y Fittings',
        cantidadVendida: 2,
        facturasUnicas: 1,
        totalVentas: 62800000, // $62.8k
        margenBruto: 13800000, // $13.8k
        margenPorcentaje: 22.20,
        precioPromedio: 27000000, // $27.0k
        stockCanal: 359,
        stockChorrillo: 359,
        stockOnOrder: 0,
    },
];


const limit = 20;

const ProductosMenosRentablesPage: React.FC = () => {
    // Estado
    const [filters, setFilters] = useState<FiltroVentas>({ periodo: '7D', canal: 'Vitex' });
    const [productos, setProductos] = useState<ProductoMenosRentable[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const [showMensaje, setShowMensaje] = useState<boolean>(true);

    const [orden, setOrden] = useState<Order>('asc');
    const [ordenPor, setOrdenPor] = useState<OrderBy>('margenBruto');

    // Export
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openExportModal, setOpenExportModal] = useState(false);
    const [exportCount, setExportCount] = useState<number>(100);

    const totalPages = Math.ceil(total / limit);

    // Carga (mock) — mantiene el patrón de fetch pero sin API
    const fetchProductos = (filtros: FiltroVentas, pageNumber = 1, campoOrden: OrderBy = ordenPor, direccionOrden: Order = orden) => {
        setLoading(true);
        // Simula paginación/orden
        setTimeout(() => {
            const sorted = [...MOCK_PRODUCTOS_MENOS_RENTABLES].sort((a, b) => {
                const av = a[campoOrden] as number;
                const bv = b[campoOrden] as number;
                return direccionOrden === 'asc' ? av - bv : bv - av;
            });
            const offset = (pageNumber - 1) * limit;
            setProductos(sorted.slice(offset, offset + limit));
            setTotal(sorted.length);
            setLoading(false);
        }, 300);
    };

    useEffect(() => {
        fetchProductos(filters, 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const handleFilterChange = (newFilters: FiltroVentas) => {
        setFilters(newFilters);
        setPage(1);
    };

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        fetchProductos(filters, value);
    };

    const handleSortChange = (campo: OrderBy) => {
        const nuevoOrden = ordenPor === campo && orden === 'asc' ? 'desc' : 'asc';
        setOrden(nuevoOrden);
        setOrdenPor(campo);
        fetchProductos(filters, page, campo, nuevoOrden);
    };

    // ---- Exportar (mismo patrón que ventas) ----
    const handleOpenExportMenu = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
    const handleCloseExportMenu = () => setAnchorEl(null);
    const handleSelectExportFormat = (format: 'excel' | 'pdf') => {
        setAnchorEl(null);
        if (format === 'excel') {
            setOpenExportModal(true);
        } else {
            exportProductos('pdf', 'all');
        }
    };

    const exportProductos = (tipo: 'excel' | 'pdf', exportLimit: number | 'all') => {
        // En mock exportamos desde todo el dataset ordenado actual
        const sorted = [...MOCK_PRODUCTOS_MENOS_RENTABLES].sort((a, b) => {
            const av = a[ordenPor] as number;
            const bv = b[ordenPor] as number;
            return orden === 'asc' ? av - bv : bv - av;
        });
        const data = exportLimit === 'all' ? sorted : sorted.slice(0, exportLimit);

        if (tipo === 'excel') {
            const ws = XLSX.utils.json_to_sheet(
                data.map((item, idx) => ({
                    '#': idx + 1,
                    SKU: item.sku,
                    Nombre: item.nombre,
                    'Primer Nivel': item.primerNivel,
                    Categoría: item.categoria,
                    'Cantidad Vendida': item.cantidadVendida,
                    Transacciones: item.facturasUnicas,
                    'Total Ventas': item.totalVentas,
                    'Margen Bruto': item.margenBruto,
                    '% Margen': item.margenPorcentaje,
                    'Precio Promedio': item.precioPromedio,
                    'Stock Canal': item.stockCanal,
                    'Stock Chorrillo': item.stockChorrillo ?? 'N/A',
                    'OC (On Order)': item.stockOnOrder ?? 'N/A',
                }))
            );
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Productos menos rentables');
            XLSX.writeFile(wb, 'productos_menos_rentables.xlsx');
        } else {
            const doc = new jsPDF();
            doc.setFontSize(12);
            doc.text('Informe de Productos menos Rentables', 14, 16);
            doc.setFontSize(10);
            doc.text(`Canal: ${filters.canal || 'Todos'} | Período: ${filters.periodo}`, 14, 22);

            (doc as any).autoTable({
                startY: 28,
                head: [[
                    '#', 'SKU', 'Nombre', 'Primer Nivel', 'Categoría', 'Cant.', 'Transac.',
                    'Total', 'Margen', '%', 'Precio', 'Stock', 'Chorrillo', 'OC'
                ]],
                body: data.map((item, idx) => [
                    idx + 1,
                    item.sku,
                    item.nombre,
                    item.primerNivel || '',
                    item.categoria || '',
                    item.cantidadVendida,
                    item.facturasUnicas,
                    item.totalVentas,
                    item.margenBruto,
                    `${item.margenPorcentaje.toFixed(2)}%`,
                    item.precioPromedio,
                    item.stockCanal,
                    item.stockChorrillo ?? 'N/A',
                    item.stockOnOrder ?? 'N/A',
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [33, 150, 243] },
            });

            doc.save('productos_menos_rentables.pdf');
        }
    };

    const exportToExcelConfirm = () => {
        exportProductos('excel', exportCount === -1 ? 'all' : exportCount);
        setOpenExportModal(false);
    };

    const productosCountText = useMemo(() => {
        if (total === 0) return 'Sin productos para mostrar';
        return <>Mostrando del <strong>{(page - 1) * limit + 1}</strong> al <strong>{Math.min(page * limit, total)}</strong> de <strong>{total}</strong> productos</>;
    }, [page, total]);

    return (
        <Box p={0}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingDownIcon color="primary" fontSize="large" />
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Informe de Productos menos Rentables
                </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" gutterBottom>
                Revisa el detalle de productos vendidos por período, canal, proveedor y más.
            </Typography>

            {/* Filtros reutilizando el header existente */}
            <HeaderVentasProductosDrawer onFilterChange={handleFilterChange} currentFilters={filters} />
            <Divider sx={{ my: 3 }} />

            {/* Barra con conteo + export */}
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
                <ProductosMenosRentablesTable
                    data={productos}
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

            {/* Snackbar de “data freshness” como en otros informes */}
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

            {/* Modal para elegir cantidad a exportar */}
            <Dialog open={openExportModal} onClose={() => setOpenExportModal(false)}>
                <DialogTitle>Exportar a Excel</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Cantidad a exportar (usa -1 para todo)"
                        type="number"
                        fullWidth
                        value={exportCount}
                        onChange={(e) => setExportCount(parseInt(e.target.value || '0', 10))}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenExportModal(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={exportToExcelConfirm}>Exportar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProductosMenosRentablesPage;
