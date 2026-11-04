"use client";

import React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { IconDownload, IconFileSpreadsheet, IconTrash } from "@tabler/icons-react";
import { tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { MAX_SKUS, leerListaSkus } from "../tipos";
import { descargarPlantillaSkus, leerSkusDeArchivo } from "../exportarExcel";

interface Props {
  abierto: boolean;
  skus: string[];
  onCerrar: () => void;
  onAplicar: (skus: string[]) => void;
}

/** Lista de SKUs del grupo: se escribe o pega (una columna de Excel sirve
 *  tal cual) o se carga un Excel con la plantilla. Muestra cuántos quedan,
 *  los repetidos, lo que no tiene forma de SKU y lo que pasa del máximo,
 *  antes de analizar. */
export default function EditorSkus({ abierto, skus, onCerrar, onAplicar }: Props) {
  const [texto, setTexto] = React.useState("");
  const [leyendo, setLeyendo] = React.useState(false);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (abierto) {
      setTexto(skus.join("\n"));
      setAviso(null);
    }
  }, [abierto, skus]);

  const lista = React.useMemo(() => leerListaSkus(texto), [texto]);

  const cargarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setLeyendo(true);
    setAviso(null);
    try {
      const desdeArchivo = await leerSkusDeArchivo(archivo);
      if (!desdeArchivo.length) {
        setAviso("El archivo no tiene SKUs. Usa la plantilla: una columna SKU con un código por fila.");
        return;
      }
      // Se suman a lo que ya hay escrito; los repetidos se cuentan una vez.
      setTexto((t) => [t.trim(), ...desdeArchivo].filter(Boolean).join("\n"));
      setAviso(`Se leyeron ${desdeArchivo.length} filas de "${archivo.name}".`);
    } catch {
      setAviso("No se pudo leer el archivo. Debe ser un Excel (.xlsx, .xls) o un CSV.");
    } finally {
      setLeyendo(false);
    }
  };

  return (
    <Dialog open={abierto} onClose={onCerrar} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography sx={{ fontSize: 17, fontWeight: 750, color: tinta.primaria }}>SKUs a analizar</Typography>
        <Typography sx={{ fontSize: 12.5, color: tinta.secundaria }}>
          Escribe o pega hasta {MAX_SKUS} SKUs (uno por línea, o separados por coma), o cárgalos desde un Excel.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={1} sx={{ my: 1.5 }} useFlexGap flexWrap="wrap">
          <Button
            variant="outlined"
            size="small"
            startIcon={<IconFileSpreadsheet size={16} />}
            onClick={() => inputRef.current?.click()}
            sx={{ textTransform: "none", borderRadius: "10px", fontWeight: 600 }}
          >
            Cargar Excel
          </Button>
          <Button
            variant="text"
            size="small"
            startIcon={<IconDownload size={16} />}
            onClick={descargarPlantillaSkus}
            sx={{ textTransform: "none", borderRadius: "10px", fontWeight: 600 }}
          >
            Descargar plantilla
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="text"
            size="small"
            color="inherit"
            startIcon={<IconTrash size={16} />}
            onClick={() => setTexto("")}
            disabled={!texto}
            sx={{ textTransform: "none", borderRadius: "10px", color: tinta.secundaria }}
          >
            Vaciar
          </Button>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={cargarArchivo} />
        </Stack>

        {leyendo && <LinearProgress sx={{ mb: 1 }} />}
        {aviso && (
          <Alert severity="info" sx={{ mb: 1.5, py: 0 }} onClose={() => setAviso(null)}>
            {aviso}
          </Alert>
        )}

        <TextField
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          multiline
          minRows={8}
          maxRows={14}
          fullWidth
          autoFocus
          placeholder={"004042020\n555222274\n125003074"}
          inputProps={{ "aria-label": "SKUs", style: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13 } }}
        />

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} useFlexGap flexWrap="wrap" alignItems="center">
          <Chip size="small" color={lista.skus.length ? "primary" : "default"} label={`${lista.skus.length} de ${MAX_SKUS} SKUs`} />
          {lista.repetidos > 0 && <Chip size="small" variant="outlined" label={`${lista.repetidos} repetidos (se cuentan una vez)`} />}
        </Stack>
        {lista.sobrantes.length > 0 && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            Hay {lista.sobrantes.length} SKUs de más: se analizan los primeros {MAX_SKUS}. Quedan fuera: {lista.sobrantes.slice(0, 8).join(", ")}
            {lista.sobrantes.length > 8 ? "…" : ""}
          </Alert>
        )}
        {lista.invalidos.length > 0 && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {lista.invalidos.length} valores no tienen forma de SKU y se ignoran: {lista.invalidos.slice(0, 8).join(", ")}
            {lista.invalidos.length > 8 ? "…" : ""}
          </Alert>
        )}
        <Typography sx={{ fontSize: 11.5, color: tinta.tenue, mt: 1.5 }}>
          Si Excel le quitó los ceros a la izquierda a un código (por ejemplo 4042020 en vez de 004042020), el SKU aparecerá como no encontrado: da
          formato de Texto a la columna antes de escribirlos.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={!lista.skus.length}
          onClick={() => onAplicar(lista.skus)}
          sx={{ textTransform: "none", borderRadius: "10px", fontWeight: 600 }}
        >
          Analizar {lista.skus.length || ""} SKUs
        </Button>
      </DialogActions>
    </Dialog>
  );
}
