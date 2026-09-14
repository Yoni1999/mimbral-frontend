"use client";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { IconFileSpreadsheet, IconDownload, IconUpload } from "@tabler/icons-react";
import { resolverProductosPorSku } from "../services/metas.client";
import type { AssignmentMode, GoalItem, GoalTarget, GoalTargetItem } from "../types";

const ENCABEZADOS_SKU = ["sku", "código", "codigo", "referencia", "referenceid"];
const ENCABEZADOS_CANTIDAD = ["cantidad", "cant", "qty", "cantidad objetivo", "cantidad meta"];
const ENCABEZADOS_RESPONSABLE = ["responsable", "canal", "vendedor", "canal de venta"];
const MAX_FILAS = 500;

type EstadoFila = "ok" | "sku-no-encontrado" | "cantidad-invalida" | "responsable-no-reconocido";

interface FilaImportada {
  sku: string;
  productName?: string;
  cantidad: number;
  responsableTexto?: string;
  targetReferenceId?: string;
  estado: EstadoFila;
}

interface Props {
  value: GoalItem[];
  onChange: (items: GoalItem[]) => void;
  targets?: GoalTarget[];
  assignmentMode?: AssignmentMode;
  targetItems?: GoalTargetItem[];
  onTargetItemsChange?: (targetItems: GoalTargetItem[]) => void;
  disabled?: boolean;
}

function normalizar(valor: string) {
  return valor.trim().toLowerCase();
}

function buscarColumna(fila: Record<string, unknown>, candidatos: string[]) {
  return Object.keys(fila).find((clave) => candidatos.includes(normalizar(clave)));
}

const ESTILO_ESTADO: Record<EstadoFila, { label: string; color: "success" | "error" | "warning" }> = {
  ok: { label: "OK", color: "success" },
  "sku-no-encontrado": { label: "SKU no existe en el catálogo", color: "error" },
  "cantidad-invalida": { label: "Cantidad inválida", color: "error" },
  "responsable-no-reconocido": { label: "Responsable no reconocido — se agrega sin distribuir", color: "warning" },
};

/** Carga masiva de SKU + cantidad (y opcionalmente responsable) desde un
 *  Excel, para no tener que buscar y agregar producto por producto. Cada SKU
 *  se valida contra el catálogo real (catalog-service-v1, vía
 *  `resolverProductosPorSku`) antes de dejarlo aplicar — nunca se confía en
 *  el nombre de producto que traiga el archivo. */
