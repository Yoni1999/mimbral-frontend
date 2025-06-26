export function formatearRUTDesdeSAP(raw: string): string {
  if (!raw) return "";

  const cuerpo = raw.slice(0, -1); // eliminar el último carácter (el "c" o cualquier letra de SAP)

  let sum = 0;
  let multiplier = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    sum += Number(cuerpo.charAt(i)) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const mod = 11 - (sum % 11);
  const dv = mod === 11 ? "0" : mod === 10 ? "K" : String(mod);

  return `${cuerpo}-${dv}`;
}
