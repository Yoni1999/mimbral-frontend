"use client";

// Aviso flotante con cuenta regresiva — mismo patron que
// FrontOmsMimbral/components/ui/toast/countdown-toast.tsx, portado a MUI (este
// proyecto no tiene Tailwind).
//
// El boton cerrar lleva un anillo que se va llenando mientras corre el tiempo:
// la persona ve cuanto le queda al aviso sin adivinarlo. Con el mouse encima se
// detiene, para que no se cierre justo cuando van a leerlo. El cierre lo decide
// un temporizador y no el fin de la animacion: la pestana en segundo plano no
// pausa un timeout, pero si podria "saltarse" el fin de una animacion CSS.

import { useEffect, useRef, useState } from "react";
import { toast, type Toast } from "react-hot-toast";
import { Box, IconButton } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";

export type ToastTone = "success" | "error" | "info";

const TONO: Record<ToastTone, { Icon: typeof CheckCircleIcon; color: string }> = {
  success: { Icon: CheckCircleIcon, color: "#10b981" },
  error: { Icon: CancelIcon, color: "#ef4444" },
  info: { Icon: InfoIcon, color: "#3b82f6" },
};

export interface CountdownToastProps {
  /** El toast de react-hot-toast: su id para cerrarlo y si sigue visible. */
  t: Pick<Toast, "id" | "visible">;
  title: string;
  description?: string;
  /** Cuanto dura el aviso. El anillo se llena en ese mismo lapso. */
  durationMs: number;
  tone?: ToastTone;
}

export function CountdownToast({ t, title, description, durationMs, tone = "success" }: CountdownToastProps) {
  const [hovered, setHovered] = useState(false);
  // Lo que le queda al aviso. Se descuenta cada vez que la cuenta se detiene,
  // asi al retomar sigue desde donde iba y no vuelve a empezar.
  const restante = useRef(durationMs);
  const { Icon, color } = TONO[tone];

  useEffect(() => {
    if (hovered || !t.visible) return;
    const pendiente = restante.current;
    const inicio = Date.now();
    const timer = window.setTimeout(() => toast.dismiss(t.id), pendiente);
    return () => {
      window.clearTimeout(timer);
      restante.current = Math.max(0, pendiente - (Date.now() - inicio));
    };
  }, [hovered, t.id, t.visible]);

  return (
    <Box
      role="status"
      aria-live="polite"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        width: 380,
        maxWidth: "calc(100vw - 32px)",
        borderRadius: 2,
        bgcolor: "background.paper",
        p: 2,
        boxShadow: 4,
        border: "1px solid",
        borderColor: "divider",
        opacity: t.visible ? 1 : 0,
        transform: t.visible ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 150ms ease, transform 150ms ease",
      }}
    >
      <Icon sx={{ color, flexShrink: 0, mt: "1px" }} fontSize="small" />

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box component="p" sx={{ m: 0, fontWeight: 600, fontSize: "0.9rem", color: "text.primary" }}>
          {title}
        </Box>
        {description && (
          <Box component="p" sx={{ m: 0, mt: 0.25, fontSize: "0.825rem", color: "text.secondary" }}>
            {description}
          </Box>
        )}
      </Box>

      <IconButton
        size="small"
        onClick={() => toast.dismiss(t.id)}
        aria-label="Cerrar notificacion"
        title="Cerrar"
        sx={{ position: "relative", width: 32, height: 32, mt: -0.5, mr: -0.5, flexShrink: 0 }}
      >
        {/* `inset:0` junto con un ancho/alto fijo queda sobreconstreñido: el
            navegador ancla el SVG arriba-a-la-izquierda del boton en vez de
            centrarlo, y si el boton no mide exactamente 32x32 el anillo queda
            corrido respecto del icono (que si se centra solo, via flexbox del
            IconButton). Centrarlo con translate al 50/50% no depende de que
            los tamaños calcen. */}
        <Box
          component="svg"
          viewBox="0 0 32 32"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 32,
            height: 32,
            transform: "translate(-50%, -50%) rotate(-90deg)",
          }}
          aria-hidden="true"
        >
          <circle cx="16" cy="16" r="13" fill="none" strokeWidth="2" stroke="rgba(0,0,0,0.1)" />
          <circle
            cx="16"
            cy="16"
            r="13"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            stroke={color}
            pathLength={100}
            style={{
              strokeDasharray: 100,
              strokeDashoffset: 100,
              animationName: "toast-countdown",
              animationDuration: `${durationMs}ms`,
              animationTimingFunction: "linear",
              animationFillMode: "forwards",
              animationPlayState: hovered ? "paused" : "running",
            }}
          />
        </Box>
        <CloseIcon sx={{ position: "relative", fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}
