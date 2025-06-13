import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type Orden = {
  NumeroOrdenCompra: number;
  FechaOrden: string;
  ItemCode: string;
  DescripcionProducto: string;
  CantidadComprada: number;
  PrecioUnitario: number;
  TotalLinea: number;
  Vendedor: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  data: Orden[];
};

const agruparPorMes = (data: Orden[]) => {
  return data.reduce((acc: Record<string, Orden[]>, orden) => {
    const fecha = new Date(orden.FechaOrden);
    const mesAnio = fecha.toLocaleDateString("es-CL", {
      month: "long",
      year: "numeric",
    });
    if (!acc[mesAnio]) acc[mesAnio] = [];
    acc[mesAnio].push(orden);
    return acc;
  }, {});
};

const HistorialOrdenesCompraModal = ({ open, onClose, data }: Props) => {
  const datosAgrupados = agruparPorMes(data);
  const mesesOrdenados = Object.keys(datosAgrupados).sort((a, b) =>
    new Date(datosAgrupados[b][0].FechaOrden).getTime() -
    new Date(datosAgrupados[a][0].FechaOrden).getTime()
  );
// Función para parsear solo la parte de la fecha sin que JS la convierta a local
const parseFechaLocal = (fechaISO: string) => {
  const [year, month, day] = fechaISO.split("T")[0].split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
        Histórico de Órdenes de Compra (Últimos 12 meses)
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 0 }}>
        {data.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No hay datos disponibles</Typography>
        ) : (
          <Box>
            {mesesOrdenados.map((mes, idx) => (
              <Accordion
                key={idx}
                disableGutters
                elevation={0}
                defaultExpanded={idx === 0}
                sx={{
                  bgcolor: 'background.paper',
                  borderBottom: '1px solid #e0e0e0',
                  '&::before': { display: 'none' }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ px: 1, py: 1.5, bgcolor: '#f9f9f9' }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    {mes.charAt(0).toUpperCase() + mes.slice(1)}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#fafafa' }}>
                        <TableCell>N° OC</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="right">Cantidad</TableCell>
                        <TableCell align="right">Precio Unitario</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell>Vendedor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {datosAgrupados[mes].map((orden, i) => (
                        <TableRow
                          key={i}
                          hover
                          sx={{
                            '& td': { borderBottom: '1px solid #f0f0f0' },
                            '&:last-child td': { borderBottom: 'none' }
                          }}
                        >
                          <TableCell>{orden.NumeroOrdenCompra}</TableCell>
                          <TableCell>{parseFechaLocal(orden.FechaOrden).toLocaleDateString("es-CL")}</TableCell>
                          <TableCell>{orden.ItemCode}</TableCell>
                          <TableCell>{orden.DescripcionProducto}</TableCell>
                          <TableCell align="right">{orden.CantidadComprada.toLocaleString('es-CL')}</TableCell>
                          <TableCell align="right">${orden.PrecioUnitario.toLocaleString('es-CL')}</TableCell>
                          <TableCell align="right">${orden.TotalLinea.toLocaleString('es-CL')}</TableCell>
                          <TableCell>{orden.Vendedor}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ pr: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default HistorialOrdenesCompraModal;
