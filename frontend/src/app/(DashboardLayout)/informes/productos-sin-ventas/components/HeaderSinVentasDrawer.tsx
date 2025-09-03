'use client';

import React, { useEffect, useState } from "react";
import {
    Box, Drawer, IconButton, Typography, Divider, Grid,
    FormControl, InputLabel, Select, MenuItem, Button,
    TextField, Chip, Avatar, ListItemIcon, ListItemText
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

export interface FiltroSinVentas {
    minStock?: number;        // default 0
    fechaInicio?: string;     // YYYY-MM-DD
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

const HeaderSinVentasDrawer: React.FC<Props> = ({ onFilterChange, currentFilters }) => {
    const [open, setOpen] = useState(false);
    const [filters, setFilters] = useState<FiltroSinVentas>(() => currentFilters || { minStock: 0 });

    const [primerNiveles, setPrimerNiveles] = useState<Categoria[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [subcategorias, setSubcategorias] = useState<Categoria[]>([]);

    // Carga inicial de primer nivel (igual que el otro header)
    useEffect(() => {
        (async () => {
            try {
                const res = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/primer-nivel`);
                const data = await res!.json();
                setPrimerNiveles(data);
            } catch (e) {
                console.error("Error fetching primer nivel:", e);
            }
        })();
    }, []);

    // Si vienen filtros iniciales con jerarquías, cargar cascadas (mismo patrón)
    useEffect(() => {
        if (filters.primerNivel && categorias.length === 0) fetchCategorias(filters.primerNivel);
        if (filters.categoria && subcategorias.length === 0) fetchSubcategorias(filters.categoria);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.primerNivel, filters.categoria]);

    const fetchCategorias = async (primerNivel: string) => {
        try {
            const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getcat?primerNivel=${primerNivel}`);
            const data = await res!.json();
            setCategorias(
                data.map((cat: any) => ({ codigo: cat.codigo_categoria, nombre: cat.nombre_categoria, imagen: cat.IMAGEN }))
            );
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategorias([]);
        }
    };

    const fetchSubcategorias = async (categoria: string) => {
        try {
            const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getsub?categoria=${categoria}`);
            const data = await res!.json();
            setSubcategorias(
                data.map((sub: any) => ({ codigo: sub.codigo_subcategoria, nombre: sub.nombre_subcategoria, imagen: sub.IMAGEN }))
            );
        } catch (error) {
            console.error("Error fetching subcategories:", error);
            setSubcategorias([]);
        }
    };

    const handleChange = async (key: keyof FiltroSinVentas, value: any) => {
        let updated: FiltroSinVentas = { ...filters, [key]: value };

        // Reset cascadas cuando corresponde (igual que el otro header)
        if (key === "primerNivel") {
            updated.categoria = undefined;
            updated.subcategoria = undefined;
            if (value) await fetchCategorias(value as string);
            else setCategorias([]);
            setSubcategorias([]);
        }

        if (key === "categoria") {
            updated.subcategoria = undefined;
            if (value) await fetchSubcategorias(value as string);
            else setSubcategorias([]);
        }

        setFilters(updated);
    };

    const handleApply = () => {
        onFilterChange(filters);
        setOpen(false);
    };

    const handleClear = () => {
        const cleared: FiltroSinVentas = { minStock: 0 };
        setFilters(cleared);
        setCategorias([]);
        setSubcategorias([]);
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


    // Chips resumen (mismo look)
    const chips = (
        <Box display="flex" gap={1} flexWrap="wrap">
            {(filters.minStock ?? 0) > 0 && (
                <Chip
                    label={`minStock: ${filters.minStock}`}
                    onDelete={() => applyAndUpdate(f => ({ ...f, minStock: 0 }))}
                />
            )}

            {filters.fechaInicio && (
                <Chip
                    label={`Desde: ${filters.fechaInicio}`}
                    onDelete={() => applyAndUpdate(f => ({ ...f, fechaInicio: undefined }))}
                />
            )}

            {filters.primerNivel && (
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

            {filters.categoria && (
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

            {filters.subcategoria && (
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
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="minStock"
                                value={filters.minStock ?? 0}
                                onChange={(e) => handleChange("minStock", Number(e.target.value || 0))}
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
                            />
                        </Grid>

                        {/* Primer Nivel */}
                        <Grid item xs={12}>
                            <FormControl fullWidth size="small">
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
                        {filters.primerNivel && (
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
                        {filters.categoria && (
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
