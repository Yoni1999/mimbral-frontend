"use client";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

interface Props {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  onCancelar: () => void;
  onConfirmar: () => void;
  destructivo?: boolean;
  confirmando?: boolean;
}

/** Único uso permitido de modal en este módulo: confirmaciones simples
 *  (eliminar, cancelar, cerrar) — ver prompt sección "Regla de UX: no usar
 *  modales para crear ni editar". Todo lo demás va en su propia página. */
export default function ConfirmarAccionModal({ abierto, titulo, descripcion, onCancelar, onConfirmar, destructivo, confirmando }: Props) {
  return (
    <Dialog open={abierto} onClose={onCancelar} maxWidth="xs" fullWidth>
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText>{descripcion}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelar} disabled={confirmando}>Cancelar</Button>
        <Button onClick={onConfirmar} color={destructivo ? "error" : "primary"} variant="contained" disabled={confirmando} autoFocus>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
