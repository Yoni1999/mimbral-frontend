// import { Helmet } from 'react-helmet';
import { Helmet, HelmetProvider } from 'react-helmet-async';

type Props = {
  description?: string;
  children: JSX.Element | JSX.Element[];
  title?: string;
};

const PageContainer = ({ title, description, children }: Props) => (
  <HelmetProvider>
    <div
      style={{
        width: "100%",
        maxWidth: "100%", 
        margin: "0 auto",
        padding: "0 20px",
        overflowX: "hidden",
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
    </div>
  </HelmetProvider>
);





export default PageContainer;
