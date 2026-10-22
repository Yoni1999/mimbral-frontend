"use client";
import { Box, Tabs, Tab } from "@mui/material";
import { useState } from "react";

interface CustomTabsProps {
  tabLabels: string[];
  tabContents: React.ReactNode[];
  /** Pestaña activa controlada desde fuera (p. ej. para recordarla). */
  value?: number;
  onChange?: (value: number) => void;
}

function a11yProps(index: number) {
  return {
    id: `custom-tab-${index}`,
    "aria-controls": `custom-tabpanel-${index}`,
  };
}

const CustomTabPanel = ({
  children,
  value,
  index,
}: {
  children?: React.ReactNode;
  value: number;
  index: number;
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`custom-tabpanel-${index}`}
      aria-labelledby={`custom-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
};

export default function CustomTabs({ tabLabels, tabContents, value: valueExterno, onChange }: CustomTabsProps) {
  const [valueInterno, setValue] = useState(0);
  // Una pestaña guardada fuera de rango (si cambian las pestañas) vuelve a la primera.
  const value = valueExterno !== undefined && valueExterno < tabLabels.length ? valueExterno : valueInterno;

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={value} onChange={handleChange} aria-label="custom tabs">
          {tabLabels.map((label, index) => (
            <Tab key={index} label={label} {...a11yProps(index)} />
          ))}
        </Tabs>
      </Box>
      {tabContents.map((content, index) => (
        <CustomTabPanel key={index} value={value} index={index}>
          {content}
        </CustomTabPanel>
      ))}
    </>
  );
}
