'use client';

import Link from "next/link";
import { styled } from "@mui/material";
import Image from "next/image";

const LinkStyled = styled(Link)(() => ({
  height: "70px",
  width: "180px",
  overflow: "hidden",
  display: "block",
}));

const LogoMimbral = () => {
  return (
    <LinkStyled href="/inicio">
      <Image 
        src="/images/logos/logo.mimbral.svg" 
        alt="Logo Mimbral" 
        height={50} 
        width={150}  
        style={{ objectFit: "contain", width: "100%", height: "auto" }} 
        priority 
      />
    </LinkStyled>
  );
};

export default LogoMimbral;
