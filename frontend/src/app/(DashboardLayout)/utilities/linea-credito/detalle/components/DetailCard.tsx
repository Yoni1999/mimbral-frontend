// components/DetailCard.tsx

import React from "react";
import { Paper, Typography, Box } from "@mui/material";

interface DetailCardProps {
  title: string;
  details: Record<string, string>;
  height?: number;
  borderColor?: string;
}

const DetailCard: React.FC<DetailCardProps> = ({
  title,
  details,
  height = 300,
  borderColor = "#d0cfff", // ejemplo de borde violeta suave
}) => {
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        height,
        border: `2px solid ${borderColor}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: 1,
      }}
    >
      <Typography variant="h6" fontWeight={700} gutterBottom>
        {title}
      </Typography>

      {Object.entries(details).map(([label, value]) => (
        <Box key={label} display="flex" justifyContent="space-between">
          <Typography variant="body2" fontWeight={500} color="text.secondary">
            {label}:
          </Typography>
          <Typography variant="body2" color="text.primary">
            {value}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
};

export default DetailCard;
