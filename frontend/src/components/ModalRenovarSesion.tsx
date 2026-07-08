import { useState } from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CloseIcon from "@mui/icons-material/Close";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
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
  const [minimized, setMinimized] = useState(false);
  const [noti, setNoti] = useState({ open: false, success: false, msg: "" });

  const handleRenovar = async () => {
    if (password.trim() === "" || loading) return;

    setLoading(true);

    try {
      const exito = await onRenovar(password);
      setPassword("");

      setNoti({
        open: true,
        success: exito,
        msg: exito
          ? "Sesión renovada."
          : "Contraseña incorrecta. Intente de nuevamente.",
      });
    } catch {
      setNoti({
        open: true,
        success: false,
        msg: "Error al renovar la sesión.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleRenovar();
  };

  if (minimized) {
    return (
      <Box sx={styles.floatingLauncher}>
        <Button
          variant="contained"
          onClick={() => setMinimized(false)}
          startIcon={<OpenInFullRoundedIcon fontSize="small" />}
          sx={styles.launcherButton}
        >
          Renovar sesión
        </Button>
      </Box>
    );
  }

  return (
    <Modal open onClose={onCancelar}>
      <Box sx={styles.modalContainer}>
        <Box sx={styles.header}>
          <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <WarningAmberIcon sx={{ color: "#f57c00", fontSize: 28, mr: 1 }} />
            <Typography variant="h6" fontWeight={800} sx={styles.title}>
              Tu sesión está por vencer
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Button
              size="small"
              variant="text"
              onClick={() => setMinimized(true)}
              sx={styles.iconButton}
              title="Minimizar"
            >
              <RemoveRoundedIcon fontSize="small" />
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={onCancelar}
              sx={styles.iconButton}
              title="Cerrar"
            >
              <CloseIcon fontSize="small" />
            </Button>
          </Box>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="body2" sx={{ mb: 2, color: "#54627a" }}>
            Renueva por <strong>2 horas más</strong> ingresando tu contraseña.
          </Typography>

          <TextField
            type="password"
            fullWidth
            size="small"
            label="Contraseña"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoFocus
          />

          <Box sx={styles.actions}>
            <Button onClick={onCancelar} variant="outlined" disabled={loading}>
              No por ahora
            </Button>
            <Button
              type="submit"
              onClick={handleRenovar}
              variant="contained"
              disabled={loading || password.trim() === ""}
              startIcon={loading ? <CircularProgress size={18} /> : null}
              sx={styles.primaryButton}
            >
              {loading ? "Renovando..." : "Renovar sesión"}
            </Button>
          </Box>
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
    borderRadius: 3,
    boxShadow: 24,
    padding: 2.5,
    width: "calc(100% - 32px)",
    maxWidth: 420,
    mx: "auto",
    mt: "18vh",
    outline: "none",
  },
  floatingLauncher: {
    position: "fixed",
    left: 16,
    bottom: 16,
    zIndex: 1300,
  },
  launcherButton: {
    borderRadius: 999,
    textTransform: "none",
    fontWeight: 800,
    boxShadow: "0 10px 24px rgba(39, 70, 144, 0.25)",
    background: "linear-gradient(135deg, #3558c8 0%, #274690 100%)",
    px: 2.2,
    py: 1,
    gap: 0.75,
    "&:hover": {
      background: "linear-gradient(135deg, #3558c8 0%, #1f3876 100%)",
    },
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    mb: 1.5,
    gap: 1,
  },
  title: {
    lineHeight: 1.1,
    fontSize: "1.02rem",
  },
  iconButton: {
    minWidth: 0,
    p: 0.5,
    color: "#5f6d84",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 1,
    mt: 2.5,
  },
  primaryButton: {
    textTransform: "none",
    borderRadius: 2,
    fontWeight: 700,
    boxShadow: "none",
    "&:hover": {
      boxShadow: "none",
    },
  },
} as const;
