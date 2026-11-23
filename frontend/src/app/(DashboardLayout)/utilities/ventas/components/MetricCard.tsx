import { Box, Skeleton, Tooltip, Typography } from "@mui/material";
import { IconArrowUpRight } from "@tabler/icons-react";
import { ChipVariacion, cifraSx, tarjetaSx, tinta } from "./estilo";

/** Nota de las tarjetas de venta: las cifras son de facturas y no restan las
 *  notas de crédito. La tarjeta de notas de crédito no la lleva. */
export const notaSinNc = (titulo: string, conTarjetaNc = false) =>
  titulo === "Notas de crédito"
    ? undefined
    : `Venta facturada: no descuenta las notas de crédito.${conTarjetaNc ? " Las notas de crédito se ven en su propia tarjeta." : ""}`;

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
  nota,
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
  /** Aclaración que aparece al pasar el cursor (p. ej. notaSinNc). */
  nota?: string;
}) => (
  <Tooltip
    title={
      nota ? (
        <>
          {nota}
          {onClick && <Box component="span" sx={{ display: "block", mt: 0.5, opacity: 0.8 }}>Clic para ver el detalle.</Box>}
        </>
      ) : (
        ""
      )
    }
    arrow
    placement="top"
  >
    <Box
      component={onClick ? "button" : "div"}
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={onClick && !nota ? `Ver el detalle de ${title.toLowerCase()}` : undefined}
      sx={{
        ...tarjetaSx,
        width: "100%",
        height: "100%",
        px: 1.5,
        // En celular la tarjeta va a la mitad de alto: etiqueta, cifra con su
        // variación al lado y la comparación debajo.
        py: { xs: 1, sm: 1.25 },
        display: "flex",
        flexDirection: "column",
        gap: { xs: 0.25, sm: 0.5 },
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minHeight: { xs: 0, sm: 20 } }}>
        {icon && (
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: "6px",
              // En celular la etiqueta va sola, sin ícono.
              display: { xs: "none", sm: "grid" },
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
            fontSize: { xs: 11.5, sm: 12.5 },
            fontWeight: { xs: 500, sm: 600 },
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

      {/* En celular la variación va en la misma línea que la cifra, a la derecha;
          si la cifra es larga y no caben las dos, la variación baja. */}
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: { xs: "wrap", sm: "nowrap" }, justifyContent: "space-between", columnGap: 1, rowGap: 0.25 }}>
        <Typography noWrap sx={{ fontSize: 20, fontWeight: { xs: 700, sm: 750 }, maxWidth: "100%", color: tinta.primaria, lineHeight: 1.15, minWidth: 0, ...cifraSx }}>
          {cargando ? <Skeleton width={110} /> : value}
        </Typography>
        {!cargando && (
          <Box component="span" sx={{ display: "inline-flex", flexShrink: 0, "& > span": { fontSize: { xs: 11, sm: 12 }, px: { xs: 0.6, sm: 0.75 } }, "& svg": { width: { xs: 12, sm: 14 }, height: { xs: 12, sm: 14 } } }}>
            <ChipVariacion valor={percentageChange} masEsMejor={masEsMejor} unidad={unidadVariacion} />
          </Box>
        )}
      </Box>

      {subtitle && (
        <Typography noWrap sx={{ fontSize: { xs: 11, sm: 11.5 }, color: tinta.tenue, lineHeight: 1.2, ...cifraSx }}>
          {cargando ? <Skeleton width="45%" /> : subtitle}
        </Typography>
      )}
    </Box>
  </Tooltip>
);

export default MetricCard;
