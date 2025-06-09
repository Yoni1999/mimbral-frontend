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
  
export const formatUnidades = (valor: number | null | undefined): string => {
  if (typeof valor !== 'number') return '0';
  return Math.round(valor).toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export const calcularVariacion = (actual: number, anterior: number): string => {
  if (!anterior || anterior === 0) return "0%";
  const variacion = ((actual - anterior) / anterior) * 100;
  const simbolo = variacion > 0 ? "+" : "";
  return `${simbolo}${variacion.toFixed(1)}%`;
};

  