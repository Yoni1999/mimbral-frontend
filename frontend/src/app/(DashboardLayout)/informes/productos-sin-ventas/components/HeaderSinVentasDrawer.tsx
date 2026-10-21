'use client';

import React, { useEffect, useState } from "react";
import {
    Box, Drawer, IconButton, Typography, Divider, Grid,
    FormControl, InputLabel, Select, MenuItem, Button,
    TextField, Chip, Avatar, ListItemIcon, ListItemText
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";

export interface FiltroSinVentas {
    sku?: string;           // filtro exclusivo por SKU
    minStock?: number;      // default 0
    fechaInicio?: string;   // YYYY-MM-DD
    primerNivel?: string;
    categoria?: string;
    subcategoria?: string;
}

interface Categoria {
    codigo: string;
    nombre: string;
    imagen?: string;
}

interface Props {
    onFilterChange: (filters: FiltroSinVentas) => void;
    currentFilters?: FiltroSinVentas;
}

// Adapta la respuesta de categorías / subcategorías a lo que muestran los selects.
const aCategorias = (data: any): Categoria[] =>
    (Array.isArray(data) ? data : []).map((c: any) => ({ codigo: c.codigo, nombre: c.nombre, imagen: c.imagen }));

const HeaderSinVentasDrawer: React.FC<Props> = ({ onFilterChange, currentFilters }) => {
    const [open, setOpen] = useState(false);
    const [filters, setFilters] = useState<FiltroSinVentas>(() => currentFilters || { minStock: 0 });

    const [primerNiveles, setPrimerNiveles] = useState<Categoria[]>([]);

    // modo SKU: si hay texto en sku, el resto de filtros se desactiva
    const skuMode = Boolean((filters.sku || '').trim());

    // Carga inicial de primer nivel
    useEffect(() => {
        (async () => {
            try {
                const res = await apiJson(`${BACKEND_URL}/api/resumen-categoria/primer-nivel`);
                const data = await res!.json();
                setPrimerNiveles(data);
            } catch (e) {
                console.error("Error fetching primer nivel:", e);
            }
        })();
    }, []);

    // Listas en cascada: salen de lo elegido (también de los filtros iniciales).
    // Si cambia la selección se cancela la carga anterior y una lista vieja no
    // pisa a la nueva.
    const urlCategorias = filters.primerNivel
        ? `${BACKEND_URL}/api/resumen-categoria/mostrar-categorias?primerNivel=${filters.primerNivel}`
        : null;
    const { datos: categorias } = useCargaDatos<Categoria[]>(
        urlCategorias,
        async (signal) => aCategorias(await apiJson(urlCategorias as string, { signal })),
        []
    );
    const urlSubcategorias = filters.categoria
        ? `${BACKEND_URL}/api/resumen-categoria/tercer-nivel?categoria=${filters.categoria}`
        : null;
    const { datos: subcategorias } = useCargaDatos<Categoria[]>(
        urlSubcategorias,
        async (signal) => aCategorias(await apiJson(urlSubcategorias as string, { signal })),
        []
    );

    const handleChange = (key: keyof FiltroSinVentas, value: any) => {
        // Si se escribe en SKU, limpiar y desactivar el resto
        if (key === "sku") {
            const v = String(value || "").trim();
            if (v.length > 0) {
                const onlySku: FiltroSinVentas = {
                    sku: v,
                    // el resto queda limpio/inactivo por skuMode
                    minStock: 0,
                    fechaInicio: undefined,
                    primerNivel: undefined,
                    categoria: undefined,
                    subcategoria: undefined,
                };
                setFilters(onlySku);
                return;
            } else {
                // al vaciar SKU, solo quitamos sku y reactivamos los otros (sin setear nada extra)
                setFilters(prev => ({ ...prev, sku: undefined }));
                return;
            }
        }

        // Si NO es sku: flujo normal (pero respetando skuMode con disabled en los inputs)
        let updated: FiltroSinVentas = { ...filters, [key]: value };

        // Reset cascadas cuando corresponde
        if (key === "primerNivel") {
            updated.categoria = undefined;
            updated.subcategoria = undefined;
        }

        if (key === "categoria") {
            updated.subcategoria = undefined;
        }

        setFilters(updated);
    };

    const handleApply = () => {
        // Si hay SKU, aplica SOLO SKU (el resto queda inactivo)
        if (skuMode) {
            const sku = (filters.sku || "").trim();
            onFilterChange({ sku });
            setOpen(false);
            return;
        }
        onFilterChange(filters);
        setOpen(false);
    };

    const handleClear = () => {
        const cleared: FiltroSinVentas = { minStock: 0, sku: undefined };
        setFilters(cleared);
        onFilterChange(cleared);
        setOpen(false);
    };

    // para refrescar pagina al eliminar chips
    const applyAndUpdate = (updater: (f: FiltroSinVentas) => FiltroSinVentas) => {
        setFilters(prev => {
            const next = updater(prev);
            onFilterChange(next);      // notifica al padre -> recarga + page 1
            return next;
        });
    };

    // Chips resumen
    const chips = (
        <Box display="flex" gap={1} flexWrap="wrap">
            {skuMode && (
                <Chip
                    color="primary"
                    label={`SKU: ${(filters.sku || '').trim()}`}
                    onDelete={() => applyAndUpdate(f => ({ ...f, sku: undefined }))} // al eliminar reactivas el resto
                />
            )}

            {!skuMode && (filters.minStock ?? 0) > 0 && (
                <Chip
                    label={`minStock: ${filters.minStock}`}
                    onDelete={() => applyAndUpdate(f => ({ ...f, minStock: 0 }))}
                />
            )}

            {!skuMode && filters.fechaInicio && (
                <Chip
                    label={`Desde: ${filters.fechaInicio}`}
                    onDelete={() => applyAndUpdate(f => ({ ...f, fechaInicio: undefined }))}
                />
            )}

            {!skuMode && filters.primerNivel && (
                <Chip
                    label={`Primer Nivel: ${primerNiveles.find(p => p.codigo === filters.primerNivel)?.nombre || filters.primerNivel}`}
                    onDelete={() =>
                        applyAndUpdate(f => ({
                            ...f,
                            primerNivel: undefined,   // reset cascada
                            categoria: undefined,
                            subcategoria: undefined,
                        }))
                    }
                />
            )}

            {!skuMode && filters.categoria && (
                <Chip
                    label={`Categoría: ${categorias.find(c => c.codigo === filters.categoria)?.nombre || filters.categoria}`}
                    onDelete={() =>
                        applyAndUpdate(f => ({
                            ...f,
                            categoria: undefined,     // reset cascada
                            subcategoria: undefined,
                        }))
                    }
                />
            )}

            {!skuMode && filters.subcategoria && (
                <Chip
                    label={`Subcategoría: ${subcategorias.find(s => s.codigo === filters.subcategoria)?.nombre || filters.subcategoria}`}
                    onDelete={() => applyAndUpdate(f => ({ ...f, subcategoria: undefined }))}
                />
            )}
        </Box>
    );

    return (
        <Box mb={2}>
            <Box mt={1} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                {chips}
                <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setOpen(true)}>Filtros</Button>
            </Box>

            <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 360, p: 3 } }}>
                <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Filtros</Typography>
                        <IconButton onClick={() => setOpen(false)}><CloseIcon /></IconButton>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>

                        {/* filtro por SKU */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                size="small"
                                label="SKU"
                                placeholder="Ej: 083056176"
                                value={filters.sku || ""}
                                onChange={(e) => handleChange("sku", e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="minStock"
                                value={filters.minStock ?? 0}
                                onChange={(e) => handleChange("minStock", Number(e.target.value || 0))}
                                disabled={skuMode}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="Fecha mínima creación"
                                InputLabelProps={{ shrink: true }}
                                value={filters.fechaInicio || ""}
                                onChange={(e) => handleChange("fechaInicio", e.target.value)}
                                disabled={skuMode}
                            />
                        </Grid>

                        {/* Primer Nivel */}
                        <Grid item xs={12}>
                            <FormControl fullWidth size="small" disabled={skuMode}>
                                <InputLabel>Primer Nivel</InputLabel>
                                <Select
                                    value={filters.primerNivel || ""}
                                    onChange={(e) => handleChange("primerNivel", e.target.value)}
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    {primerNiveles.map((cat) => (
                                        <MenuItem key={cat.codigo} value={cat.codigo}>
                                            <ListItemIcon><Avatar src={cat.imagen} sx={{ width: 24, height: 24 }} /></ListItemIcon>
                                            <ListItemText primary={cat.nombre} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Categoría */}
                        {!skuMode && filters.primerNivel && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Categoría</InputLabel>
                                    <Select
                                        value={filters.categoria || ""}
                                        onChange={(e) => handleChange("categoria", e.target.value)}
                                    >
                                        <MenuItem value="">Todas</MenuItem>
                                        {categorias.map((cat) => (
                                            <MenuItem key={cat.codigo} value={cat.codigo}>
                                                <ListItemIcon><Avatar src={cat.imagen} sx={{ width: 24, height: 24 }} /></ListItemIcon>
                                                <ListItemText primary={cat.nombre} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {/* Subcategoría */}
                        {!skuMode && filters.categoria && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Subcategoría</InputLabel>
                                    <Select
                                        value={filters.subcategoria || ""}
                                        onChange={(e) => handleChange("subcategoria", e.target.value)}
                                    >
                                        <MenuItem value="">Todas</MenuItem>
                                        {subcategorias.map((sub) => (
                                            <MenuItem key={sub.codigo} value={sub.codigo}>
                                                <ListItemIcon><Avatar src={sub.imagen} sx={{ width: 24, height: 24 }} /></ListItemIcon>
                                                <ListItemText primary={sub.nombre} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        <Grid item xs={12} display="flex" justifyContent="space-between">
                            <Button variant="outlined" onClick={handleClear}>Limpiar</Button>
                            <Button variant="contained" onClick={handleApply}>Aplicar</Button>
                        </Grid>
                    </Grid>
                </Box>
            </Drawer>
        </Box>
    );
};

export default HeaderSinVentasDrawer;

