"use client";

import { Card, CardContent, Typography, Box, Stack } from "@mui/material";
import { IconArrowUpRight, IconArrowDownRight } from "@tabler/icons-react";

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  percentageChange?: number;
  icon?: React.ReactNode;
  small?: boolean;
}

const MetricCard = ({
  title,
  value,
  subtitle,
  percentageChange,
  icon,
  small = false,
}: Props) => {
  const isNegative = percentageChange !== undefined && percentageChange < 0;
  const isPositive = percentageChange !== undefined && percentageChange >= 0;
  const variationColor = isNegative ? "error.main" : "success.main";

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 2,
        background: "#ffffff",
        border: "1px solid #e0e0e0",
        transition: "0.3s",
        "&:hover": { transform: "translateY(-3px)", boxShadow: 4 },
        height: small ? "100px" : "auto",
      }}
    >
      <CardContent
        sx={{
          padding: small ? 1 : 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          {icon}
          <Typography
            variant="subtitle2"
            fontWeight={600}
            color="text.secondary"
            fontSize={small ? "0.8rem" : "0.95rem"}
          >
            {title}
          </Typography>
        </Stack>

        <Box mt={0.5} display="flex" alignItems="center">
          <Typography
            variant={small ? "h6" : "h5"}
            fontWeight={700}
            color="primary"
          >
            {value}
          </Typography>

          {percentageChange !== undefined && (
            <Box
              display="flex"
              alignItems="center"
              color={variationColor}
              ml={1}
              sx={{
                fontWeight: "bold",
                fontSize: small ? "0.75rem" : "0.9rem",
              }}
            >
              {isNegative ? (
                <IconArrowDownRight size={16} />
              ) : (
                <IconArrowUpRight size={16} />
              )}
              {Math.abs(percentageChange)}%
            </Box>
          )}
        </Box>

        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.5,
              fontSize: small ? "0.7rem" : "0.8rem",
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
