import { useState } from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Box,
  Button,
  Typography,
  Modal,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";

interface Props {
  onRenovar: (password: string) => Promise<boolean>;
  onCancelar: () => void;
}

export function ModalRenovarSesion({ onRenovar, onCancelar }: Props) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [noti, setNoti] = useState({ open: false, success: false, msg: "" });

  const handleRenovar = async () => {
    if (password.trim() === "" || loading) return;

    setLoading(true);

    try {
      const exito = await onRenovar(password);
      setPassword("");

      if (exito) {
        setNoti({
          open: true,
          success: true,
          msg: "Sesión renovada.",
        });
      } else {
        setNoti({
          open: true,
          success: false,
          msg: "Contraseña incorrecta. Intente de nuevamente.",
        });
      }
    } catch (error) {
      setNoti({
        open: true,
        success: false,
        msg: "Error al renovar la sesión.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onCancelar}>
      <Box sx={styles.modalContainer}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <WarningAmberIcon sx={{ color: "#f57c00", fontSize: 32, mr: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            Tu sesión está por vencer
          </Typography>
        </Box>

        <Typography variant="body1" mb={2}>
          ¿Deseas renovarla ahora por <strong>2 horas más</strong>? Ingresa tu contraseña.
        </Typography>

        <TextField
          type="password"
          fullWidth
          size="small"
          label="Ingresa tu contraseña"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
          <Button
            onClick={handleRenovar}
            variant="contained"
            color="primary"
            disabled={loading || password.trim() === ""}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Renovando..." : "Renovar sesión"}
          </Button>
          <Button onClick={onCancelar} variant="outlined" disabled={loading}>
            No por ahora
          </Button>
        </Box>

        <Snackbar
          open={noti.open}
          autoHideDuration={3000}
          onClose={() => setNoti({ ...noti, open: false })}
        >
          <Alert
            onClose={() => setNoti({ ...noti, open: false })}
            severity={noti.success ? "success" : "error"}
            variant="filled"
          >
            {noti.msg}
          </Alert>
        </Snackbar>
      </Box>
    </Modal>
  );
}

const styles = {
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 2,
    boxShadow: 24,
    padding: 4,
    width: "100%",
    maxWidth: 400,
    mx: "auto",
    mt: "20vh",
    outline: "none",
  },
};
