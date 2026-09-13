"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, CircularProgress, Chip, TextField } from "@mui/material";
import { buscarVendedores, buscarCanalesDeVenta } from "../services/metas.client";
import type { GoalTarget, ResponsibleOption, TargetType } from "../types";

const DEBOUNCE_MS = 350;

interface Props {
  targetType: TargetType;
  value: GoalTarget[];
  onChange: (targets: GoalTarget[]) => void;
  disabled?: boolean;
}

/** Busca vendedores (oms-service) o canales de venta (comerce-service), según
 *  `targetType`, con debounce — no carga el listado completo (ver prompt: "No
 *  cargar el catalogo completo en frontend"). */
export default function ResponsableAutocomplete({ targetType, value, onChange, disabled }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<ResponsibleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const buscar = useMemo(() => (targetType === "SELLER" ? buscarVendedores : buscarCanalesDeVenta), [targetType]);
  const etiqueta = targetType === "SELLER" ? "Vendedor" : "Canal de venta";

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { items } = await buscar(inputValue, 1, 20);
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
    // Se rebusca cuando cambia el texto o el tipo de responsable (al cambiar
    // de SELLER a SALES_CHANNEL las opciones anteriores ya no aplican).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, targetType]);

  const seleccionados: (ResponsibleOption & { targetType: TargetType })[] = value.map((t) => ({
    referenceId: t.targetReferenceId,
    code: t.targetCode || t.targetReferenceId,
    name: t.targetName || t.targetReferenceId,
    targetType: t.targetType,
  }));

  return (
    <Autocomplete
      multiple
      disabled={disabled}
      options={options}
      loading={loading}
      value={seleccionados}
      inputValue={inputValue}
      onInputChange={(_, texto) => setInputValue(texto)}
      isOptionEqualToValue={(option, val) => option.referenceId === val.referenceId}
      getOptionLabel={(option) => option.name}
      filterOptions={(opts) => opts.filter((o) => !value.some((v) => v.targetReferenceId === o.referenceId))}
      onChange={(_, seleccion) => {
        onChange(
          seleccion.map((opcion) => ({
            targetType,
            targetReferenceId: opcion.referenceId,
            targetCode: opcion.code,
            targetName: opcion.name,
            assignedAmount: null,
          }))
        );
      }}
      renderTags={(tags, getTagProps) =>
        tags.map((option, index) => (
          <Chip label={option.name} size="small" {...getTagProps({ index })} key={option.referenceId} />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={`Buscar ${etiqueta.toLowerCase()}`}
          placeholder={value.length ? "Agregar otro..." : `Nombre del ${etiqueta.toLowerCase()}`}
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
  );
}
