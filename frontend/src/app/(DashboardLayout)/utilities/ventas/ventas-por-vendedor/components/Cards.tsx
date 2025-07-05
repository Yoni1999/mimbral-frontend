import { Card, CardContent, Typography, Box, Paper } from "@mui/material"; // Added Paper
import { IconArrowUpRight, IconArrowDownRight } from "@tabler/icons-react";

const MetricCard = ({
  title,
  value,
  subtitle,
  percentageChange,
  icon,
  elevation = 1, // Default elevation to 1 for a subtle shadow
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  percentageChange?: number;
  icon?: React.ReactNode;
  elevation?: number;
}) => {
  const isNegative = percentageChange !== undefined && percentageChange < 0;

  return (
    <Paper
      elevation={elevation}
      variant="outlined" 
      sx={{
        borderRadius: 2,
        
        transition: "0.3s",
        "&:hover": {
          transform: "translateY(-3px)", // Subtle lift effect
          boxShadow: `0px ${elevation + 4}px ${elevation * 2 + 8}px rgba(0,0,0,0.08)`, 
        },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}> {/* Add padding and fix last-child padding */}
        {/* 🔹 Icon and Title */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          {icon && ( // Only render icon Box if an icon is provided
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "rgba(41, 98, 255, 0.1)", // Primary blue background
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "primary.main", // Primary blue icon color
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600} noWrap>
            {title}
          </Typography>
        </Box>

        {/* 🔹 Value and Percentage Change */}
        <Box display="flex" alignItems="baseline" justifyContent="space-between" mt={1}> {/* Align items to baseline for numbers, adjust margin top */}
          <Typography
            variant="h5" // Slightly smaller than h4, but still prominent
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "text.primary",
              lineHeight: 1, // Tighter line height for the main value
              mr: 1, // Margin right to separate from percentage change
            }}
          >
            {value}
          </Typography>

          {percentageChange !== undefined && (
            <Box
              px={0.8} // Reduced horizontal padding
              py={0.2} // Reduced vertical padding
              borderRadius="4px" // Slightly less rounded than 12 for a cleaner look
              bgcolor={isNegative ? "error.light" : "success.light"}
              color={isNegative ? "error.main" : "success.main"}
              fontSize="0.75rem" // Slightly smaller font size for percentage
              fontWeight="bold"
              display="flex"
              alignItems="center"
              flexShrink={0} // Prevents percentage from shrinking on smaller screens
            >
              {isNegative ? <IconArrowDownRight size={14} /> : <IconArrowUpRight size={14} />} {/* Smaller icon */}
              &nbsp;{Math.abs(percentageChange).toFixed(2)}%
            </Box>
          )}
        </Box>

        {/* 🔹 Subtitle (if available) */}
        {subtitle && (
          <Typography
            variant="caption" // Smaller variant for subtle subtitle
            sx={{
              color: "text.secondary",
              mt: 0.5, // Reduced top margin for a tighter grouping
              display: "block", // Ensures it takes its own line below the main value
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Paper>
  );
};

export default MetricCard;