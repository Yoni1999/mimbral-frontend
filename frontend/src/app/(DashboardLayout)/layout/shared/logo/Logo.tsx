import Link from "next/link";
import { styled } from "@mui/material";
import Image from "next/image";

const LinkStyled = styled(Link)(() => ({
  height: "70px",
  width: "180px",
  overflow: "hidden",
  display: "block",
}));

const Logo = () => {
  return (
    <LinkStyled href="/">
      <Image src="/images/logos/logoitem.jpg" alt="logo" height={50} width={150}  style={{ objectFit: "contain", width: "100%", height: "auto" }} priority />
    </LinkStyled>
  );
};

export default Logo;
