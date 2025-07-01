// components/MetricCard.tsx

import React from "react";
import { Paper, Typography, Box } from "@mui/material";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  height?: number;
  align?: "left" | "center" | "right";
  borderColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  height = 150,
  align = "left",
  borderColor,
}) => {
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        textAlign: align,
        border: borderColor ? `1px solid ${borderColor}` : undefined,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h6" fontWeight={700}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};

export default MetricCard;
