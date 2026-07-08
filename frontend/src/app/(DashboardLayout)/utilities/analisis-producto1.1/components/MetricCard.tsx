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
        p: { xs: 1, md: 1.5 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: { xs: 104, md: 120 },
        flex:1,
        minHeight: { xs: 72, md: 90 },
        borderRadius: 2,
      }}
    >
      <Box display="flex" alignItems="center" gap={0.5}>
        {icon}
        <Typography fontWeight={600} sx={{ fontSize: { xs: 12, md: 13 } }}>{label}</Typography>
      </Box>
      <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: "0.9rem", md: "1rem" } }}>{value}</Typography>
      {variation && (
        <Typography variant="caption" color={variationColor}>
          {variation}
        </Typography>
      )}
    </Paper>
  );
};

export default MetricCard;
