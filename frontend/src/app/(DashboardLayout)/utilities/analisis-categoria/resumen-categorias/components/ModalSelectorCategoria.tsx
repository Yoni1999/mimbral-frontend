"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
} from "@mui/material";

interface ModalSelectorCategoriaProps {
  open: boolean;
  onClose: () => void;
  categorias: { codigo: string; nombre: string; imagen?: string }[];
  onCategoriaSelect: (categoriaCode: string) => void;
}

const ModalSelectorCategoria: React.FC<ModalSelectorCategoriaProps> = ({
  open,
  onClose,
  categorias,
  onCategoriaSelect,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Selecciona una Categoría</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} mt={1}>
          {categorias.length > 0 ? (
            categorias.map((categoria) => (
              <Grid item xs={6} key={categoria.codigo}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => onCategoriaSelect(categoria.codigo)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    textTransform: "none",
                    padding: 1,
                  }}
                >
                  {categoria.imagen ? (
                    <img
                      src={categoria.imagen}
                      alt={categoria.nombre}
                      style={{
                        width: 32,
                        height: 32,
                        objectFit: "cover",
                        borderRadius: 8,
                        marginRight: 12,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: "#eee",
                        borderRadius: 8,
                        marginRight: 2,
                      }}
                    />
                  )}
                  <Typography variant="body2" noWrap>
                    {categoria.nombre}
                  </Typography>
                </Button>
              </Grid>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">
              Cargando categorías...
            </Typography>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error">
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalSelectorCategoria;
