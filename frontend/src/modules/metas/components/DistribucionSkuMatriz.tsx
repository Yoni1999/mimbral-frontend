"use client";
import { Alert, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import type { GoalItem, GoalTarget, GoalTargetItem } from "../types";

interface Props {
  items: GoalItem[];
  targets: GoalTarget[];
  targetItems: GoalTargetItem[];
  onChange: (targetItems: GoalTargetItem[]) => void;
  disabled?: boolean;
}

/** Modo DISTRIBUTED de una meta SKU_QUANTITY: matriz editable SKU x
 *  responsable. Ver prompt sección "SKU DISTRIBUTED". */
export default function DistribucionSkuMatriz({ items, targets, targetItems, onChange, disabled }: Props) {
  function obtenerCantidad(sku: string, referenceId: string): number {
    return targetItems.find((ti) => ti.sku === sku && ti.targetReferenceId === referenceId)?.assignedQuantity ?? 0;
  }

  function actualizar(sku: string, referenceId: string, cantidad: number) {
    const sinEsteValor = targetItems.filter((ti) => !(ti.sku === sku && ti.targetReferenceId === referenceId));
    onChange(cantidad > 0 ? [...sinEsteValor, { sku, targetReferenceId: referenceId, assignedQuantity: cantidad }] : sinEsteValor);
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>SKU</TableCell>
          <TableCell align="right">Meta total</TableCell>
          {targets.map((t) => (
            <TableCell key={t.targetReferenceId} align="right">{t.targetName}</TableCell>
          ))}
          <TableCell align="right">Total asignado</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => {
          const totalAsignado = targets.reduce((acc, t) => acc + obtenerCantidad(item.sku, t.targetReferenceId), 0);
          const coincide = totalAsignado === item.targetQuantity;
          return (
            <TableRow key={item.sku}>
              <TableCell>
                {item.sku}
                <Typography variant="caption" display="block" color="text.secondary">{item.productName}</Typography>
              </TableCell>
              <TableCell align="right">{item.targetQuantity}</TableCell>
              {targets.map((t) => (
                <TableCell key={t.targetReferenceId} align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={obtenerCantidad(item.sku, t.targetReferenceId) || ""}
                    disabled={disabled}
                    onChange={(e) => actualizar(item.sku, t.targetReferenceId, Math.max(0, Number(e.target.value) || 0))}
                    inputProps={{ min: 0, style: { textAlign: "right" } }}
                    sx={{ width: 90 }}
                  />
                </TableCell>
              ))}
              <TableCell align="right" sx={{ color: coincide ? "success.main" : "warning.main", fontWeight: 600 }}>
                {totalAsignado}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      {items.length > 0 && !items.every((item) => targets.reduce((acc, t) => acc + obtenerCantidad(item.sku, t.targetReferenceId), 0) === item.targetQuantity) ? (
        <caption>
          <Alert severity="warning" sx={{ m: 1 }}>
            Cada fila debe sumar exactamente su meta total para poder guardar.
          </Alert>
        </caption>
      ) : null}
    </Table>
  );
}
