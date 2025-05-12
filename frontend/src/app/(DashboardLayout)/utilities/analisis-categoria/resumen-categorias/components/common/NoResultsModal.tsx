"use client";
import React from "react";
import { Box, Typography, Modal, Fade, Backdrop } from "@mui/material";

interface Props {
  open: boolean;
  mensaje?: string;
  onClose?: () => void;
}

const NoResultsModal: React.FC<Props> = ({
  open,
  mensaje = "No se encontraron resultados para los filtros seleccionados.",
  onClose,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 300 }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            borderRadius: 3,
            boxShadow: 24,
            p: 4,
            textAlign: "center",
            minWidth: 320,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Sin Resultados
          </Typography>
          <Typography mt={1} color="text.secondary">
            {mensaje}
          </Typography>
        </Box>
      </Fade>
    </Modal>
  );
};

export default NoResultsModal;
