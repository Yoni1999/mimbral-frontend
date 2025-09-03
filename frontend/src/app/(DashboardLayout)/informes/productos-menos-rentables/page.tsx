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
import autoTable from 'jspdf-autotable';

import { fetchWithToken } from '@/utils/fetchWithToken';
import { BACKEND_URL } from "@/config";

// ---- Tipos (siguen el estilo de ventas-productos) ----
type Order = 'asc' | 'desc';
type OrderBy = 'cantidadVendida' | 'facturasUnicas' | 'totalVentas' | 'margenBruto' | 'precioPromedio';

interface FiltroVentas {
    canal?: string | string[]; // multiples canales
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
    const [exportTarget, setExportTarget] = useState<'excel' | 'pdf'>('excel'); // <-- unificado

    const totalPages = Math.ceil(total / limit);

    // api de productos menos rentables
    const fetchProductos = async (
        filtros: FiltroVentas,
        pageNumber = 1,
        campoOrden?: OrderBy,     // override opcional
        direccionOrden?: Order    // override opcional
    ) => {
        setLoading(true);

        // --- helpers locales ---
        const isYYYYMMDD = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
        const hasValidRange = (a?: string, b?: string) => isYYYYMMDD(a) && isYYYYMMDD(b);

        const parsePercent = (txt?: string | null) => {
            if (!txt) return 0;
            const n = Number(String(txt).replace("%", "").replace(",", ".").trim());
            return Number.isFinite(n) ? n : 0;
        };
        const splitProduct = (s: string) => {
            const [sku = "", name = ""] = (s || "").split(" / ");
            return { sku: sku.trim(), nombre: name.trim() };
        };
        const splitHierarchy = (s: string) => {
            const [nivel = "", cat = ""] = (s || "").split(" / ");
            return { primerNivel: (nivel || "").trim(), categoria: (cat || "").trim() };
        };

        // --- helpers locales ---
        const toCsvLower = (v?: string | string[]) =>
            Array.isArray(v)
                ? v.map(x => String(x).trim().toLowerCase()).filter(Boolean).join(',')
                : (v ? String(v).trim().toLowerCase() : '');

        try {
            // helper local para normalizar canal a CSV en minúsculas (sin mover otros helpers)
            const toCsvLower = (v?: string | string[]) =>
                Array.isArray(v)
                    ? v.map(x => String(x).trim().toLowerCase()).filter(Boolean).join(',')
                    : (v ? String(v).trim().toLowerCase() : '');

            // --- reglas mínimas exigidas por la API ---
            const canalCsv = toCsvLower(filtros.canal ?? "");
            const periodo = filtros.periodo ?? null;
            const { fechaInicio, fechaFin } = filtros;

            const tieneRango = hasValidRange(fechaInicio, fechaFin);
            const tienePeriodo = !!periodo && !tieneRango; // si hay rango, no enviamos periodo

            if (!canalCsv || (!tienePeriodo && !tieneRango)) {
                setProductos([]);
                setTotal(0);
                return;
            }

            // --- orden actual (toma overrides si vienen)
            //  ---
            const ob: OrderBy = campoOrden ?? ordenPor;
            const od: Order = direccionOrden ?? orden;

            // map a campos válidos del backend
            const orderByMap: Record<
                OrderBy,
                "Rentabilidad_Total" | "Cantidad_Vendida" | "Precio_Venta_Promedio" | "Costo_Promedio" | "Margen_Porcentaje"
            > = {
                cantidadVendida: "Cantidad_Vendida",
                facturasUnicas: "Cantidad_Vendida",      // proxy (API no trae transacciones)
                totalVentas: "Rentabilidad_Total",       // aprox. visual
                margenBruto: "Rentabilidad_Total",       // idem
                precioPromedio: "Precio_Venta_Promedio",
            };

            // --- query ---
            const params = new URLSearchParams();
            params.append("canal", canalCsv);
            if (tienePeriodo) params.append("periodo", String(periodo)); // no enviar si hay rango válido
            if (tieneRango) {
                params.append("fechaInicio", String(fechaInicio));
                params.append("fechaFin", String(fechaFin));
            }
            if (filtros.proveedor) params.append("proveedor", filtros.proveedor);
            if (filtros.primerNivel) params.append("primerNivel", filtros.primerNivel);
            if (filtros.categoria) params.append("categoria", filtros.categoria);
            if (filtros.subcategoria) params.append("subcategoria", filtros.subcategoria);

            // paginación según tu componente
            params.append("page", String(pageNumber));
            params.append("pageSize", String(limit)); // usa tu limit actual (20)

            // orden
            params.append("orderBy", orderByMap[ob] ?? "Rentabilidad_Total");
            params.append("order", od === "asc" ? "asc" : "desc");

            // --- llamada con token ---
            const res = await fetchWithToken(
                `${BACKEND_URL}/api/informes/productos-menos-rentables?${params.toString()}`
            );
            if (!res) {
                setProductos([]);
                setTotal(0);
                return;
            }

            const data = await res.json();

            // --- adaptación al shape de tu tabla ---
            const rows: ProductoMenosRentable[] = Array.isArray(data?.data)
                ? data.data.map((r: any) => {
                    const { sku, nombre } = splitProduct(r.product);
                    const { primerNivel, categoria } = splitHierarchy(r.hierarchy);
                    return {
                        sku,
                        nombre,
                        imagen: r.image || undefined,
                        primerNivel,
                        categoria,
                        cantidadVendida: r.soldQuantity ?? 0,
                        facturasUnicas: r.soldQuantity ?? 0, // proxy para mantener columna
                        totalVentas: Math.round((r.avgPrice || 0) * (r.soldQuantity || 0)), // aprox. visual
                        margenBruto: r.totalProfit ?? 0,
                        margenPorcentaje: parsePercent(r.profitMargin),
                        precioPromedio: r.avgPrice ?? 0,
                        stockCanal: r.totalStock ?? 0,
                        stockChorrillo: r.chorrilloStock ?? 0,
                        stockOnOrder: r.onOrderStock ?? 0,
                    };
                })
                : [];

            setProductos(rows);

            // total: usa el de la API si viene; si no, estima para no romper paginación
            const totalApi = typeof data?.total === "number" ? data.total : undefined;
            const estimated = (pageNumber - 1) * limit + rows.length + (rows.length === limit ? 1 : 0);
            setTotal(totalApi ?? estimated);
        } catch (error: any) {
            console.error("Error al cargar productos menos rentables:", error?.message || error);
            setProductos([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }

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

    // ---- Exportar ----
    const handleOpenExportMenu = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
    const handleCloseExportMenu = () => setAnchorEl(null);
    const handleSelectExportFormat = (format: 'excel' | 'pdf') => {
        setAnchorEl(null);
        setExportTarget(format);     // guardar destino
        setOpenExportModal(true);    // abrir único modal
    };


    const exportProductos = async (tipo: 'excel' | 'pdf', exportLimit: number | 'all') => {
        // En mock exportamos desde todo el dataset ordenado actual
        // --- exportación real desde backend usando filtros vigentes ---

        setLoading(true);
        try {
            // helpers internos (duplicados para no mover los de fetchProductos)
            const toCsvLowerLocal = (v?: string | string[]) =>
                Array.isArray(v)
                    ? v.map(x => String(x).trim().toLowerCase()).filter(Boolean).join(',')
                    : (v ? String(v).trim().toLowerCase() : '');

            const parsePercent = (txt?: string | null) => {
                if (!txt) return 0;
                const n = Number(String(txt).replace("%", "").replace(",", ".").trim());
                return Number.isFinite(n) ? n : 0;
            };
            const splitProduct = (s: string) => {
                const [sku = "", name = ""] = (s || "").split(" / ");
                return { sku: sku.trim(), nombre: name.trim() };
            };
            const splitHierarchy = (s: string) => {
                const [nivel = "", cat = ""] = (s || "").split(" / ");
                return { primerNivel: (nivel || "").trim(), categoria: (cat || "").trim() };
            };
            const mapRow = (r: any) => {
                const { sku, nombre } = splitProduct(r.product);
                const { primerNivel, categoria } = splitHierarchy(r.hierarchy);
                return {
                    sku,
                    nombre,
                    imagen: r.image || undefined,
                    primerNivel,
                    categoria,
                    cantidadVendida: r.soldQuantity ?? 0,
                    facturasUnicas: r.soldQuantity ?? 0,
                    totalVentas: Math.round((r.avgPrice || 0) * (r.soldQuantity || 0)),
                    margenBruto: r.totalProfit ?? 0,
                    margenPorcentaje: parsePercent(r.profitMargin),
                    precioPromedio: r.avgPrice ?? 0,
                    stockCanal: r.totalStock ?? 0,
                    stockChorrillo: r.chorrilloStock ?? 0,
                    stockOnOrder: r.onOrderStock ?? 0,
                } as ProductoMenosRentable;
            };

            // mismos checks que fetchProductos
            const canalCsv = toCsvLowerLocal(filters.canal);
            const { periodo, fechaInicio, fechaFin } = filters;
            const isYYYYMMDD = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
            const hasValidRange = (a?: string, b?: string) => isYYYYMMDD(a) && isYYYYMMDD(b);
            const tieneRango = hasValidRange(fechaInicio, fechaFin);
            const tienePeriodo = !!periodo && !tieneRango;

            if (!canalCsv || (!tienePeriodo && !tieneRango)) {
                return;
            }

            // map de orden
            const orderByMap: Record<
                OrderBy,
                "Rentabilidad_Total" | "Cantidad_Vendida" | "Precio_Venta_Promedio" | "Costo_Promedio" | "Margen_Porcentaje"
            > = {
                cantidadVendida: "Cantidad_Vendida",
                facturasUnicas: "Cantidad_Vendida",
                totalVentas: "Rentabilidad_Total",
                margenBruto: "Rentabilidad_Total",
                precioPromedio: "Precio_Venta_Promedio",
            };

            // params base
            const base = new URLSearchParams();
            base.append("canal", canalCsv);
            if (tienePeriodo) base.append("periodo", String(periodo));
            if (tieneRango) {
                base.append("fechaInicio", String(fechaInicio));
                base.append("fechaFin", String(fechaFin));
            }
            if (filters.proveedor) base.append("proveedor", filters.proveedor);
            if (filters.primerNivel) base.append("primerNivel", filters.primerNivel);
            if (filters.categoria) base.append("categoria", filters.categoria);
            if (filters.subcategoria) base.append("subcategoria", filters.subcategoria);
            base.append("orderBy", orderByMap[ordenPor] ?? "Rentabilidad_Total");
            base.append("order", orden === "asc" ? "asc" : "desc");

            // función para pedir una página
            const fetchPage = async (pageNum: number, pageSize: number) => {
                const params = new URLSearchParams(base);
                params.append("page", String(pageNum));
                params.append("pageSize", String(pageSize));
                const res = await fetchWithToken(`${BACKEND_URL}/api/informes/productos-menos-rentables?${params.toString()}`);
                const json = await res!.json();
                const rows = Array.isArray(json?.data) ? json.data.map(mapRow) : [];
                const totalApi = typeof json?.total === "number" ? json.total : undefined;
                return { rows, totalApi };
            };

            // traer datos según límite (resiliente a límites de pageSize del backend)
            const MAX_CHUNK = 1000; // muchas APIs ponen tope en 1000

            let rows: ProductoMenosRentable[] = [];

            if (exportLimit !== "all") {
                const target = Math.max(0, Number(exportLimit));
                let collected = 0;
                let pageNum = 1;

                while (collected < target) {
                    const want = Math.min(MAX_CHUNK, target - collected);
                    const { rows: r } = await fetchPage(pageNum, want);
                    rows.push(...r);
                    collected += r.length;

                    // si el backend devolvió menos que lo pedido, no hay más datos
                    if (r.length < want) break;

                    pageNum++;
                    if (pageNum > 5000) break; // guardrail absurdo por si las moscas
                }

                // recorta exacto por si algún tramo devolvió de más
                if (rows.length > target) rows = rows.slice(0, target);

            } else {
                // “todos” → loop paginado grande hasta agotar
                const pageSize = MAX_CHUNK;
                let pageNum = 1;
                while (true) {
                    const { rows: r } = await fetchPage(pageNum, pageSize);
                    rows.push(...r);
                    if (r.length < pageSize) break; // ya no hay más
                    pageNum++;
                    if (pageNum > 5000) break; // guardrail
                }
            }

            // salida
            if (tipo === 'excel') {
                const ws = XLSX.utils.json_to_sheet(
                    rows.map((item, idx) => ({
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
                // PDF: usar la función importada autoTable(doc, ...)
                const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
                doc.setFontSize(16);
                doc.text('Informe de Productos menos Rentables', 40, 40);

                doc.setFontSize(10);
                const canalLabel = Array.isArray(filters.canal)
                    ? filters.canal.join(', ')
                    : (filters.canal || 'Todos');

                const info = [
                    `Canal: ${canalLabel}`,
                    `Período: ${filters.periodo}`,
                    `Fecha: ${new Date().toLocaleString()}`
                ];

                let startY = 60;
                const lineHeight = 14;
                info.forEach((line) => {
                    doc.text(line, 40, startY);
                    startY += lineHeight;
                });

                doc.setDrawColor(200);
                doc.setLineWidth(1);
                const infoBlockBottom = startY + 6;
                doc.line(40, infoBlockBottom, 800, infoBlockBottom);

                autoTable(doc, {
                    startY: infoBlockBottom + 12,
                    head: [[
                        '#', 'SKU', 'Nombre', 'Primer Nivel', 'Categoría', 'Cant.', 'Transac.',
                        'Total', 'Margen', '%', 'Precio', 'Stock', 'Chorrillo', 'OC'
                    ]],
                    body: rows.map((item, idx) => [
                        idx + 1,
                        item.sku,
                        item.nombre,
                        item.primerNivel || '',
                        item.categoria || '',
                        item.cantidadVendida,
                        item.facturasUnicas,
                        item.totalVentas,
                        item.margenBruto,
                        `${(item.margenPorcentaje ?? 0).toFixed(2)}%`,
                        item.precioPromedio,
                        item.stockCanal,
                        item.stockChorrillo ?? 'N/A',
                        item.stockOnOrder ?? 'N/A',
                    ]),
                    headStyles: { fillColor: [93, 135, 255], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
                    styles: { fontSize: 9, cellPadding: 4, valign: "middle", textColor: 20 },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                });

                doc.save('productos_menos_rentables.pdf');
            }

        } catch (err) {
            console.error('Error al exportar productos menos rentables:', err);
        } finally {
            setLoading(false);
        }
    };

    // --- helpers para PDF ---
    const obtenerNombreUsuario = async () => {
        try { return localStorage.getItem('userName') || 'Usuario'; } catch { return 'Usuario'; }
    };

    const canalToLabel = (canal?: string | string[]) => {
        if (!canal) return 'Todos';
        return Array.isArray(canal) ? canal.join(', ') : canal;
    };

    const rangoTexto = (periodo?: string, fi?: string, ff?: string) => {
        const isYYYYMMDD = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
        if (isYYYYMMDD(fi) && isYYYYMMDD(ff)) return `Rango: ${fi} a ${ff}`;
        return `Período: ${periodo ?? '-'}`;
    };

    const exportToPDF = (productosData: ProductoMenosRentable[], usuario: string) => {
        if (!Array.isArray(productosData) || productosData.length === 0) {
            console.warn("No hay datos para exportar a PDF.");
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

        // Título
        doc.setFontSize(16);
        doc.text('Informe de Productos menos Rentables', 40, 40);

        // Bloque de información (similar a Ventas de Productos)
        doc.setFontSize(10);
        const info = [
            `Generado por: ${usuario}`,
            `Fecha: ${new Date().toLocaleString()}`,
            `Canal: ${canalToLabel(filters.canal)}`,
            rangoTexto(filters.periodo, filters.fechaInicio, filters.fechaFin),
        ];

        let startY = 60;
        const lineHeight = 14;
        info.forEach((line) => {
            doc.text(line, 40, startY);
            startY += lineHeight;
        });

        // Línea divisoria
        doc.setDrawColor(200);
        doc.setLineWidth(1);
        const infoBlockBottom = startY + 6;
        doc.line(40, infoBlockBottom, 800, infoBlockBottom);

        // Columnas (basadas en las del PDF de ventas y en tu tabla actual)
        const columnas = [
            { key: "numero", label: "#" },
            { key: "sku", label: "SKU" },
            { key: "nombre", label: "Nombre" },
            { key: "primerNivel", label: "Primer Nivel" },
            { key: "categoria", label: "Categoría" },
            { key: "cantidadVendida", label: "Cant." },
            { key: "facturasUnicas", label: "Transac." },
            { key: "totalVentas", label: "Total" },
            { key: "margenBruto", label: "Margen" },
            { key: "margenPorcentaje", label: "% Margen" },
            { key: "precioPromedio", label: "Precio" },
            { key: "stockCanal", label: "Stock" },
            { key: "stockChorrillo", label: "Chorrillo" },
            { key: "stockOnOrder", label: "OC (On Order)" },
        ];

        const headers = columnas.map(c => c.label);
        const rows = productosData.map((item, index) =>
            columnas.map(c => {
                if (c.key === "numero") return String(index + 1);
                if (c.key === "margenPorcentaje") return `${(item.margenPorcentaje ?? 0).toFixed(2)}%`;
                const v = (item as any)[c.key];
                return v === undefined || v === null ? 'N/A' : v;
            })
        );

        // Tabla
        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: infoBlockBottom + 12,
            headStyles: { fillColor: [93, 135, 255], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
            styles: { fontSize: 9, cellPadding: 4, valign: "middle", textColor: 20 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        doc.save("productos_menos_rentables.pdf");
    };

    const exportConfirm = () => {
        exportProductos(exportTarget, exportCount === -1 ? 'all' : exportCount);
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
                Revisa el detalle de productos menos rentables por período, canal, proveedor y más.
            </Typography>

            {/* Filtros reutilizando el header existente */}
            <HeaderVentasProductosDrawer
                onFilterChange={handleFilterChange}
                currentFilters={filters}
                multiCanal={true}   // <-- habilita selección múltiple de canal
            />
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
                    <Button variant="contained" onClick={exportConfirm}>Exportar</Button>
                </DialogActions>
            </Dialog>


        </Box>
    );
};

export default ProductosMenosRentablesPage;
