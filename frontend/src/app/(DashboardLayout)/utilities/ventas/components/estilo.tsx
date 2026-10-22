// Línea visual común de Resumen de ventas: colores, formatos y estilos que
// comparten las tarjetas, gráficos y tablas de la vista.
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { IconArrowDownRight, IconArrowUpRight, IconMinus, IconTrash, IconX } from "@tabler/icons-react";

export const tinta = {
  primaria: "#0f172a",
  secundaria: "#475569",
  tenue: "#94a3b8",
  borde: "#e5e7eb",
  fondoSuave: "#f8fafc",
  acento: "#2563eb",
};

// Estados: siempre con ícono y texto, nunca solo el color.
export const estado = {
  bien: { color: "#067647", fondo: "#ecfdf3" },
  mal: { color: "#b42318", fondo: "#fef3f2" },
  neutro: { color: "#475569", fondo: "#f1f5f9" },
};

/** Canales en orden fijo y con color fijo: un filtro no cambia el color de ninguno.
 *  Paleta validada (daltonismo y contraste) con el validador de dataviz. */
export const CANALES = [
  { clave: "Chorrillo", nombre: "Chorrillos", color: "#2a78d6" },
  { clave: "Empresas", nombre: "Empresas", color: "#eb6834" },
  { clave: "Vitex", nombre: "Vtex", color: "#1baf7a" },
  { clave: "Meli", nombre: "Mercado Libre", color: "#eda100" },
  { clave: "Falabella", nombre: "Falabella", color: "#008300" },
  { clave: "Balmaceda", nombre: "Balmaceda", color: "#6250d6" },
] as const;

export const canalPorClave = (clave: string) =>
  CANALES.find((c) => c.clave.toLowerCase() === clave.toLowerCase());

export const tarjetaSx = {
  bgcolor: "#ffffff",
  border: `1px solid ${tinta.borde}`,
  borderRadius: "14px",
  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
} as const;

export const cifraSx = { fontVariantNumeric: "tabular-nums" } as const;

const numero = (n: number, decimales = 0) =>
  n.toLocaleString("es-CL", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

/** Monto corto para tarjetas y gráficos: $2.511 M · $45,8 M · $632 mil · $950. */
export const formatoMonto = (valor: number | null | undefined) => {
  const n = Number(valor) || 0;
  const signo = n < 0 ? "-" : "";
  const a = Math.abs(n);
  // Desde $100 M el decimal no aporta y no cabe en ejes ni tarjetas.
  if (a >= 100_000_000) return `${signo}$${numero(a / 1_000_000, 0)} M`;
  if (a >= 1_000_000) return `${signo}$${numero(a / 1_000_000, 1)} M`;
  if (a >= 1_000) return `${signo}$${numero(a / 1_000, 0)} mil`;
  return `${signo}$${numero(a)}`;
};

/** Monto completo para tablas: $1.234.567. */
export const formatoPesos = (valor: number | null | undefined) => `$${numero(Number(valor) || 0)}`;

export const formatoPorcentaje = (valor: number | null | undefined, decimales = 1) =>
  `${numero(Number(valor) || 0, decimales)}%`;

/** Variación contra el período anterior, en chip verde o rojo con flecha.
 *  `masEsMejor` en false para métricas donde subir es malo (notas de crédito).
 *  `unidad` "pp" para diferencias de puntos porcentuales (márgenes). */
export function ChipVariacion({
  valor,
  masEsMejor = true,
  unidad = "%",
}: {
  valor?: number | null;
  masEsMejor?: boolean;
  unidad?: "%" | "pp";
}) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return null;
  const sube = valor > 0;
  const tono = valor === 0 ? estado.neutro : sube === masEsMejor ? estado.bien : estado.mal;
  const Icono = valor === 0 ? IconMinus : sube ? IconArrowUpRight : IconArrowDownRight;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.25,
        px: 0.75,
        py: 0.25,
        borderRadius: 999,
        bgcolor: tono.fondo,
        color: tono.color,
        fontSize: 12,
        flexShrink: 0,
        fontWeight: 700,
        ...cifraSx,
      }}
    >
      <Icono size={14} stroke={2.4} />
      {unidad === "pp" ? `${numero(Math.abs(valor), 1)} pp` : formatoPorcentaje(Math.abs(valor))}
    </Box>
  );
}

