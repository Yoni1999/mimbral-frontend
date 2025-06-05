"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Menu,
  Button,
  IconButton,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import { IconUser, IconListCheck } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const rol = localStorage.getItem("rol");
    setIsAdmin(rol === "admin");
  }, []);

  const handleClick2 = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const handleLogoutClick = () => {
    setOpenDialog(true);
    handleClose2();
  };

  const handleConfirmLogout = async () => {
    const token = localStorage.getItem("token");
    setIsLoggingOut(true);

    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("❌ Error al invalidar token en backend:", error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    sessionStorage.clear();
    setIsLoggingOut(false);
    setOpenDialog(false);
    router.push("/authentication/login");
  };

  return (
    <Box>
      <IconButton
        size="large"
        color="inherit"
        onClick={handleClick2}
        sx={{
          ...(typeof anchorEl2 === "object" && {
            color: "primary.main",
          }),
        }}
      >
        <Avatar
          src="/images/profile/user-1.jpg"
          alt="image"
          sx={{ width: 35, height: 35 }}
        />
      </IconButton>

      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: "200px",
          },
        }}
      >
        <MenuItem>
          <ListItemIcon>
            <IconUser width={20} />
          </ListItemIcon>
          <ListItemText>Mi Perfil</ListItemText>
        </MenuItem>

        {isAdmin && (
          <>
            <MenuItem
              component="a"
              href="/admin/opciones"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ListItemIcon>
                <IconListCheck width={20} />
              </ListItemIcon>
              <ListItemText>Opciones Admin</ListItemText>
            </MenuItem>

            <MenuItem component="a" href="/metas">
              <ListItemIcon>
                <IconListCheck width={20} />
              </ListItemIcon>
              <ListItemText>Administrar Metas</ListItemText>
            </MenuItem>
          </>
        )}

        <Box mt={1} py={1} px={2}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleLogoutClick}
            fullWidth
            disabled={isLoggingOut}
          >
            Cerrar sesión
          </Button>
        </Box>
      </Menu>

      {/* Diálogo de confirmación */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>¿Cerrar sesión?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas cerrar tu sesión?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancelar
          </Button>
          <LoadingButton
            onClick={handleConfirmLogout}
            color="primary"
            variant="contained"
            loading={isLoggingOut}
          >
            Cerrar sesión
          </LoadingButton>
        </DialogActions>

      </Dialog>
    </Box>
  );
};

export default Profile;
