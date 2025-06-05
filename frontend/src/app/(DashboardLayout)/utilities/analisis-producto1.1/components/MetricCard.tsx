"use client";

import React from "react";
import { Box, Typography, Paper } from "@mui/material";

interface Props {
  icon: React.ReactNode;
  label: string;
  value: string;
  variation?: string;
  variationColor?: "success" | "error" | "warning" | "info" | "primary";
}

const MetricCard: React.FC<Props> = ({ icon, label, value, variation, variationColor = "primary" }) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 120,
        flex:1,
        minHeight: 90,
        borderRadius: 2,
      }}
    >
      <Box display="flex" alignItems="center" gap={0.5}>
        {icon}
        <Typography fontWeight={600} fontSize={13}>{label}</Typography>
      </Box>
      <Typography variant="h6" fontWeight={700}>{value}</Typography>
      {variation && (
        <Typography variant="caption" color={variationColor}>
          {variation}
        </Typography>
      )}
    </Paper>
  );
};

export default MetricCard;
