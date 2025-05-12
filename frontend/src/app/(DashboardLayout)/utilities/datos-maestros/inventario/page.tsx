"use client";

import { Box, Typography } from "@mui/material";

const EnConstruccionPage = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      textAlign="center"
      px={2}
    >
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Lo sentimos
      </Typography>
      <Typography variant="h6" color="text.secondary">
        Estamos trabajando en esta función.
      </Typography>
    </Box>
  );
};

export default EnConstruccionPage;
