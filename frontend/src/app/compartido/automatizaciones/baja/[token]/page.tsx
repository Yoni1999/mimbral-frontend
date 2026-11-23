"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { BACKEND_URL } from "@/config";
import { apiJson } from "@/utils/apiClient";
import { estado, tarjetaSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";

/**
 * Enlace "Dejar de recibir este informe" de los correos de Automatizaciones.
 * Público: no pide cuenta. El token del enlace es de UN destinatario de UNA
 * automatización, y lo único que se muestra es el nombre, quién la envía, qué
 * informes trae y cuándo llega (ningún dato de ventas).
 */

interface Vista {
  automatizacion: string;
  enviaNombre: string;
  informes: string[];
  cuando: string;
  correo: string;
  estado: "activo" | "baja";
}

export default function DejarDeRecibir() {
  const params = useParams<{ token: string }>();
  const token = String(params?.token ?? "");
  const url = `${BACKEND_URL}/api/public/automatizaciones/baja/${encodeURIComponent(token)}`;
  const [vista, setVista] = React.useState<Vista | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [trabajando, setTrabajando] = React.useState(false);

  React.useEffect(() => {
    let vigente = true;
    apiJson(url, { auth: "none" })
      .then((v: Vista) => vigente && setVista(v))
      .catch((e: unknown) => vigente && setError(e instanceof Error ? e.message : "No pudimos abrir el enlace."));
    return () => {
      vigente = false;
    };
  }, [url]);

  const accion = async (sufijo: "" | "/deshacer") => {
    setTrabajando(true);
    try {
      setVista(await apiJson(`${url}${sufijo}`, { method: "POST", auth: "none", body: "{}" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar. Inténtalo de nuevo.");
    } finally {
      setTrabajando(false);
    }
  };

  const fila = (etiqueta: string, valor: React.ReactNode) => (
    <Box sx={{ display: "flex", gap: 1.5 }}>
      <Typography sx={{ fontSize: 12.5, color: tinta.tenue, width: 110, flexShrink: 0 }}>{etiqueta}</Typography>
      <Typography sx={{ fontSize: 12.5, color: tinta.primaria, minWidth: 0 }}>{valor}</Typography>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6fa", display: "flex", justifyContent: "center", alignItems: "flex-start", px: 2, py: { xs: 4, md: 8 } }}>
      <Box sx={{ ...tarjetaSx, width: "100%", maxWidth: 520, p: 3, display: "grid", gap: 2 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 800, color: tinta.acento, letterSpacing: ".04em" }}>ANÁLISIS 360 · MIMBRAL</Typography>

        {error ? (
          <>
            <Typography sx={{ fontSize: 20, fontWeight: 800 }}>No pudimos abrir este enlace</Typography>
            <Typography sx={{ fontSize: 14, color: tinta.secundaria }}>{error}</Typography>
          </>
        ) : !vista ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : vista.estado === "activo" ? (
          <>
            <Typography sx={{ fontSize: 20, fontWeight: 800 }}>¿Dejar de recibir este informe?</Typography>
            <Typography sx={{ fontSize: 14, color: tinta.secundaria, lineHeight: 1.55 }}>
              Te llega porque otra persona te agregó a su automatización. Si la desactivas, solo dejas de recibir esta. Las demás que recibes siguen igual.
            </Typography>
            <Box sx={{ border: `1px solid ${tinta.borde}`, borderRadius: "12px", bgcolor: tinta.fondoSuave, px: 1.75, py: 1.5, display: "grid", gap: 0.75 }}>
              {fila("Automatización", <strong>{vista.automatizacion}</strong>)}
              {vista.enviaNombre && fila("La envía", vista.enviaNombre)}
              {fila("Contenido", vista.informes.join(" · "))}
              {fila("Cuándo", vista.cuando)}
              {fila("Tu correo", vista.correo)}
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="contained" disableElevation disabled={trabajando} onClick={() => accion("")} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}>
                {trabajando ? "Desactivando…" : "Dejar de recibir"}
              </Button>
            </Box>
            <Typography sx={{ fontSize: 11.5, color: tinta.tenue }}>No necesitas entrar al sistema. Este enlace es solo tuyo y solo sirve para esta automatización.</Typography>
          </>
        ) : (
          <>
            <Typography sx={{ fontSize: 20, fontWeight: 800 }}>Listo, ya no recibirás «{vista.automatizacion}»</Typography>
            <Box sx={{ borderLeft: `4px solid ${estado.bien.color}`, bgcolor: estado.bien.fondo, borderRadius: "10px", px: 1.75, py: 1.25 }}>
              <Typography sx={{ fontSize: 13.5 }}>{vista.enviaNombre ? `Avisamos a ${vista.enviaNombre}. ` : ""}En su lista verá que te diste de baja.</Typography>
            </Box>
            <Typography sx={{ fontSize: 13.5, color: tinta.secundaria }}>
              Si tienes cuenta, en Ajustes → Automatizaciones verás todo lo que recibes y podrás volver a activarla.
            </Typography>
            <Box>
              <Button variant="outlined" disabled={trabajando} onClick={() => accion("/deshacer")} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}>
                Deshacer
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
