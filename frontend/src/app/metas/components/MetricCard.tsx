import { Card, CardContent, Typography, Box, Tooltip } from "@mui/material";
import { IconArrowUpRight, IconArrowDownRight } from "@tabler/icons-react";

const MetricCard = ({
  title,
  value,
  subtitle,
  percentageChange,
  icon,
  elevation = 0,
  tooltipMessage, // 🆕 nueva prop
}: any) => {
  const isNegative = percentageChange !== undefined && percentageChange < 0;

  return (
    <Card
      elevation={elevation}
      sx={{
        borderRadius: 2,
        border: "1px solid #e0e0e0",
        transition: "0.3s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: elevation < 1 ? elevation + 2 : elevation,
        },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "rgba(41, 98, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "primary.main",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
            {title}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "text.primary",
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>

          {percentageChange !== undefined && (
            <Tooltip title={tooltipMessage || ""} arrow>
              <Box
                px={1}
                py={0.3}
                ml={1}
                borderRadius={12}
                bgcolor={isNegative ? "error.light" : "success.light"}
                color={isNegative ? "error.main" : "success.main"}
                fontSize="0.8rem"
                fontWeight="bold"
                display="flex"
                alignItems="center"
                sx={{ cursor: tooltipMessage ? "help" : "default" }} // cursor si hay tooltip
              >
                {isNegative ? <IconArrowDownRight size={16} /> : <IconArrowUpRight size={16} />}
                &nbsp;{Math.abs(percentageChange).toFixed(2)}%
              </Box>
            </Tooltip>
          )}
        </Box>

        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontStyle: "italic",
              fontWeight: 400,
              mt: 1.5,
              pl: 0.5,
              fontSize: "0.85rem",
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