export default function ImportarSkuExcelDialog({
  value,
  onChange,
  targets = [],
  assignmentMode,
  targetItems = [],
  onTargetItemsChange,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [filas, setFilas] = useState<FilaImportada[]>([]);
  const [error, setError] = useState<string | null>(null);

  const esDistribuido = assignmentMode === "DISTRIBUTED" && targets.length > 0;

  function descargarPlantilla() {
    const ejemploResponsable = targets[0]?.targetName || "Nombre del vendedor o canal ya agregado a la meta";
    const filasEjemplo = esDistribuido
      ? [
          { SKU: "SKU-0001", Cantidad: 10, Responsable: ejemploResponsable },
          { SKU: "SKU-0002", Cantidad: 5, Responsable: ejemploResponsable },
        ]
      : [
          { SKU: "SKU-0001", Cantidad: 10 },
          { SKU: "SKU-0002", Cantidad: 5 },
        ];
    const hoja = XLSX.utils.json_to_sheet(filasEjemplo);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "SKU");
    XLSX.writeFile(libro, "plantilla-carga-sku.xlsx");
  }

  async function manejarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    setError(null);
    setFilas([]);
    setAbierto(true);
    setCargando(true);
    try {
      const buffer = await archivo.arrayBuffer();
      const libro = XLSX.read(buffer, { type: "array" });
      const hoja = libro.Sheets[libro.SheetNames[0]];
      const filasCrudas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: "" });

      if (filasCrudas.length === 0) {
        setError("El archivo no tiene filas.");
        return;
      }
      if (filasCrudas.length > MAX_FILAS) {
        setError(`El archivo tiene más de ${MAX_FILAS} filas — divídelo en lotes más pequeños.`);
        return;
      }

      const colSku = buscarColumna(filasCrudas[0], ENCABEZADOS_SKU);
      const colCantidad = buscarColumna(filasCrudas[0], ENCABEZADOS_CANTIDAD);
      const colResponsable = buscarColumna(filasCrudas[0], ENCABEZADOS_RESPONSABLE);

      if (!colSku || !colCantidad) {
        setError('El archivo debe tener al menos las columnas "SKU" y "Cantidad" (revisa la plantilla).');
        return;
      }

      const parseadas = filasCrudas
        .map((fila) => ({
          sku: String(fila[colSku] ?? "").trim(),
          cantidad: Number(fila[colCantidad]),
          responsableTexto: colResponsable ? String(fila[colResponsable] ?? "").trim() : "",
        }))
        .filter((f) => f.sku);

      if (parseadas.length === 0) {
        setError("No se encontraron filas con SKU.");
        return;
      }

      const skusUnicos = [...new Set(parseadas.map((f) => f.sku))];
      const { items: encontrados, notFound } = await resolverProductosPorSku(skusUnicos);
      const productoPorSku = new Map(encontrados.map((p) => [p.sku, p]));
      const noEncontrados = new Set(notFound);

      const resultado: FilaImportada[] = parseadas.map((f) => {
        let targetReferenceId: string | undefined;
        let estado: EstadoFila = "ok";

        if (noEncontrados.has(f.sku)) {
          estado = "sku-no-encontrado";
        } else if (!(f.cantidad > 0)) {
          estado = "cantidad-invalida";
        } else if (esDistribuido && f.responsableTexto) {
          const match = targets.find(
            (t) =>
              normalizar(t.targetName || "") === normalizar(f.responsableTexto) ||
              normalizar(t.targetCode || "") === normalizar(f.responsableTexto)
          );
          if (match) targetReferenceId = match.targetReferenceId;
          else estado = "responsable-no-reconocido";
        }

        return {
          sku: f.sku,
          productName: productoPorSku.get(f.sku)?.productName,
          cantidad: f.cantidad,
          responsableTexto: f.responsableTexto || undefined,
          targetReferenceId,
          estado,
        };
      });

      setFilas(resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el archivo. Verifica que sea un Excel válido.");
    } finally {
      setCargando(false);
    }
  }

  const filasValidas = filas.filter((f) => f.estado === "ok" || f.estado === "responsable-no-reconocido");
  const filasConError = filas.length - filasValidas.length;

  function aplicar() {
    const totalesPorSku = new Map<string, { productName?: string; total: number }>();
    for (const f of filasValidas) {
      const actual = totalesPorSku.get(f.sku) || { productName: f.productName, total: 0 };
      actual.total += f.cantidad;
      actual.productName = actual.productName || f.productName;
      totalesPorSku.set(f.sku, actual);
    }

    const itemsPorSku = new Map(value.map((it) => [it.sku, it]));
    totalesPorSku.forEach(({ productName, total }, sku) => {
      const existente = itemsPorSku.get(sku);
      itemsPorSku.set(sku, { sku, productName: productName || existente?.productName || sku, targetQuantity: total });
    });
    onChange(Array.from(itemsPorSku.values()));

    if (esDistribuido && onTargetItemsChange) {
      const nuevos = filasValidas.filter((f) => f.targetReferenceId);
      if (nuevos.length > 0) {
        const restantes = targetItems.filter(
          (ti) => !nuevos.some((f) => f.sku === ti.sku && f.targetReferenceId === ti.targetReferenceId)
        );
        onTargetItemsChange([
          ...restantes,
          ...nuevos.map((f) => ({ targetReferenceId: f.targetReferenceId as string, sku: f.sku, assignedQuantity: f.cantidad })),
        ]);
      }
    }

    cerrar();
  }

  function cerrar() {
    setAbierto(false);
    setFilas([]);
    setError(null);
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" hidden onChange={manejarArchivo} />
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<IconUpload size={16} />}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Importar Excel
        </Button>
        <Tooltip title="Descarga una plantilla con las columnas esperadas">
          <Button size="small" variant="text" startIcon={<IconDownload size={16} />} onClick={descargarPlantilla}>
            Plantilla
          </Button>
        </Tooltip>
      </Stack>

      <Dialog open={abierto} onClose={cargando ? undefined : cerrar} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconFileSpreadsheet size={20} />
            <Typography variant="h6" component="span">Importar SKU desde Excel</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {cargando && (
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>Leyendo y validando contra el catálogo…</Typography>
              <LinearProgress />
            </Box>
          )}

          {!cargando && error && <Alert severity="error">{error}</Alert>}

          {!cargando && !error && filas.length > 0 && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" color="success" label={`${filasValidas.length} lista(s) para agregar`} />
                {filasConError > 0 && <Chip size="small" color="error" label={`${filasConError} con error`} />}
              </Stack>

              {esDistribuido && !filas.some((f) => f.responsableTexto) && (
                <Alert severity="info">
                  La meta es distribuida pero el archivo no trae columna &quot;Responsable&quot;: los productos se agregarán
                  sin repartir — podrás completar la distribución manualmente más abajo.
                </Alert>
              )}

              <Box sx={{ maxHeight: 320, overflow: "auto" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>SKU</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      {esDistribuido && <TableCell>Responsable</TableCell>}
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filas.map((f, idx) => (
                      <TableRow key={`${f.sku}-${idx}`} hover>
                        <TableCell>{f.sku}</TableCell>
                        <TableCell>{f.productName || "—"}</TableCell>
                        <TableCell align="right">{f.cantidad}</TableCell>
                        {esDistribuido && <TableCell>{f.responsableTexto || "—"}</TableCell>}
                        <TableCell>
                          <Chip size="small" variant="outlined" color={ESTILO_ESTADO[f.estado].color} label={ESTILO_ESTADO[f.estado].label} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              <Divider />
              <Typography variant="caption" color="text.secondary">
                Los SKU repetidos en el archivo suman su cantidad. Si un SKU ya estaba agregado a la meta, se
                reemplaza su cantidad por la del archivo.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrar} disabled={cargando}>Cancelar</Button>
          <Button variant="contained" onClick={aplicar} disabled={cargando || filasValidas.length === 0}>
            Agregar {filasValidas.length > 0 ? filasValidas.length : ""} producto(s)
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
