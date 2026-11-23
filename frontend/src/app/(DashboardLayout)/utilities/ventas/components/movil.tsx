"use client";
// Listas en celular: debajo de 600 px (breakpoint `sm` de MUI) una tabla de
// muchas columnas no se lee, así que cada fila pasa a ser una fila compacta
// (~110 px): foto opcional con su posición (#1, #2…), nombre en dos líneas,
// una línea chica (SKU · categoría) y una sola línea de cifras con el margen
// en una etiqueta de color al final. Al tocarla sube una hoja con todas las
// cifras y, si la fila tiene destino, el botón a la ficha. En escritorio nada
// cambia: las vistas siguen mostrando su tabla.
import React from "react";
import { Box, ButtonBase, Divider, Drawer, IconButton, InputBase, ListItemIcon, Menu, MenuItem, Skeleton, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { IconArrowDown, IconArrowUp, IconArrowsSort, IconCheck, IconDownload, IconPhoto, IconSearch, IconX } from "@tabler/icons-react";
import { cifraSx, estado, formatoPorcentaje, tarjetaSx, tinta } from "./estilo";

/** true en celular (menos de 600 px). En el servidor responde false: la tabla es la vista por defecto. */
export function useEsCelular() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });
}

/**
 * Una cifra de la fila: su nombre y su valor ya formateado (en celular siempre
 * en formato chileno: $2,4 M · 33,3% · 1.234; ver `formatoMonto`,
 * `formatoPorcentaje` y `formatoPesos` en estilo.tsx).
 */
export interface CifraTarjeta {
  titulo: string;
  valor: React.ReactNode;
  /** Sufijo en la fila compacta, p. ej. "un." (en la hoja se ve sin él). */
  unidad?: string;
  /**
   * Marca esta cifra como la etiqueta de color al final de la fila (margen o
   * porcentaje). El número, en %, decide el tono según los umbrales; con null
   * se muestra `valor` en una etiqueta gris.
   */
  chip?: number | null;
  /**
   * Texto chico delante del valor en la fila compacta. Por defecto la primera
   * cifra sin unidad va sola y las siguientes llevan su título en minúscula
   * ("margen $1,2 M"); `false` lo quita y un texto lo reemplaza.
   */
  prefijo?: string | false;
}

export interface TarjetaMovil {
  clave: string;
  /** Nombre del producto, vendedor, categoría… (dos líneas como máximo). */
  titulo: React.ReactNode;
  /** Línea chica bajo el título (SKU · categoría). */
  meta?: React.ReactNode;
  /** Cifras de la línea de la fila; una puede ser la etiqueta (`chip`). */
  principales: CifraTarjeta[];
  /** Cifras que solo se ven en la hoja de detalle. */
  detalle?: CifraTarjeta[];
  /** Destino del botón de la hoja (abrir la ficha, el documento…). */
  onAbrir?: () => void;
  /** Texto del botón de la hoja. Por defecto "Ver ficha del producto" si la fila tiene foto, si no "Abrir detalle". */
  accionLabel?: string;
  /** Segunda acción de la hoja (p. ej. "Copiar SKU"), como botón de texto bajo el principal. */
  accionSecundaria?: { label: string; onClick: () => void };
  /** Foto del producto. `undefined` = fila sin foto; null o "" = recuadro gris de reemplazo. */
  imagen?: string | null;
  /** Posición en un ranking: se ve como "#1" sobre la foto (o delante del nombre si no hay foto). */
  rango?: number;
}

/** Umbrales de la etiqueta de margen: verde desde `bueno`, ámbar desde `regular`, rojo bajo eso. */
export interface UmbralesChip {
  bueno: number;
  regular: number;
}

// Mismos cortes que ChipMargen (estilo.tsx), el chip de margen de escritorio:
// rojo bajo 0 %, ámbar hasta 15 %, verde desde 15 %.
const UMBRALES: UmbralesChip = { bueno: 15, regular: 0 };
const ambar = { color: "#b54708", fondo: "#fffaeb" };

/** Imagen de "sin foto" que usan varias vistas: en celular se ve el recuadro de reemplazo. */
const esSinImagen = (url?: string | null) => !url || !/^https?:\/\//.test(url) || url.includes("producto_sin_imagen");

