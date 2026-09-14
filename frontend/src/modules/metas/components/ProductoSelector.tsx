"use client";
import { useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { IconPackageOff, IconTrash } from "@tabler/icons-react";
import { buscarProductos } from "../services/metas.client";
import ImportarSkuExcelDialog from "./ImportarSkuExcelDialog";
import type { AssignmentMode, GoalItem, GoalTarget, GoalTargetItem, ProductOption } from "../types";

const DEBOUNCE_MS = 350;

interface Props {
  value: GoalItem[];
  onChange: (items: GoalItem[]) => void;
  disabled?: boolean;
  targets?: GoalTarget[];
  assignmentMode?: AssignmentMode;
  targetItems?: GoalTargetItem[];
  onTargetItemsChange?: (targetItems: GoalTargetItem[]) => void;
}

/** Buscador de SKU (catalog-service-v1, por texto/código/nombre) + tabla de
 *  productos ya agregados a la meta, con su cantidad objetivo editable.
 *  También ofrece carga masiva por Excel (ver ImportarSkuExcelDialog) para no
 *  tener que agregar SKU de a uno cuando son muchos. */
export default function ProductoSelector({ value, onChange, disabled, targets, assignmentMode, targetItems, onTargetItemsChange }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { items } = await buscarProductos(inputValue, 1, 20);
        setOptions(items);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  function agregarProducto(opcion: ProductOption | null) {
    if (!opcion) return;
    if (value.some((it) => it.sku === opcion.sku)) return; // ya está: un SKU no se repite en la meta.
    onChange([...value, { sku: opcion.sku, productName: opcion.productName, targetQuantity: 1 }]);
    setInputValue("");
  }

  function actualizarCantidad(sku: string, cantidad: number) {
    onChange(value.map((it) => (it.sku === sku ? { ...it, targetQuantity: cantidad } : it)));
  }

  function quitarProducto(sku: string) {
    onChange(value.filter((it) => it.sku !== sku));
  }

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-start" }}>
        <Autocomplete
          fullWidth
          disabled={disabled}
          options={options.filter((o) => !value.some((v) => v.sku === o.sku))}
          loading={loading}
          value={null}
          inputValue={inputValue}
          onInputChange={(_, texto) => setInputValue(texto)}
          getOptionLabel={(option) => `${option.sku} — ${option.productName}`}
          onChange={(_, opcion) => agregarProducto(opcion)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar por SKU, código o nombre"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          noOptionsText={inputValue ? "Sin resultados" : "Escribe para buscar"}
        />
        <Box pt={{ xs: 0, sm: 1 }}>
          <ImportarSkuExcelDialog
            value={value}
            onChange={onChange}
            targets={targets}
            assignmentMode={assignmentMode}
            targetItems={targetItems}
            onTargetItemsChange={onTargetItemsChange}
            disabled={disabled}
          />
        </Box>
      </Stack>

      {value.length > 0 ? (
        <Table size="small" sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>SKU</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell align="right" width={160}>Cantidad objetivo</TableCell>
              <TableCell align="center" width={60}>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {value.map((item) => (
              <TableRow key={item.sku} hover>
                <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{item.sku}</TableCell>
                <TableCell>{item.productName}</TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={item.targetQuantity}
                    disabled={disabled}
                    onChange={(e) => actualizarCantidad(item.sku, Math.max(1, Number(e.target.value) || 1))}
                    inputProps={{ min: 1, style: { textAlign: "right" } }}
                    sx={{ width: 110 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" color="error" disabled={disabled} onClick={() => quitarProducto(item.sku)}>
                    <IconTrash size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Stack alignItems="center" spacing={1} sx={{ mt: 2, py: 3, borderRadius: 2, border: "1px dashed", borderColor: "divider", color: "text.secondary" }}>
          <IconPackageOff size={28} strokeWidth={1.5} />
          <Typography variant="body2" color="text.secondary">
            Todavía no agregas productos. Búscalos arriba o impórtalos desde un Excel.
          </Typography>
        </Stack>
      )}
    </>
  );
}