/** Margen en chip: verde si es sano, ámbar si es bajo, rojo si es negativo. */
export function ChipMargen({ valor }: { valor?: number | null }) {
  const n = Number(valor) || 0;
  const tono = n < 0 ? estado.mal : n < 15 ? { color: "#b54708", fondo: "#fffaeb" } : estado.bien;
  return (
    <Box
      component="span"
      sx={{ px: 0.75, py: 0.25, borderRadius: 999, bgcolor: tono.fondo, color: tono.color, fontSize: 12, fontWeight: 700, ...cifraSx }}
    >
      {formatoPorcentaje(n)}
    </Box>
  );
}

/** Barra de participación dentro de una celda o fila (valor sobre el máximo). */
export function BarraParticipacion({ valor, maximo, color = tinta.acento }: { valor: number; maximo: number; color?: string }) {
  const ancho = maximo > 0 ? Math.max(2, (Math.max(valor, 0) / maximo) * 100) : 0;
  return (
    <Box sx={{ height: 6, borderRadius: 999, bgcolor: "#eef2f6", overflow: "hidden" }}>
      <Box sx={{ width: `${ancho}%`, height: "100%", borderRadius: 999, bgcolor: color }} />
    </Box>
  );
}

/** Estilo común de las tablas: anchos fijos por columna (cada tabla pasa su
 *  <Columnas>), así nunca son más anchas que su panel ni piden scroll
 *  horizontal; encabezado discreto y cifras alineadas. */
export const tablaSx = {
  tableLayout: "fixed",
  width: "100%",
  "& .MuiTableCell-root": { px: 1.25 },
  "& .MuiTableCell-root:first-of-type": { pl: 2.5 },
  "& .MuiTableCell-root:last-of-type": { pr: 2.5 },
  "& .MuiTableCell-head": {
    bgcolor: tinta.fondoSuave,
    color: tinta.tenue,
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderBottom: `1px solid ${tinta.borde}`,
    py: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  "& .MuiTableCell-body": {
    fontSize: 12.5,
    color: tinta.primaria,
    borderBottom: `1px solid #f1f5f9`,
    py: 0.9,
    ...cifraSx,
  },
  "& .MuiTableSortLabel-root": { maxWidth: "100%" },
  "& .MuiTableRow-root:hover .MuiTableCell-body": { bgcolor: "#fafbfc" },
  "& .MuiTableRow-root:last-of-type .MuiTableCell-body": { borderBottom: 0 },
} as const;

/** Anchos de columna de una tabla con `tablaSx` (porcentajes que suman 100). */
export function Columnas({ anchos }: { anchos: number[] }) {
  return (
    <colgroup>
      {anchos.map((a, i) => (
        <col key={i} style={{ width: `${a}%` }} />
      ))}
    </colgroup>
  );
}

/** Texto de una celda en una sola línea: lo que no cabe se corta con "…" y
 *  el texto completo queda en el title. */
export function TextoCelda({ texto, secundario, fuerte = true }: { texto: string; secundario?: string; fuerte?: boolean }) {
  return (
    <Box sx={{ minWidth: 0 }} title={secundario ? `${texto} · ${secundario}` : texto}>
      <Typography noWrap sx={{ fontSize: 12.5, fontWeight: fuerte ? 600 : 400, color: tinta.primaria }}>
        {texto}
      </Typography>
      {secundario && <Typography noWrap sx={{ fontSize: 11, color: tinta.tenue }}>{secundario}</Typography>}
    </Box>
  );
}

/** Encabezado de un panel: título, descripción y acción a la derecha. */
export function EncabezadoPanel({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2 }}>
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: tinta.primaria }}>{titulo}</Typography>
        {descripcion && (
          <Typography sx={{ fontSize: 12.5, color: tinta.secundaria, mt: 0.25 }}>{descripcion}</Typography>
        )}
      </Box>
      {accion}
    </Box>
  );
}

