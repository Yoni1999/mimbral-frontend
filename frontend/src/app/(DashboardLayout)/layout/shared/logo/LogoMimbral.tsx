"use client";

import Link from "next/link";
import { styled } from "@mui/material";
import Image from "next/image";
import React from "react";

interface LogoProps {
  width?: number;
  height?: number;
}

const LinkStyled = styled(Link)(() => ({
  height: "auto",
  width: "auto",
  overflow: "hidden",
  display: "block",
}));

const LogoMimbral = ({ width = 150, height = 50 }: LogoProps) => {
  return (
    <LinkStyled href="/inicio">
      <Image
        src="/images/logos/logo.mimbral.svg"
        alt="Logo Mimbral"
        width={width}
        height={height}
        style={{
          objectFit: "contain",
          width: `${width}px`,
          height: "auto",
        }}
        priority
      />
    </LinkStyled>
  );
};

export default LogoMimbral;
