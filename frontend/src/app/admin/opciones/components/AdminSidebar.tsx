"use client";
import React, { useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import Link from "next/link";
import AdminMenuitems from "./AdminMenuitems";

const AdminSidebar = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      sx={{
        width: isHovered ? 250 : 70,
        transition: "width 0.5s",
        backgroundColor: "#ffffff",
        height: "100vh",
        overflow: "hidden",
        borderRight: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 🔝 Logo fijo arriba */}
      <Box
        sx={{
          py: 2,
          px: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Link href="/admin">
          <img
            src="/images/logos/logo.mimbral.svg"
            alt="Logo Mimbral"
            style={{
              width: isHovered ? 160 : 40,
              height: "auto",
              transition: "width 0.3s",
              cursor: "pointer",
            }}
          />
        </Link>
      </Box>

      {/* 🧩 Menú navegable */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <List>
          {AdminMenuitems.map((item, index) =>
            item.navlabel ? (
              isHovered && (
                <ListItem key={index} sx={{ fontWeight: "bold", mt: 2 }}>
                  {item.subheader}
                </ListItem>
              )
            ) : item.href ? (
              <ListItem
                key={item.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 1,
                  px: 2,
                  mx: 1,
                  borderRadius: 1,
                  "&:hover": {
                    backgroundColor: "#f0f0f0",
                  },
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
                      <item.icon size={20} />
                    </ListItemIcon>
                  </Tooltip>
                  {isHovered && <ListItemText primary={item.title} />}
                </Link>
              </ListItem>
            ) : null
          )}
        </List>
      </Box>
    </Box>
  );
};

export default AdminSidebar;
