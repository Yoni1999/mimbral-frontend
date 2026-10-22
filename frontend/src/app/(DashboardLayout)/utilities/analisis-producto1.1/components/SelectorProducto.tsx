"use client";

import React from "react";
import { Box, Dialog, IconButton, InputAdornment, Skeleton, TextField, Typography } from "@mui/material";
import { IconChevronDown, IconHistory, IconPackage, IconSearch, IconX } from "@tabler/icons-react";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import { BACKEND_URL } from "@/config";
import { controlSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";

export interface ProductoElegido {
  sku: string;
  nombre: string;
  imagen?: string;
}

const SIN_IMAGEN = "https://res.cloudinary.com/dhzahos7u/image/upload/v1748960388/producto_sin_imagen_vqaps4.jpg";
const MAX_RECIENTES = 8;

export function FotoProducto({ src, tamano = 34 }: { src?: string; tamano?: number }) {
  return (
    <Box
      component="img"
      src={src || SIN_IMAGEN}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        img.onerror = null;
        img.src = SIN_IMAGEN;
      }}
      alt=""
      sx={{ width: tamano, height: tamano, objectFit: "contain", borderRadius: "8px", border: `1px solid ${tinta.borde}`, bgcolor: "#fff", flexShrink: 0 }}
    />
  );
}

/** Espera a que se deje de escribir antes de buscar. */
function useDemorado(valor: string, ms = 300) {
  const [demorado, setDemorado] = React.useState(valor);
  React.useEffect(() => {
    const t = setTimeout(() => setDemorado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return demorado;
}

interface Props {
  producto: ProductoElegido | null;
  onElegir: (producto: ProductoElegido) => void;
  /** Abre la ventana desde fuera (p. ej. el estado vacío de la vista). */
  abierto: boolean;
  setAbierto: (abierto: boolean) => void;
}

/** Elegir el producto a analizar: búsqueda por nombre o SKU y los últimos
 *  productos vistos. Enter elige el primer resultado. */
export default function SelectorProducto({ producto, onElegir, abierto, setAbierto }: Props) {
  const [texto, setTexto] = React.useState("");
  const consulta = useDemorado(texto.trim());
  const [recientes, setRecientes] = useEstadoVista<{ lista: ProductoElegido[] }>("producto:recientes", () => ({ lista: [] }));

  const url = abierto && consulta.length >= 2 ? `${BACKEND_URL}/api/pv/SKU?query=${encodeURIComponent(consulta)}` : null;
  const { datos: resultados, cargando } = useCargaDatos<ProductoElegido[]>(
    url,
    async (signal) => {
      const json = await apiJson(url!, { signal });
      return (Array.isArray(json) ? json : []).map((p: any) => ({
        sku: String(p.itemcode),
        nombre: p.itemname || String(p.itemcode),
        imagen: p.U_Imagen || undefined,
      }));
    },
    []
  );

  const elegir = (p: ProductoElegido) => {
    setRecientes((r) => ({ lista: [p, ...r.lista.filter((x) => x.sku !== p.sku)].slice(0, MAX_RECIENTES) }));
    onElegir(p);
    setAbierto(false);
    setTexto("");
  };

  const buscando = consulta.length >= 2;
  const lista = buscando ? resultados : recientes.lista;

  const fila = (p: ProductoElegido) => (
    <Box
      key={p.sku}
      component="button"
      type="button"
      onClick={() => elegir(p)}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        border: 0,
        borderRadius: "10px",
        px: 1.25,
        py: 0.9,
        bgcolor: p.sku === producto?.sku ? "#eff4ff" : "transparent",
        fontFamily: "inherit",
        textAlign: "left",
        cursor: "pointer",
        "&:hover": { bgcolor: p.sku === producto?.sku ? "#eff4ff" : tinta.fondoSuave },
      }}
    >
      <FotoProducto src={p.imagen} tamano={38} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600, color: tinta.primaria }}>
          {p.nombre}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: tinta.tenue }}>SKU {p.sku}</Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
        title={producto ? `${producto.nombre} · SKU ${producto.sku}` : "Elegir producto"}
        sx={{
          ...controlSx,
          display: "flex",
          alignItems: "center",
          gap: 1,
          minWidth: 240,
          maxWidth: 320,
          px: 1.25,
          border: `1px solid ${abierto ? tinta.acento : tinta.borde}`,
          color: tinta.primaria,
          fontFamily: "inherit",
          cursor: "pointer",
          "&:hover": { borderColor: "#cbd5e1" },
        }}
      >
        <IconPackage size={16} color={tinta.secundaria} style={{ flexShrink: 0 }} />
        <Box component="span" sx={{ flex: 1, minWidth: 0, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {producto ? `${producto.sku} · ${producto.nombre}` : "Elegir producto"}
        </Box>
        <IconChevronDown size={16} color={tinta.tenue} style={{ flexShrink: 0 }} />
      </Box>

      <Dialog
        open={abierto}
        onClose={() => setAbierto(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, px: 2.5, pt: 2.25, pb: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 750, color: tinta.primaria }}>Elegir producto</Typography>
            <Typography sx={{ fontSize: 12.5, color: tinta.secundaria }}>Busca por nombre o SKU. Enter elige el primero.</Typography>
          </Box>
          <IconButton aria-label="Cerrar" onClick={() => setAbierto(false)} size="small">
            <IconX size={18} />
          </IconButton>
        </Box>
        <Box sx={{ px: 2.5, pb: 1.5, borderBottom: `1px solid ${tinta.borde}` }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Ej.: yeso cartón, 110001002"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && buscando && resultados[0]) elegir(resultados[0]);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={15} color={tinta.tenue} />
                </InputAdornment>
              ),
              endAdornment: texto ? (
                <IconButton size="small" aria-label="Borrar búsqueda" onClick={() => setTexto("")}>
                  <IconX size={15} />
                </IconButton>
              ) : null,
            }}
            sx={{ "& .MuiOutlinedInput-root": controlSx }}
          />
        </Box>
        <Box sx={{ height: { xs: 400, md: 480 }, overflowY: "auto", p: 1 }}>
          <Typography sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: 11, fontWeight: 700, color: tinta.tenue, textTransform: "uppercase", letterSpacing: "0.06em", px: 1.25, py: 0.75 }}>
            {buscando ? (
              cargando ? "Buscando…" : `${resultados.length} resultados`
            ) : (
              <>
                <IconHistory size={13} /> Vistos recientemente
              </>
            )}
          </Typography>
          {buscando && cargando ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={52} sx={{ mx: 1.25 }} />)
          ) : lista.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: tinta.tenue, px: 1.25, py: 2 }}>
              {buscando ? "Sin coincidencias." : texto.trim().length === 1 ? "Escribe al menos 2 letras." : "Aún no has visto productos. Escribe para buscar."}
            </Typography>
          ) : (
            lista.map(fila)
          )}
        </Box>
      </Dialog>
    </>
  );
}