/** Tarjeta de la vista con su encabezado: el contenedor de gráficos y tablas. */
export function Panel({
  titulo,
  descripcion,
  accion,
  children,
  sx,
}: {
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
  children?: React.ReactNode;
  sx?: object;
}) {
  return (
    <Box sx={{ ...tarjetaSx, p: 2.5, height: "100%", ...sx }}>
      <EncabezadoPanel titulo={titulo} descripcion={descripcion} accion={accion} />
      {children}
    </Box>
  );
}

/** Chip de un filtro activo, con una × para quitarlo. */
export function ChipFiltro({ etiqueta, onQuitar }: { etiqueta: string; onQuitar: () => void }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        pl: 1.25,
        pr: 0.5,
        py: 0.25,
        borderRadius: 999,
        bgcolor: "#f1f5f9",
        color: tinta.primaria,
        fontSize: 12.5,
        fontWeight: 600,
      }}
    >
      {etiqueta}
      <Box
        component="button"
        type="button"
        aria-label={`Quitar ${etiqueta}`}
        onClick={onQuitar}
        sx={{
          border: 0,
          bgcolor: "transparent",
          color: tinta.tenue,
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          p: 0.25,
          borderRadius: 999,
          "&:hover": { color: tinta.primaria, bgcolor: "#e2e8f0" },
        }}
      >
        <IconX size={14} />
      </Box>
    </Box>
  );
}

/** Estilo común de selects y campos de texto en las barras de filtros. */
export const controlSx = {
  height: 34,
  bgcolor: "#fff",
  borderRadius: "10px",
  fontSize: 13.5,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: tinta.borde },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: tinta.acento },
} as const;

export const etiquetaControlSx = { fontSize: 12, fontWeight: 600, color: tinta.secundaria, mb: 0.5 } as const;

/** Selector de una opción en píldoras, con el mismo aspecto que los accesos
 *  rápidos de período. */
export function Pildoras<T extends string>({
  opciones,
  valor,
  onCambiar,
  etiqueta,
}: {
  opciones: { valor: T; texto: string }[];
  valor: T;
  onCambiar: (valor: T) => void;
  etiqueta: string;
}) {
  return (
    <Box role="group" aria-label={etiqueta} sx={{ display: "inline-flex", flexWrap: "wrap", gap: 0.75 }}>
      {opciones.map((o) => {
        const marcado = o.valor === valor;
        return (
          <Box
            key={o.valor}
            component="button"
            type="button"
            aria-pressed={marcado}
            onClick={() => onCambiar(o.valor)}
            sx={{
              border: `1px solid ${marcado ? tinta.acento : tinta.borde}`,
              bgcolor: marcado ? "#eff4ff" : "#fff",
              color: marcado ? tinta.acento : tinta.secundaria,
              fontWeight: marcado ? 700 : 600,
              fontSize: 12,
              borderRadius: 999,
              px: 1.25,
              py: 0.35,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              transition: "all 120ms ease",
              "&:hover": { borderColor: marcado ? tinta.acento : "#cbd5e1" },
            }}
          >
            {o.texto}
          </Box>
        );
      })}
    </Box>
  );
}

/** Botón cuadrado de solo ícono para las barras de filtros (34 px, como los selects). */
export const botonIconoSx = {
  width: 34,
  height: 34,
  borderRadius: "10px",
  border: `1px solid ${tinta.borde}`,
  bgcolor: "#fff",
  color: tinta.secundaria,
  "&:hover": { borderColor: "#cbd5e1", bgcolor: tinta.fondoSuave },
  "&.Mui-disabled": { color: "#cbd5e1", borderColor: "#f1f5f9" },
} as const;

/** Limpiar todos los filtros de la vista: solo el ícono, con tooltip. */
export function BotonLimpiar({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Tooltip title={disabled ? "" : "Limpiar filtros"}>
      <span>
        <IconButton aria-label="Limpiar filtros" onClick={onClick} disabled={disabled} sx={botonIconoSx}>
          <IconTrash size={17} />
        </IconButton>
      </span>
    </Tooltip>
  );
}

/** Pestañas de una vista (debajo de la barra de filtros). */
export const pestanasSx = {
  mb: 2,
  minHeight: 36,
  borderBottom: `1px solid ${tinta.borde}`,
  "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 14, minHeight: 36, px: 1.5, color: tinta.secundaria },
  "& .Mui-selected": { color: `${tinta.primaria} !important` },
} as const;
