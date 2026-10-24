import { Box, Skeleton, Typography } from "@mui/material";
import { IconArrowUpRight } from "@tabler/icons-react";
import { ChipVariacion, cifraSx, tarjetaSx, tinta } from "./estilo";

/** Tarjeta de métrica compacta: el título arriba con todo el ancho, el valor
 *  y su variación en la segunda línea, la comparación con el período anterior
 *  debajo. */
const MetricCard = ({
  title,
  value,
  subtitle,
  percentageChange,
  icon,
  cargando = false,
  masEsMejor = true,
  unidadVariacion = "%",
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  percentageChange?: number;
  icon?: React.ReactNode;
  // Se acepta por compatibilidad; el estilo de la tarjeta ya no usa sombra.
  elevation?: number;
  /** Mientras llegan los datos del filtro actual: sin valor viejo ni ceros. */
  cargando?: boolean;
  /** false cuando subir es malo (p. ej. notas de crédito): la variación se pinta al revés. */
  masEsMejor?: boolean;
  /** "pp" cuando la variación es una diferencia de puntos porcentuales (márgenes). */
  unidadVariacion?: "%" | "pp";
  /** Abre el detalle de la cifra: la tarjeta se vuelve pulsable. */
  onClick?: () => void;
}) => (
  <Box
    component={onClick ? "button" : "div"}
    type={onClick ? "button" : undefined}
    onClick={onClick}
    title={onClick ? `Ver el detalle de ${title.toLowerCase()}` : undefined}
    sx={{
      ...tarjetaSx,
      width: "100%",
      height: "100%",
      px: 1.5,
      py: 1.25,
      display: "flex",
      flexDirection: "column",
      gap: 0.5,
      textAlign: "left",
      fontFamily: "inherit",
      position: "relative",
      cursor: onClick ? "pointer" : "default",
      transition: "border-color 160ms ease, box-shadow 160ms ease",
      "&:hover": onClick ? { borderColor: tinta.acento, boxShadow: "0 4px 14px rgba(37, 99, 235, 0.10)" } : { borderColor: "#cbd5e1" },
      "&:hover .ver-detalle": { opacity: 1 },
      "&:focus-visible": { outline: `2px solid ${tinta.acento}`, outlineOffset: 2 },
    }}
  >
    {onClick && (
      <Box
        className="ver-detalle"
        sx={{
          // En celular no hay hover: el aviso no aparece y no tapa el título.
          display: { xs: "none", sm: "inline-flex" },
          position: "absolute",
          top: 8,
          right: 8,
          alignItems: "center",
          gap: 0.25,
          fontSize: 11,
          fontWeight: 700,
          color: tinta.acento,
          bgcolor: "#eff4ff",
          borderRadius: 999,
          px: 0.75,
          py: 0.15,
          opacity: 0,
          transition: "opacity 160ms ease",
          pointerEvents: "none",
        }}
      >
        Ver detalle <IconArrowUpRight size={12} />
      </Box>
    )}
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minHeight: 20 }}>
      {icon && (
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: "6px",
            display: "grid",
            placeItems: "center",
            bgcolor: "#eff4ff",
            color: tinta.acento,
            flexShrink: 0,
            "& svg": { width: 13, height: 13 },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography
        sx={{
          fontSize: { xs: 12, sm: 12.5 },
          fontWeight: 600,
          color: tinta.secundaria,
          flex: 1,
          minWidth: 0,
          lineHeight: 1.25,
          // En celular (dos por línea) el título puede ir en dos líneas en vez de cortarse.
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: { xs: "normal", sm: "nowrap" },
          display: { xs: "-webkit-box", sm: "block" },
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {title}
      </Typography>
    </Box>

    {/* En celular la tarjeta va de a dos por línea: la variación baja bajo la cifra. */}
    <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: { xs: 0.5, sm: 1 } }}>
      <Typography noWrap sx={{ fontSize: { xs: 18, sm: 20 }, fontWeight: 750, maxWidth: "100%", color: tinta.primaria, lineHeight: 1.15, minWidth: 0, ...cifraSx }}>
        {cargando ? <Skeleton width={110} /> : value}
      </Typography>
      {!cargando && <ChipVariacion valor={percentageChange} masEsMejor={masEsMejor} unidad={unidadVariacion} />}
    </Box>

    {subtitle && (
      <Typography noWrap sx={{ fontSize: 11.5, color: tinta.tenue, lineHeight: 1.2, ...cifraSx }}>
        {cargando ? <Skeleton width="45%" /> : subtitle}
      </Typography>
    )}
  </Box>
);

export default MetricCard;
