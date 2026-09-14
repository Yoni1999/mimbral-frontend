"use client";

// Punto de entrada para avisos flotantes con cuenta regresiva. Reemplaza los
// textos sueltos de "Guardado correctamente" / "Error al guardar" que cada
// pantalla mostraba a su manera (un <Typography> aparte, un Snackbar de MUI,
// etc.) por un unico componente reutilizable: notifySuccess/notifyError desde
// cualquier parte del front — guardar, editar, eliminar, lo que sea.

import { toast } from "react-hot-toast";
import { CountdownToast, type ToastTone } from "./CountdownToast";

const DEFAULT_DURATION_MS = 5_000;

export interface NotifyOptions {
  description?: string;
  durationMs?: number;
  /** Id fijo: un segundo aviso con el mismo id reemplaza al primero en vez de
   * apilarse (util para evitar rafagas del mismo mensaje). */
  id?: string;
}

function notify(tone: ToastTone, title: string, options: NotifyOptions = {}) {
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;

  toast.custom(
    (t) => (
      <CountdownToast t={t} title={title} description={options.description} durationMs={durationMs} tone={tone} />
    ),
    { id: options.id, duration: Infinity }
  );
}

export const notifySuccess = (title: string, options?: NotifyOptions) => notify("success", title, options);
export const notifyError = (title: string, options?: NotifyOptions) => notify("error", title, options);
export const notifyInfo = (title: string, options?: NotifyOptions) => notify("info", title, options);
