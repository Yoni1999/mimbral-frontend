import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";
import { tinta } from "./estilo";

interface Props {
  title: string;
  icon?: ReactNode;
  infoRight?: string;
}

const SeccionTitulo: React.FC<Props> = ({ title, icon, infoRight }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 2,
      width: "100%",
      mt: 1.5,
      mb: 0.5,
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {icon && <Box sx={{ color: tinta.acento, display: "flex" }}>{icon}</Box>}
      <Typography sx={{ fontSize: 17, fontWeight: 750, color: tinta.primaria, letterSpacing: "-0.01em" }}>
        {title}
      </Typography>
    </Box>
    {infoRight && (
      <Typography sx={{ fontSize: 12.5, color: tinta.tenue, textAlign: "right" }}>{infoRight}</Typography>
    )}
  </Box>
);

export default SeccionTitulo;
