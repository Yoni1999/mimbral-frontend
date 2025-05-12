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
        maxWidth: "clamp(320px, 95%, 1600px)", // mínimo 320px, ideal 95% del viewport, máximo 1600px
        margin: "0 auto",
        padding: "0 20px",
        overflowX: "hidden",
        boxSizing: "border-box",
        backgroundColor: "#f0f0f0"
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
