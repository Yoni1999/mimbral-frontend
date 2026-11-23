"use client";

// Inicio en celular (menos de 600 px): saludo con el nombre y la fecha, la
// venta del mes en una tarjeta grande con su variación y la línea de la venta
// diaria, y los módulos en una lista compacta (una fila por módulo, con su
// cifra clave a la derecha). La barra superior con el título la pone el layout.
// En escritorio el inicio sigue con sus tarjetas.

import { useMemo, type ElementType } from "react";
import { alpha } from "@mui/material/styles";
import { Box, ButtonBase, Skeleton, Typography } from "@mui/material";
import { IconChevronRight } from "@tabler/icons-react";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { getIdServiceSession } from "@/modules/auth/utils/auth.storage";
import { cifraSx, tarjetaSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";

export interface FilaModulo {
  titulo: string;
  ruta: string;
  icono: ElementType;
  color: string;
  cargando: boolean;
  /** Cifra clave, ya formateada ($48,3 M · 5 cat. · 4 activas). */
  valor: string;
  /** Línea chica bajo el nombre. */
  detalle: string;
}

export interface VentaMes {
  cargando: boolean;
  valor: string;
  variacion: number | null;
  /** Venta de cada día del mes, en orden; vacío si no llegó. */
  linea: number[];
}

const fechaDeHoy = () => {
  const texto = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  // "lunes, 23 de noviembre" → "Lunes 23 de noviembre"
  const limpio = texto.replace(",", "");
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
};

const primerNombre = () => {
  const nombre = (getIdServiceSession()?.nombre ?? "").trim().split(/\s+/)[0] ?? "";
  return nombre ? nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase() : "";
};

function TarjetaVentaMes({ venta }: { venta: VentaMes }) {
  const puntos = useMemo(() => venta.linea.map((v, i) => ({ i, v })), [venta.linea]);
  const ultimo = puntos.length - 1;
  const v = venta.variacion;

  return (
    <Box
      sx={{
        borderRadius: "20px",
        p: 2.25,
        pb: puntos.length > 1 ? 1 : 2.25,
        color: "#fff",
        background: "linear-gradient(135deg, #2563eb 0%, #3b5bdb 55%, #4f46e5 100%)",
        boxShadow: "0 14px 30px rgba(37, 99, 235, 0.28)",
      }}
    >
      <Typography sx={{ fontSize: 13, opacity: 0.9 }}>Venta del mes · sin IVA</Typography>
      <Typography sx={{ fontSize: 34, fontWeight: 800, lineHeight: 1.15, mt: 0.5, ...cifraSx }}>
        {venta.cargando ? <Skeleton width={150} sx={{ bgcolor: "rgba(255,255,255,0.25)" }} /> : venta.valor}
      </Typography>
      {!venta.cargando && typeof v === "number" && (
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            mt: 1,
            px: 1.25,
            py: 0.4,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,0.18)",
            fontSize: 12.5,
            fontWeight: 600,
            ...cifraSx,
          }}
        >
          {v > 0 ? "▲" : v < 0 ? "▼" : "="}{" "}
          {Math.abs(v).toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% vs período anterior
        </Box>
      )}
      {/* Línea de la venta diaria del mes (solo si hay al menos dos días). */}
      {puntos.length > 1 && (
        <Box sx={{ height: 64, mt: 1 }} aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={puntos} margin={{ top: 6, right: 6, left: 6, bottom: 6 }}>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Line
                type="monotone"
                dataKey="v"
                stroke="#fff"
                strokeWidth={2}
                isAnimationActive={false}
                dot={(p: any) =>
                  p.index === ultimo ? (
                    <circle key="ultimo" cx={p.cx} cy={p.cy} r={3.5} fill="#fff" />
                  ) : (
                    <g key={p.index} />
                  )
                }
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}

function Fila({ fila, onAbrir, ultima }: { fila: FilaModulo; onAbrir: (ruta: string) => void; ultima: boolean }) {
  const Icono = fila.icono;
  return (
    <ButtonBase
      onClick={() => onAbrir(fila.ruta)}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.75,
        py: 1.4,
        textAlign: "left",
        fontFamily: "inherit",
        borderBottom: ultima ? "none" : `1px solid ${tinta.borde}`,
        "&:active": { bgcolor: tinta.fondoSuave },
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: "11px",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          color: fila.color,
          bgcolor: alpha(fila.color, 0.1),
        }}
      >
        <Icono size={20} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: 14.5, fontWeight: 600, color: tinta.primaria, lineHeight: 1.25 }}>
          {fila.titulo}
        </Typography>
        <Typography noWrap sx={{ fontSize: 12, color: tinta.secundaria, mt: 0.25, lineHeight: 1.3 }}>
          {fila.cargando ? <Skeleton width="70%" /> : fila.detalle}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 15, fontWeight: 700, color: tinta.primaria, whiteSpace: "nowrap", flexShrink: 0, ...cifraSx }}>
        {fila.cargando ? <Skeleton width={56} /> : fila.valor}
      </Typography>
      <IconChevronRight size={16} color={tinta.tenue} style={{ flexShrink: 0, marginLeft: -4 }} />
    </ButtonBase>
  );
}

export default function InicioMovil({
  ventaMes,
  modulos,
  onAbrir,
}: {
  ventaMes: VentaMes;
  modulos: FilaModulo[];
  onAbrir: (ruta: string) => void;
}) {
  const nombre = primerNombre();

  return (
    <Box sx={{ px: 2, pt: 2, pb: 3 }}>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: tinta.primaria, lineHeight: 1.2 }}>
        {nombre ? `Hola, ${nombre}` : "Hola"}
      </Typography>
      <Typography sx={{ fontSize: 13.5, color: tinta.secundaria, mt: 0.25, mb: 2 }}>{fechaDeHoy()}</Typography>

      <TarjetaVentaMes venta={ventaMes} />

      <Typography
        sx={{ mt: 3, mb: 1, px: 0.5, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: tinta.secundaria }}
      >
        MÓDULOS
      </Typography>
      <Box sx={{ ...tarjetaSx, borderRadius: "16px", overflow: "hidden" }}>
        {modulos.map((m, i) => (
          <Fila key={m.ruta} fila={m} onAbrir={onAbrir} ultima={i === modulos.length - 1} />
        ))}
      </Box>
    </Box>
  );
}
