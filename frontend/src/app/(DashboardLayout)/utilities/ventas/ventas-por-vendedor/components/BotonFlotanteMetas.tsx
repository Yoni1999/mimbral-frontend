"use client";
import { Box, Fab, Tooltip, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconFlag2 } from "@tabler/icons-react"; // 🔥 Importamos banderita

const BotonFlotanteMetas = () => {
  const router = useRouter();
  const [hover, setHover] = useState(false);

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 32,
        right: 32,
        zIndex: 999,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Tooltip title="Ver todas las metas" arrow>
        <Fab
          onClick={() => router.push("/ventas-vendedor/metas")}
          color="primary"
          sx={{
            width: hover ? 220 : 64,
            height: 64,
            borderRadius: 4,
            justifyContent: "flex-start",
            transition: "width 0.3s ease, background-color 0.3s",
            backgroundColor: hover ? "primary.main" : "primary.main",
            "&:hover": {
              backgroundColor: "primary.main",
            },
            px: 2,
            boxShadow: 6,
          }}
        >
          <IconFlag2 size={32} stroke={1.5} /> {/* Banderita aquí */}
          {hover && (
            <Typography
              variant="subtitle2"
              sx={{
                ml: 2,
                color: "white",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              Ver todas las metas
            </Typography>
          )}
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default BotonFlotanteMetas;
