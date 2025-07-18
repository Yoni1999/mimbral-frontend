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
        backgroundColor: "#FEFEFE",
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