const tonoChip = (n: number | null | undefined, u: UmbralesChip) => {
  if (n == null || Number.isNaN(n)) return estado.neutro;
  if (n >= u.bueno) return estado.bien;
  if (n >= u.regular) return ambar;
  return estado.mal;
};

/** Lista de filas compactas que reemplaza a una tabla en celular. */
export function TarjetasMovil({
  filas,
  cargando = false,
  vacio = "Sin datos para los filtros elegidos.",
  umbrales = UMBRALES,
}: {
  filas: TarjetaMovil[];
  cargando?: boolean;
  vacio?: React.ReactNode;
  umbrales?: UmbralesChip;
}) {
  const [abierta, setAbierta] = React.useState<TarjetaMovil | null>(null);
  if (cargando) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={92} sx={{ borderRadius: "14px" }} />
        ))}
      </Box>
    );
  }
  if (filas.length === 0) {
    return <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 4, textAlign: "center" }}>{vacio}</Typography>;
  }
  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {filas.map((f) => (
          <Fila key={f.clave} fila={f} umbrales={umbrales} onTocar={() => setAbierta(f)} />
        ))}
      </Box>
      <HojaDetalle fila={abierta} umbrales={umbrales} onCerrar={() => setAbierta(null)} />
    </>
  );
}

/** Las celdas de escritorio (TextoCelda) cortan con "…": en la fila el nombre usa sus dos líneas. */
const textoLibreSx = { "& .MuiTypography-noWrap": { whiteSpace: "normal", overflow: "visible", textOverflow: "clip" } } as const;

function Insignia({ rango, sobreFoto }: { rango: number; sobreFoto: boolean }) {
  return (
    <Box
      component="span"
      sx={{
        ...(sobreFoto ? { position: "absolute", top: -6, left: -6, border: "2px solid #fff" } : { mr: 0.75, verticalAlign: "1px" }),
        display: "inline-block",
        px: 0.6,
        py: 0.1,
        borderRadius: 999,
        bgcolor: tinta.primaria,
        color: "#fff",
        fontSize: 10.5,
        fontWeight: 800,
        lineHeight: 1.5,
        ...cifraSx,
      }}
    >
      #{rango}
    </Box>
  );
}

