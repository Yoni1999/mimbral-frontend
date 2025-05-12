// src/utils/format.ts
export const formatVentas = (valor: number): string => {
    if (valor >= 1_000_000) {
      return `$${(valor / 1_000_000).toFixed(1)}M`;
    } else if (valor >= 1_000) {
      return `$${(valor / 1_000).toFixed(1)}k`;
    } else {
      return `$${valor}`;
    }
  };
  
export const formatUnidades = (valor: number): string => {
    return valor.toLocaleString("es-CL");
  };
  