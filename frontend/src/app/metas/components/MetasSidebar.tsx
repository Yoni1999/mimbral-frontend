"use client";
import React, { useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  Divider,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MetasMenuitems from "./MetasMenuitems";
import MenuIcon from "@mui/icons-material/Menu"; // Ícono para el modo colapsado

interface MetasSidebarProps {
  expanded?: boolean;
}

const MetasSidebar = ({ expanded = false }: MetasSidebarProps) => {
  const [hovered, setHovered] = useState(false);
  const isHovered = expanded || hovered;
  const pathname = usePathname() ?? "";

  return (
    <Box
      sx={{
        width: isHovered ? 220 : 64,
        transition: "width 0.3s",
        backgroundColor: "#ffffff",
        height: "100%",
        overflowX: "hidden",
        borderRight: "1px solid #ddd",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 🔹 Sección superior */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: isHovered ? "center" : "center",
          height: 64,
        }}
      >
        {isHovered ? (
          <Typography variant="subtitle1" fontWeight="bold">
            Panel de Metas
          </Typography>
        ) : (
          <Tooltip title="Panel de Metas" placement="right">
            <ListItemIcon sx={{ minWidth: 0 }}>
              <MenuIcon />
            </ListItemIcon>
          </Tooltip>
        )}
      </Box>

      <Divider />

      {/* 🔹 Lista de menú */}
      <List>
        {MetasMenuitems.map((item) => (
          <ListItem
            key={item.id}
            sx={{
              display: "flex",
              alignItems: "center",
              py: 1,
              px: 2,
              backgroundColor: pathname === item.href ? "#e3f2fd" : "inherit",
              borderRadius: 1,
              mx: 1,
            }}
            disablePadding
          >
            <Link
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Tooltip title={!isHovered ? item.title : ""} placement="right">
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <item.icon fontSize="small" />
                </ListItemIcon>
              </Tooltip>
              {isHovered && <ListItemText primary={item.title} />}
            </Link>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default MetasSidebar;
