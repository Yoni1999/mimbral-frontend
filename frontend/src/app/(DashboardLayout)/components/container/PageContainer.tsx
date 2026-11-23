// import { Helmet } from 'react-helmet';
import { Box } from '@mui/material';
import { Helmet, HelmetProvider } from 'react-helmet-async';

type Props = {
  description?: string;
  children: JSX.Element | JSX.Element[];
  title?: string;
};

const PageContainer = ({ title, description, children }: Props) => (
  <HelmetProvider>
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
        // En celular el layout ya deja 12 px por lado: sumar otros 20 dejaba
        // el contenido angosto y con gris a los costados (p. ej. Galaxy A55).
        px: { xs: 0, sm: "20px" },
        // En celular "visible": con "hidden" este Box pasa a ser un contenedor
        // de scroll y la barra de período de las vistas (PeriodoMovil) dejaba
        // de quedar pegada arriba al bajar; además la recortaba de lado a lado.
        // Lo que se pase de ancho lo sigue recortando PageWrapper (layout.tsx).
        overflowX: { xs: "visible", sm: "hidden" },
        boxSizing: "border-box",
        // Transparente: este wrapper lo comparten 5 pantallas (inicio,
        // metas-general, typography, resumen-ventas, ventas-por-canal) y
        // pintaba blanco por encima del gris de PageWrapper (layout.tsx) en
        // todas ellas por igual.
        backgroundColor: "transparent",
      }}
    >
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Helmet>
      {children}
    </Box>
  </HelmetProvider>
);





export default PageContainer;
