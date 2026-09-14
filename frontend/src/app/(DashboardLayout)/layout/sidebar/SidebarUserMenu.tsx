"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Popover,
  Typography,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter } from "next/navigation";
import { clearStoredToken } from "@/utils/apiClient";
import { logoutIdService, obtenerImagenPerfil } from "@/modules/auth/services/idservice.client";
import { clearSession, getIdServiceSession } from "@/modules/auth/utils/auth.storage";
import type { IdServiceSession } from "@/modules/auth/types/auth.types";

/**
 * Badge de usuario al pie del sidebar: avatar + nombre (visible solo con el
 * riel expandido), clic abre un popover chico con quien es y "Cerrar sesion".
 * Reemplaza al dropdown que antes vivia arriba a la derecha del Header -Mi
 * Perfil y Configuraciones ahora son items normales del menu (MenuItems.tsx);
 * aca solo queda identidad + salir, igual que el pie del sidebar de FrontOms.
 */
export default function SidebarUserMenu({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  // Arranca en null tanto en el server como en el primer render del cliente:
  // localStorage no existe en el server, y leerlo directo en el cuerpo del
  // componente hace que el HTML de hidratacion no calce con el del cliente
  // (ver el mismo fix en Mi Perfil / auth.storage.ts).
  const [session, setSession] = useState<IdServiceSession | null>(null);

  const iniciales = (session?.nombre || session?.correo || "?").charAt(0).toUpperCase();

  const cargarAvatar = useCallback(async (activeSession: IdServiceSession | null) => {
    if (!activeSession) return;
    try {
      const data = await obtenerImagenPerfil(activeSession.usuarioId, activeSession.token);
      setAvatarUrl(data?.urlImagenPerfil || undefined);
    } catch (error) {
      console.error("No se pudo cargar la foto de perfil:", error);
    }
  }, []);

  useEffect(() => {
    const currentSession = getIdServiceSession();
    setSession(currentSession);
    cargarAvatar(currentSession);

    // Mi Perfil avisa por este evento apenas sube una foto nueva, para que
    // este badge se refresque sin recargar la pagina.
    const onImagenActualizada = () => cargarAvatar(getIdServiceSession());
    window.addEventListener("perfil:imagen-actualizada", onImagenActualizada);
    return () => window.removeEventListener("perfil:imagen-actualizada", onImagenActualizada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogoutClick = () => {
    setOpenDialog(true);
    handleClose();
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);

    const currentSession = getIdServiceSession();
    try {
      if (currentSession) {
        await logoutIdService(currentSession.usuarioId, currentSession.token);
      }
    } catch (error) {
      console.error("Error al invalidar la sesion en id-service:", error);
    }

    // Limpia la sesion nueva (token + claims + la cookie que lee middleware.ts)
    // y lo que quedaba de la sesion vieja, por si el navegador aun la tenia.
    clearSession();
    clearStoredToken();
    localStorage.removeItem("rol");
    sessionStorage.clear();
    setIsLoggingOut(false);
    setOpenDialog(false);
    router.push("/authentication/login");
  };

  if (!session) return null;

  const nombreCompleto = session.nombre || session.correo;

  return (
    <>
      <Box
        onClick={handleOpen}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: collapsed ? 0 : 1.5,
          py: 1,
          m: 1,
          borderRadius: 2,
          cursor: "pointer",
          justifyContent: collapsed ? "center" : "flex-start",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Avatar src={avatarUrl} sx={{ width: 34, height: 34, fontSize: "0.9rem", flexShrink: 0 }}>
          {!avatarUrl && iniciales}
        </Avatar>
        {!collapsed && (
          <Box minWidth={0}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {nombreCompleto}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {session.correo}
            </Typography>
          </Box>
        )}
      </Box>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: collapsed ? "right" : "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: collapsed ? "left" : "center" }}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 220, mt: -1 } }}
      >
        <Box sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
            <Avatar src={avatarUrl} sx={{ width: 36, height: 36 }}>
              {!avatarUrl && iniciales}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {nombreCompleto}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {session.correo}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            color="error"
            size="small"
            fullWidth
            startIcon={<LogoutIcon fontSize="small" />}
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
          >
            Cerrar sesión
          </Button>
        </Box>
      </Popover>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>¿Cerrar sesión?</DialogTitle>
        <DialogContent>
          <DialogContentText>¿Estás seguro de que deseas cerrar tu sesión?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancelar
          </Button>
          <LoadingButton onClick={handleConfirmLogout} color="primary" variant="contained" loading={isLoggingOut}>
            Cerrar sesión
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
