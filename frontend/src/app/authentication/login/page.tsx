// "use client";
// import { Box, Card, Typography, useTheme, useMediaQuery } from "@mui/material";
// import AuthLogin from "../auth/AuthLogin";
// import LogoMimbral from "@/app/(DashboardLayout)/layout/shared/logo/LogoMimbral";
// import Header from "../components/Header";

// export default function LoginPage() {
//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

//   return (
//     <Box
//       sx={{
//         width: "100vw",
//         height: "100vh",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         backgroundImage: `url("/images/backgrounds/login-background.jpg")`,
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//         backgroundRepeat: "no-repeat",
//         position: "relative",
//         px: 2, // 🔹 espacio horizontal para celulares
//       }}
//     >
//       {/* 🔹 Header Fijo arriba */}
//       <Box
//         sx={{
//           width: "100%",
//           position: "absolute",
//           top: 0,
//           left: 0,
//           px: { xs: 2, sm: 4 },
//           py: 2,
//           display: "flex",
//           justifyContent: { xs: "center", sm: "flex-end" },
//           zIndex: 10,
//         }}
//       >
//         <Header />
//       </Box>

//       {/* 🔹 Card Login centrado */}
//       <Card
//         elevation={9}
//         sx={{
//           width: "100%",
//           maxWidth: 480,
//           minWidth: { xs: "100%", sm: 380 },
//           mx: "auto",
//           p: { xs: 3, sm: 4 },
//           borderRadius: 3,
//           backgroundColor: "rgba(255, 255, 255, 0.9)",
//           backdropFilter: "blur(5px)",
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           zIndex: 1,
//         }}
//       >
//         <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
//           <LogoMimbral width={isMobile ? 130 : 160} />
//         </Box>

//         <Typography
//           variant="subtitle1"
//           textAlign="center"
//           color="text.secondary"
//           mb={3}
//         >
//           Iniciar Sesión
//         </Typography>

//         <AuthLogin />
//       </Card>
//     </Box>
//   );
// }

"use client";
import {
  Box,
  Card,
  Typography,
  useTheme,
  useMediaQuery,
  Modal,
} from "@mui/material";
import AuthLogin from "../auth/AuthLogin";
import LogoMimbral from "@/app/(DashboardLayout)/layout/shared/logo/LogoMimbral";
import Header from "../components/Header";

export default function LoginPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url("/images/backgrounds/login-background.jpg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        px: 2,
      }}
    >
      {/* 🔹 Header Fijo arriba */}
      <Box
        sx={{
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          px: { xs: 2, sm: 4 },
          py: 2,
          display: "flex",
          justifyContent: { xs: "center", sm: "flex-end" },
          zIndex: 10,
        }}
      >
        <Header />
      </Box>

      {/* 🔹 Card Login centrado */}
      <Card
        elevation={9}
        sx={{
          width: "100%",
          maxWidth: 480,
          minWidth: { xs: "100%", sm: 380 },
          mx: "auto",
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(5px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
          <LogoMimbral width={isMobile ? 130 : 160} />
        </Box>

        <Typography
          variant="subtitle1"
          textAlign="center"
          color="text.secondary"
          mb={3}
        >
          Iniciar Sesión
        </Typography>

        <AuthLogin />
      </Card>

      🔹 Modal de mantenimiento
      {/* <Modal open={true}>
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            bgcolor: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            textAlign: "center",
            p: 3,
          }}
        >
          <Typography
            variant={isMobile ? "h5" : "h3"}
            color="white"
            fontWeight="bold"
            mb={2}
          >
            Lo sentimos página en mantención
          </Typography>
          <Typography variant={isMobile ? "body1" : "h5"} color="white">
            Lamentamos las molestias
          </Typography>
        </Box>
      </Modal> */}
    </Box>
  );
}

//