/** Foto cuadrada con bordes redondeados; sin foto (o si no carga), un recuadro gris del mismo tamaño. */
function Foto({ url, tamano, rango }: { url?: string | null; tamano: number; rango?: number }) {
  const [rota, setRota] = React.useState(false);
  const caja = { width: tamano, height: tamano, borderRadius: "12px", border: `1px solid ${tinta.borde}`, display: "block" } as const;
  return (
    <Box sx={{ position: "relative", flexShrink: 0 }}>
      {esSinImagen(url) || rota ? (
        <Box aria-hidden sx={{ ...caja, display: "grid", placeItems: "center", background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)", color: "#cbd5e1" }}>
          <IconPhoto size={Math.round(tamano * 0.4)} stroke={1.5} />
        </Box>
      ) : (
        <Box component="img" src={url!} alt="" loading="lazy" onError={() => setRota(true)} sx={{ ...caja, objectFit: "contain", bgcolor: "#fff" }} />
      )}
      {rango != null && <Insignia rango={rango} sobreFoto />}
    </Box>
  );
}

function Chip({ cifra, umbrales }: { cifra: CifraTarjeta; umbrales: UmbralesChip }) {
  const tono = tonoChip(cifra.chip, umbrales);
  return (
    <Box
      component="span"
      sx={{ flexShrink: 0, px: 0.9, py: 0.3, borderRadius: "8px", bgcolor: tono.fondo, color: tono.color, fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", ...cifraSx }}
    >
      {cifra.chip != null ? formatoPorcentaje(cifra.chip) : cifra.valor}
    </Box>
  );
}

function Fila({ fila, umbrales, onTocar }: { fila: TarjetaMovil; umbrales: UmbralesChip; onTocar: () => void }) {
  const chip = fila.principales.find((c) => c.chip !== undefined);
  const cifras = fila.principales.filter((c) => c !== chip);
  const conFoto = fila.imagen !== undefined;
  let sueltas = 0;
  return (
    <ButtonBase
      component="div"
      role="button"
      data-fila-movil=""
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        // Un control propio de la fila (enlace, botón, selector…) hace lo suyo sin abrir la hoja; tampoco
        // los clics que llegan desde un menú en portal (React los propaga hasta aquí).
        const destino = e.target as HTMLElement;
        if (!e.currentTarget.contains(destino)) return;
        const interno = destino.closest("a, button, input, select, textarea, label, [role=link], [role=button], [role=combobox], [role=checkbox], [role=switch]");
        if (interno && interno !== e.currentTarget && e.currentTarget.contains(interno)) return;
        onTocar();
      }}
      sx={{
        ...tarjetaSx,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 1.5,
        px: 1.5,
        py: 1.25,
        width: "100%",
        textAlign: "left",
        overflow: "visible",
      }}
    >
      {conFoto && <Foto url={fila.imagen} tamano={54} rango={fila.rango} />}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            ...textoLibreSx,
            fontSize: 13.5,
            fontWeight: 700,
            color: tinta.primaria,
            lineHeight: 1.3,
            wordBreak: "break-word",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            "& *": { display: "inline" },
          }}
        >
          {!conFoto && fila.rango != null && <Insignia rango={fila.rango} sobreFoto={false} />}
          {fila.titulo}
        </Box>
        {fila.meta ? (
          <Box sx={{ ...textoLibreSx, fontSize: 11.5, color: tinta.secundaria, mt: 0.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", "& *": { display: "inline" } }}>
            {fila.meta}
          </Box>
        ) : null}
        {(cifras.length > 0 || chip) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.6 }}>
            <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 1.25, rowGap: 0.25 }}>
              {cifras.map((c) => {
                // La primera cifra sin unidad va sola; las demás, con su nombre delante.
                const prefijo = c.prefijo !== undefined ? c.prefijo : c.unidad ? false : sueltas++ > 0 ? c.titulo.toLowerCase() : false;
                return (
                  <Box key={c.titulo} component="span" sx={{ whiteSpace: "nowrap", fontSize: 13.5, ...cifraSx }}>
                    {prefijo ? <Box component="span" sx={{ color: tinta.secundaria, fontSize: 12, mr: 0.5 }}>{prefijo}</Box> : null}
                    <Box component="span" sx={{ fontWeight: 700, color: tinta.primaria }}>
                      {c.valor}
                      {c.unidad ? ` ${c.unidad}` : ""}
                    </Box>
                  </Box>
                );
              })}
            </Box>
            {chip && <Chip cifra={chip} umbrales={umbrales} />}
          </Box>
        )}
      </Box>
    </ButtonBase>
  );
}

