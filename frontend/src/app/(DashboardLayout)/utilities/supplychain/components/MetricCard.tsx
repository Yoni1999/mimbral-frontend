// components/MetricCard.tsx

import React from "react";
import { Paper, Typography, Box } from "@mui/material";

interface MetricCardProps {
  title: string;
  value: string;
  stockSubtitle?: string;
  versus?: string;
  anterior?: string;
  height?: number;
  align?: "left" | "center" | "right";
  borderColor?: string;
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  stockSubtitle,
  versus,
  anterior,
  height = 140,
  align = "center",
  borderColor,
  icon,
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
        justifyContent: "space-between",
        textAlign: align,
        border: borderColor ? `1px solid ${borderColor}` : undefined,
      }}
    >
      <Box>
        {icon && <Box mb={1}>{icon}</Box>}
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          {value}
        </Typography>
        {stockSubtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {stockSubtitle}
          </Typography>
        )}
      </Box>

      {(versus || anterior) && (
        <Box
          mt={1}
          display="flex"
          justifyContent="space-between"
          alignItems="flex-end"
        >
          <Typography variant="caption" color="text.secondary">
            {versus}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {anterior}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default MetricCard;
