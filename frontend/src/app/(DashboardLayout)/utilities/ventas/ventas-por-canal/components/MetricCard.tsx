"use client";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { IconArrowUpRight, IconArrowDownRight } from "@tabler/icons-react";

const MetricCard = ({ title, value, subtitle, percentageChange, small = false }: any) => {
  const isNegative = percentageChange !== undefined && percentageChange < 0;

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 2,
        background: "#ffffff",
        border: "1px solid #e0e0e0",
        transition: "0.3s",
        "&:hover": { transform: "translateY(-3px)", boxShadow: 4 },
        height: small ? "80px" : "auto", 
      }}
    >
      <CardContent sx={{ padding: small ? "8px" : "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Typography variant="subtitle1" fontWeight="bold" color="text.secondary" sx={{ fontSize: small ? "0.8rem" : "1rem" }}>
          {title}
        </Typography>

        <Box display="flex" alignItems="center">
          <Typography variant={small ? "h6" : "h4"} fontWeight="bold" color="primary">
            {value}
          </Typography>

          {percentageChange !== undefined && (
            <Box
              display="flex"
              alignItems="center"
              color={isNegative ? "error.main" : "success.main"}
              ml={1}
              sx={{ fontWeight: "bold", fontSize: small ? "0.8rem" : "1rem" }}
            >
              {isNegative ? <IconArrowDownRight size={16} /> : <IconArrowUpRight size={16} />}
              {Math.abs(percentageChange)}%
            </Box>
          )}
        </Box>

        {subtitle && (
          <Typography variant="caption" color="textSecondary" sx={{ display: "block", mt: 1, fontSize: small ? "0.7rem" : "0.8rem" }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
