import { useEffect, useState } from "react";
import { segundosRestantesDelToken } from "@/utils/tokenUtils";

export function useVerificarExpiracionToken() {
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    const intervalo = setInterval(() => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const segundosRestantes = segundosRestantesDelToken(token);

      if (segundosRestantes < 600 && segundosRestantes > 0) {
        setMostrarModal(true);
      }
    }, 60000); 

    return () => clearInterval(intervalo);
  }, []);

  return {
    mostrarModal,
    cerrarModal: () => setMostrarModal(false),
    forzarMostrar: () => setMostrarModal(true),
  };
}
