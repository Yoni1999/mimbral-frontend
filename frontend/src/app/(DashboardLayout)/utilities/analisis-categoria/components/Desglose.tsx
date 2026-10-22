"use client";

import React from "react";
import { Typography } from "@mui/material";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import ListaBarras from "@/app/(DashboardLayout)/utilities/ventas/components/ListaBarras";
import { ChipVariacion, Panel, formatoMonto, formatoPorcentaje, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { Arbol, FilaDesglose, NIVELES, Paso, configDe } from "../niveles";

interface Props {
  arbol: Arbol;
  ruta: Paso[];
  /** Query de fechas (fechaInicio/fechaFin). */
  periodo: string;
  /** Primeros niveles de categorías (código y nombre), para su raíz. */
  primerosNiveles: { codigo: string; nombre: string }[];
  onEntrar: (paso: Paso) => void;
}

/** Pide la venta de cada primer nivel, de a 4 a la vez: no hay un endpoint
 *  que entregue todos los primeros niveles con su venta. */
async function ventasPorPrimerNivel(niveles: { codigo: string; nombre: string }[], periodo: string, signal: AbortSignal) {
  const filas: FilaDesglose[] = [];
  const cola = [...niveles];
  const trabajador = async () => {
    for (let n = cola.shift(); n; n = cola.shift()) {
      const d = await apiJson(`${BACKEND_URL}${NIVELES[1].tarjetas.ventas}?${periodo}&primerNivel=${encodeURIComponent(n.codigo)}`, { signal });
      filas.push({ ...n, venta: Number(d?.TotalVentasPeriodo) || 0, cambio: d?.PorcentajeCambio ?? null });
    }
  };
  await Promise.all([trabajador(), trabajador(), trabajador(), trabajador()]);
  return filas;
}

/** Las partes del nivel actual con su venta: al pulsar una se baja a ella
 *  (primeros niveles → categorías → subcategorías, o familias → subfamilias). */
export default function Desglose({ arbol, ruta, periodo, primerosNiveles, onEntrar }: Props) {
  const { arbol: a, ultimo, config, filtro } = configDe(arbol, ruta);
  const hijos = ultimo ? config.hijos : a.raiz;
  const nivelHijo = ((ultimo?.nivel ?? 0) + 1) as 1 | 2 | 3;
  const porPrimerNivel = !ultimo && !a.raiz;

  const query = new URLSearchParams(periodo);
  Object.entries(filtro).forEach(([k, v]) => query.set(k, v));
  const clave = porPrimerNivel
    ? primerosNiveles.length
      ? `desglose:raiz:${periodo}:${primerosNiveles.length}`
      : null
    : hijos
      ? `${BACKEND_URL}${hijos.url}?${query.toString()}`
      : null;

  const { datos, cargando } = useCargaDatos<FilaDesglose[]>(
    clave,
    async (signal) => {
      if (porPrimerNivel) return ventasPorPrimerNivel(primerosNiveles, periodo, signal);
      const json = await apiJson(clave!, { signal });
      return (Array.isArray(json) ? json : []).map(hijos!.fila);
    },
    []
  );

  const filas = datos.filter((f) => f.venta !== 0).sort((a, b) => b.venta - a.venta);
  const total = filas.reduce((s, f) => s + f.venta, 0);
  const etiquetaHijo = a.niveles[nivelHijo]?.etiqueta.toLowerCase() ?? "";

  return (
    <Panel
      titulo={`Desglose por ${etiquetaHijo}`}
      descripcion={cargando ? "Cargando…" : `${filas.length} con venta en el período · pulsa una para entrar`}
    >
      <ListaBarras
        cargando={cargando || (porPrimerNivel && primerosNiveles.length === 0)}
        filasCargando={8}
        vacio="Sin ventas en el período."
        items={filas.map((f) => ({
          clave: f.codigo,
          etiqueta: f.nombre,
          valor: f.venta,
          texto: formatoMonto(f.venta),
          detalle:
            f.cambio !== undefined ? (
              <ChipVariacion valor={f.cambio} />
            ) : (
              <Typography component="span" sx={{ fontSize: 12, color: tinta.tenue, minWidth: 44, textAlign: "right" }}>
                {total > 0 ? formatoPorcentaje((f.venta / total) * 100) : "—"}
              </Typography>
            ),
          tooltip: [
            total > 0 ? `${formatoPorcentaje((f.venta / total) * 100)} del total` : null,
            f.unidades !== undefined ? `${f.unidades.toLocaleString("es-CL")} unidades` : null,
            f.transacciones !== undefined ? `${f.transacciones.toLocaleString("es-CL")} ventas` : null,
          ]
            .filter(Boolean)
            .join(" · "),
        }))}
        onSeleccionar={(item) => onEntrar({ nivel: nivelHijo, codigo: item.clave, nombre: item.etiqueta })}
      />
    </Panel>
  );
}

