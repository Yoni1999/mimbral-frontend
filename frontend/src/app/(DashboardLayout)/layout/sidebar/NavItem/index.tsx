import React from "react";
import {
  ListItemIcon,
  ListItem,
  List,
  styled,
  ListItemText,
  useTheme,
  ListItemButton,
  Collapse,
} from "@mui/material";
import Link from "next/link";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";

type NavGroup = {
  id?: string;
  title?: string;
  icon?: any;
  href?: string;
  subMenu?: NavGroup[];
  onClick?: React.MouseEvent<HTMLButtonElement, MouseEvent>;
};

interface ItemType {
  item: NavGroup;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  pathDirect: string;
  isOpen: boolean;
}

// NavItem.tsx
// NavItem.tsx
const NavItem = ({ item, pathDirect, onClick, isOpen }: ItemType) => {
  const theme = useTheme();

  const ListItemStyled = styled(ListItem)(() => ({
    padding: 0,
    ".MuiButtonBase-root": {
      whiteSpace: "nowrap",
      marginBottom: "2px",
      padding: "8px 10px",
      borderRadius: "8px",
      backgroundColor: "inherit",
      color: theme.palette.text.secondary,
      paddingLeft: "10px",
      "&:hover": {
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.main,
      },
      "&.Mui-selected": {
        color: "white",
        backgroundColor: theme.palette.primary.main,
        "&:hover": {
          backgroundColor: theme.palette.primary.main,
          color: "white",
        },
      },
    },
  }));


  console.log("isOpen for", item.title, isOpen);

  return (
    <>
      <List component="div" disablePadding key={item.id}>
        <ListItemStyled>
          {item.subMenu && item.subMenu.length > 0 ? (
            <ListItemButton onClick={onClick}>
              <ListItemIcon sx={{ minWidth: "36px", p: "3px 0", color: "inherit" }}>
                {item.icon && <item.icon size={18} />}
              </ListItemIcon>
              <ListItemText>{item.title}</ListItemText>
              {isOpen ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
            </ListItemButton>
          ) : (
            <ListItemButton component={Link} href={item.href || "#"} onClick={onClick}>
              <ListItemIcon sx={{ minWidth: "36px", p: "3px 0", color: "inherit" }}>
                {item.icon && <item.icon size={18} />}
              </ListItemIcon>
              <ListItemText>{item.title}</ListItemText>
            </ListItemButton>
          )}
        </ListItemStyled>
      </List>
      {item.subMenu && item.subMenu.length > 0 && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.subMenu.map((child) => (
              <ListItemButton key={child.id} component={Link} href={child.href || "#"} sx={{ pl: 4 }}>
                <ListItemIcon sx={{ minWidth: "36px", p: "3px 0", color: "inherit" }}>
                  {child.icon && <child.icon size={16} />}
                </ListItemIcon>
                <ListItemText>{child.title}</ListItemText>
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};
export default NavItem;

