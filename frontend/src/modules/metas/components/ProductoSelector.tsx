"use client";
import { useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { IconTrash } from "@tabler/icons-react";
import { buscarProductos } from "../services/metas.client";
import type { GoalItem, ProductOption } from "../types";

const DEBOUNCE_MS = 350;

interface Props {
  value: GoalItem[];
  onChange: (items: GoalItem[]) => void;
  disabled?: boolean;
}

/** Buscador de SKU (catalog-service-v1, por texto/código/nombre) + tabla de
 *  productos ya agregados a la meta, con su cantidad objetivo editable. */
export default function ProductoSelector({ value, onChange, disabled }: Props) {
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
      <Autocomplete
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
              <TableRow key={item.sku}>
                <TableCell>{item.sku}</TableCell>
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
                  <IconButton size="small" disabled={disabled} onClick={() => quitarProducto(item.sku)}>
                    <IconTrash size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Todavía no agregas productos.
        </Typography>
      )}
    </>
  );
}
