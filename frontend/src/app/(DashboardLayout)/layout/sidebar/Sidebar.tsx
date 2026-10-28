"use client";
import { useMediaQuery, useTheme } from "@mui/material";
import RailSidebar from "./RailSidebar";
import MobileBottomNav from "./MobileBottomNav";

/**
 * Navegación principal, como en FrontOms: desde 600 px el rail de módulos a
 * la izquierda (ver RailSidebar); en celular, la barra de abajo (ver
 * MobileBottomNav).
 */
const MSidebar = () => {
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up("sm"));
  return smUp ? <RailSidebar /> : <MobileBottomNav />;
};

export default MSidebar;