/** Hoja que sube desde abajo con la foto, el nombre y todas las cifras de la fila. */
function HojaDetalle({ fila, umbrales, onCerrar }: { fila: TarjetaMovil | null; umbrales: UmbralesChip; onCerrar: () => void }) {
  // Se conserva la última fila mientras la hoja se cierra, para que no quede vacía en la animación.
  const ultima = React.useRef<TarjetaMovil | null>(null);
  if (fila) ultima.current = fila;
  const f = fila ?? ultima.current;
  const cifras = f ? [...f.principales, ...(f.detalle ?? [])] : [];
  const conFoto = f?.imagen !== undefined;
  return (
    <Drawer
      anchor="bottom"
      open={!!fila}
      onClose={onCerrar}
      // Sobre la barra de navegación inferior (zIndex 1250), como un diálogo.
      sx={{ zIndex: (t) => t.zIndex.modal }}
      PaperProps={{
        "aria-label": "Detalle",
        sx: { borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: "88dvh", display: "flex", flexDirection: "column" },
      }}
    >
      {f && (
        <>
          <Box sx={{ px: 2, pt: 1, flexShrink: 0 }}>
            <Box sx={{ width: 40, height: 4, borderRadius: 999, bgcolor: "#e2e8f0", mx: "auto", mb: 1.5 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              {conFoto && <Foto url={f.imagen} tamano={60} />}
              <Box sx={{ flex: 1, minWidth: 0, ...textoLibreSx }}>
                <Box sx={{ fontSize: 15.5, fontWeight: 700, color: tinta.primaria, lineHeight: 1.3, wordBreak: "break-word", "& *": { display: "inline" } }}>
                  {!conFoto && f.rango != null && <Insignia rango={f.rango} sobreFoto={false} />}
                  {f.titulo}
                </Box>
                {f.meta ? <Box sx={{ fontSize: 12.5, color: tinta.secundaria, mt: 0.25, wordBreak: "break-word", "& *": { display: "inline" } }}>{f.meta}</Box> : null}
              </Box>
              <IconButton aria-label="Cerrar" onClick={onCerrar} sx={{ alignSelf: "flex-start", width: 36, height: 36, mr: -0.75, color: tinta.tenue }}>
                <IconX size={18} />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2, pb: 1.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
              {cifras.map((c, i) => (
                <Box key={`${c.titulo}-${i}`} sx={{ bgcolor: "#f5f7fa", borderRadius: "12px", px: 1.5, py: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 12, color: tinta.secundaria, lineHeight: 1.3 }}>{c.titulo}</Typography>
                  <Box
                    sx={{
                      fontSize: 16,
                      fontWeight: 700,
                      mt: 0.25,
                      wordBreak: "break-word",
                      color: c.chip != null ? tonoChip(c.chip, umbrales).color : tinta.primaria,
                      ...cifraSx,
                    }}
                  >
                    {c.chip != null ? formatoPorcentaje(c.chip) : c.valor}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
          {(f.onAbrir || f.accionSecundaria) && (
            <Box sx={{ flexShrink: 0, px: 2, pt: 0.5, pb: "calc(14px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 0.5 }}>
              {f.onAbrir && (
              <ButtonBase
                onClick={() => {
                  onCerrar();
                  f.onAbrir?.();
                }}
                sx={{ width: "100%", height: 48, borderRadius: "12px", bgcolor: tinta.primaria, color: "#fff", fontSize: 15, fontWeight: 700 }}
              >
                {f.accionLabel ?? (conFoto ? "Ver ficha del producto" : "Abrir detalle")}
              </ButtonBase>
              )}
              {f.accionSecundaria && (
                <ButtonBase
                  onClick={() => {
                    onCerrar();
                    f.accionSecundaria?.onClick();
                  }}
                  sx={{ width: "100%", height: 40, borderRadius: "12px", color: tinta.acento, fontSize: 14, fontWeight: 700 }}
                >
                  {f.accionSecundaria.label}
                </ButtonBase>
              )}
            </Box>
          )}
          {!f.onAbrir && !f.accionSecundaria && <Box sx={{ height: "calc(8px + env(safe-area-inset-bottom))", flexShrink: 0 }} />}
        </>
      )}
    </Drawer>
  );
}

export interface OpcionOrden {
  clave: string;
  titulo: string;
}

export interface OrdenLista {
  opciones: OpcionOrden[];
  clave: string;
  direccion: "asc" | "desc";
  onCambiar: (clave: string, direccion: "asc" | "desc") => void;
}

const botonBarraSx = {
  width: 40,
  height: 40,
  flexShrink: 0,
  borderRadius: "12px",
  border: `1px solid ${tinta.borde}`,
  bgcolor: "#fff",
  color: tinta.primaria,
} as const;

/**
 * Barra de una lista en celular: buscador gris con el orden y la descarga
 * como íconos en la misma fila, y debajo los filtros activos y el orden
 * elegido ("Orden: venta ↓", que al tocarlo invierte la dirección).
 */
export function BarraListaMovil({
  buscar,
  orden,
  onExportar,
  exportando = false,
  chips,
}: {
  buscar?: { valor: string; onCambiar: (v: string) => void; placeholder?: string };
  orden?: OrdenLista;
  onExportar?: () => void;
  exportando?: boolean;
  /** Filtros activos (ChipFiltro u otros) a la izquierda de la línea del orden. */
  chips?: React.ReactNode;
}) {
  const [menu, setMenu] = React.useState<HTMLElement | null>(null);
  const conOrden = !!orden && orden.opciones.length > 0;
  const actual = conOrden ? orden!.opciones.find((o) => o.clave === orden!.clave) : undefined;
  const Flecha = orden?.direccion === "asc" ? IconArrowUp : IconArrowDown;
  const tieneFila = !!buscar || !!onExportar;
  const botonOrden = conOrden && (
    <IconButton aria-label="Ordenar" title="Ordenar" onClick={(e) => setMenu(e.currentTarget)} sx={botonBarraSx}>
      <IconArrowsSort size={19} />
    </IconButton>
  );
  const lineaOrden = actual && (
    <ButtonBase
      onClick={() => orden!.onCambiar(orden!.clave, orden!.direccion === "desc" ? "asc" : "desc")}
      aria-label={orden!.direccion === "desc" ? "De mayor a menor: invertir" : "De menor a mayor: invertir"}
      sx={{ ml: "auto", flexShrink: 0, gap: 0.25, fontSize: 12.5, color: tinta.secundaria, borderRadius: "6px", px: 0.25, whiteSpace: "nowrap" }}
    >
      Orden: {actual.titulo.toLowerCase()}
      <Flecha size={14} />
    </ButtonBase>
  );
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, width: "100%" }}>
      {tieneFila && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {buscar ? (
            <Box sx={{ flex: 1, minWidth: 0, height: 40, display: "flex", alignItems: "center", gap: 1, px: 1.5, bgcolor: "#f1f5f9", borderRadius: "12px" }}>
              <IconSearch size={17} color={tinta.tenue} style={{ flexShrink: 0 }} />
              <InputBase
                value={buscar.valor}
                onChange={(e) => buscar.onCambiar(e.target.value)}
                placeholder={buscar.placeholder ?? "Buscar por nombre o SKU"}
                inputProps={{ "aria-label": buscar.placeholder ?? "Buscar", type: "search" }}
                sx={{ flex: 1, minWidth: 0, fontSize: 14.5, color: tinta.primaria }}
              />
              {buscar.valor && (
                <IconButton aria-label="Borrar búsqueda" onClick={() => buscar.onCambiar("")} sx={{ width: 28, height: 28, mr: -0.75, color: tinta.tenue }}>
                  <IconX size={16} />
                </IconButton>
              )}
            </Box>
          ) : (
            <Box sx={{ flex: 1 }} />
          )}
          {botonOrden}
          {onExportar && (
            <IconButton aria-label="Descargar Excel" title="Descargar Excel" disabled={exportando} onClick={onExportar} sx={botonBarraSx}>
              <IconDownload size={19} />
            </IconButton>
          )}
        </Box>
      )}
      {(chips || lineaOrden || (!tieneFila && botonOrden)) && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minHeight: 24 }}>
          {chips ? <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, minWidth: 0 }}>{chips}</Box> : null}
          {lineaOrden}
          {!tieneFila && botonOrden && <Box sx={{ "& .MuiIconButton-root": { width: 34, height: 34, borderRadius: "10px" } }}>{botonOrden}</Box>}
        </Box>
      )}
      {conOrden && (
        <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
          <Typography sx={{ px: 2, pt: 0.5, pb: 0.75, fontSize: 11.5, fontWeight: 700, color: tinta.tenue, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Ordenar por
          </Typography>
          {orden!.opciones.map((o) => (
            <MenuItem
              key={o.clave}
              selected={o.clave === orden!.clave}
              onClick={() => {
                orden!.onCambiar(o.clave, orden!.direccion);
                setMenu(null);
              }}
              sx={{ fontSize: 14, minHeight: 40 }}
            >
              <ListItemIcon sx={{ minWidth: "28px !important" }}>{o.clave === orden!.clave ? <IconCheck size={16} /> : null}</ListItemIcon>
              {o.titulo}
            </MenuItem>
          ))}
          <Divider />
          {(["desc", "asc"] as const).map((d) => (
            <MenuItem
              key={d}
              selected={orden!.direccion === d}
              onClick={() => {
                orden!.onCambiar(orden!.clave, d);
                setMenu(null);
              }}
              sx={{ fontSize: 14, minHeight: 40 }}
            >
              <ListItemIcon sx={{ minWidth: "28px !important" }}>{d === "desc" ? <IconArrowDown size={16} /> : <IconArrowUp size={16} />}</ListItemIcon>
              {d === "desc" ? "De mayor a menor" : "De menor a mayor"}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Box>
  );
}

/**
 * En celular no hay encabezados que tocar para ordenar: una línea
 * "Orden: <campo> ↓" con el botón de orden a la derecha (misma barra que
 * `BarraListaMovil`, sin buscador).
 */
export function OrdenMovil({ opciones, clave, direccion, onCambiar }: OrdenLista) {
  if (opciones.length === 0) return null;
  return <BarraListaMovil orden={{ opciones, clave, direccion, onCambiar }} />;
}
