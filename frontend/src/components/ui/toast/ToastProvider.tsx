"use client";
import { Toaster } from "react-hot-toast";

/** Monta el contenedor de avisos flotantes (arriba a la derecha). Una sola
 * vez, en el layout raiz — ver src/app/layout.tsx. */
export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{ duration: Infinity }}
      containerStyle={{ zIndex: 2000 }}
    />
  );
}
