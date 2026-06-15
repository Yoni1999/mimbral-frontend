"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

export interface DateRangeValue {
  start: string;
  end: string;
}

interface DateRangeFilterProps {
  value: DateRangeValue | null;
  onChange: (value: DateRangeValue | null) => void;
  label?: string;
}

const DAYS_ES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function toDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetween(day: Date, start: Date, end: Date) {
  const time = day.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

function endOfWeek(date: Date): Date {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  return result;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + amount);
  return result;
}

function formatShort(date: Date | null): string {
  if (!date) return "";
  return `${date.getDate()} ${MONTHS_ES[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

function buildPresets(today: Date) {
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  const current = new Date(y, m, d);

  return [
    { label: "Hoy", range: [current, current] as const },
    { label: "Ayer", range: [new Date(y, m, d - 1), new Date(y, m, d - 1)] as const },
    { label: "Esta semana", range: [startOfWeek(current), endOfWeek(current)] as const },
    {
      label: "Semana pasada",
      range: [startOfWeek(new Date(y, m, d - 7)), endOfWeek(new Date(y, m, d - 7))] as const,
    },
    { label: "Este mes", range: [startOfMonth(current), endOfMonth(current)] as const },
    {
      label: "Mes pasado",
      range: [startOfMonth(new Date(y, m - 1, 1)), endOfMonth(new Date(y, m - 1, 1))] as const,
    },
    { label: "Últimos 7 días", range: [new Date(y, m, d - 6), current] as const },
    { label: "Últimos 30 días", range: [new Date(y, m, d - 29), current] as const },
    { label: "Este año", range: [new Date(y, 0, 1), new Date(y, 11, 31)] as const },
  ];
}

interface MonthGridProps {
  year: number;
  month: number;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  hoverDate: Date | null;
  onDateClick: (date: Date) => void;
  onDateHover: (date: Date | null) => void;
  today: Date;
}

function MonthGrid({
  year,
  month,
  rangeStart,
  rangeEnd,
  hoverDate,
  onDateClick,
  onDateHover,
  today,
}: MonthGridProps) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let offset = firstDay.getDay() - 1;
  if (offset < 0) offset = 6;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    cells.push(new Date(year, month, day));
  }

  const effectiveEnd = rangeStart && !rangeEnd && hoverDate ? hoverDate : rangeEnd;
  let visualStart = rangeStart;
  let visualEnd = effectiveEnd;

  if (visualStart && visualEnd && visualStart.getTime() > visualEnd.getTime()) {
    [visualStart, visualEnd] = [visualEnd, visualStart];
  }

  return (
    <Box sx={{ width: 250, flexShrink: 0 }}>
      <Typography
        sx={{
          mb: 1.5,
          textAlign: "center",
          fontSize: "0.86rem",
          fontWeight: 700,
          color: "#334155",
        }}
      >
        {MONTHS_ES[month]} {year}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0,
          width: "100%",
        }}
      >
        {DAYS_ES.map((day) => (
          <Box
            key={day}
            sx={{
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10.5,
              fontWeight: 700,
              color: "#94a3b8",
            }}
          >
            {day}
          </Box>
        ))}

        {cells.map((date, index) => {
          if (!date) {
            return <Box key={`empty-${index}`} sx={{ height: 32 }} />;
          }

          const isSelected = !!visualStart && !!visualEnd && isBetween(date, visualStart, visualEnd);
          const isStart = !!visualStart && isSameDay(date, visualStart);
          const isEnd = !!visualEnd && isSameDay(date, visualEnd);
          const isToday = isSameDay(date, today);

          return (
            <Box
              key={toDateStr(date)}
              component="button"
              type="button"
              onClick={() => onDateClick(date)}
              onMouseEnter={() => onDateHover(date)}
              onMouseLeave={() => onDateHover(null)}
              sx={{
                height: 32,
                minWidth: 0,
                p: 0,
                border: 0,
                boxSizing: "border-box",
                background: isSelected ? "#e8eefb" : "transparent",
                color: isSelected ? "#334155" : "#475569",
                borderRadius: isStart || isEnd ? "999px" : 2,
                cursor: "pointer",
                position: "relative",
                fontSize: 11.5,
                transition: "background-color 0.15s ease, color 0.15s ease",
                "&:hover": {
                  backgroundColor: isSelected ? "#dbe4fa" : "#f1f5f9",
                },
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  mx: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "999px",
                  backgroundColor: isStart || isEnd ? "#2f4b8f" : "transparent",
                  color: isStart || isEnd ? "#fff" : "inherit",
                  fontWeight: isStart || isEnd ? 700 : 500,
                  boxShadow: isStart || isEnd ? "0 10px 24px rgba(47, 75, 143, 0.28)" : "none",
                }}
              >
                {date.getDate()}
              </Box>
              {isToday && !isStart && !isEnd && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 3,
                    left: "50%",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    backgroundColor: "#3b82f6",
                    transform: "translateX(-50%)",
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function DateRangeFilter({
  value,
  onChange,
  label = "Rango de Fecha",
}: DateRangeFilterProps) {
  const today = useMemo(() => new Date(), []);
  const presets = useMemo(() => buildPresets(today), [today]);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [draftStart, setDraftStart] = useState<Date | null>(null);
  const [draftEnd, setDraftEnd] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today));

  useEffect(() => {
    if (!anchorEl) return;
    const start = value?.start ? parseDate(value.start) : null;
    const end = value?.end ? parseDate(value.end) : null;
    setDraftStart(start ?? today);
    setDraftEnd(end ?? today);
    setHoverDate(null);
    setViewMonth(start ? startOfMonth(start) : startOfMonth(today));
  }, [anchorEl, today, value]);

  const open = Boolean(anchorEl);
  const hasValue = !!(value?.start && value?.end);
  const rightMonth = addMonths(viewMonth, 1);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePreset = (start: Date, end: Date) => {
    setDraftStart(start);
    setDraftEnd(end);
    setViewMonth(startOfMonth(start));
  };

  const handleDateClick = (date: Date) => {
    if (!draftStart || draftEnd) {
      setDraftStart(date);
      setDraftEnd(null);
      return;
    }

    if (date.getTime() < draftStart.getTime()) {
      setDraftEnd(draftStart);
      setDraftStart(date);
      return;
    }

    setDraftEnd(date);
  };

  const handleApply = () => {
    if (!draftStart || !draftEnd) return;
    onChange({ start: toDateStr(draftStart), end: toDateStr(draftEnd) });
    handleClose();
  };

  const handleClear = (event: MouseEvent) => {
    event.stopPropagation();
    onChange(null);
    setAnchorEl(null);
  };

  const triggerText = hasValue
    ? `${formatShort(parseDate(value?.start ?? "") ?? null)} - ${formatShort(parseDate(value?.end ?? "") ?? null)}`
    : "Hoy";

  return (
    <>
      <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700, ml: 0.2, letterSpacing: 0.2 }}>
        {label}
      </Typography>

      <TextField
        fullWidth
        size="small"
        value={triggerText}
        onClick={handleOpen}
        placeholder="Hoy"
        InputProps={{
          readOnly: true,
          startAdornment: (
            <CalendarMonthOutlinedIcon
              fontSize="small"
              sx={{ color: "#64748b", mr: 1 }}
            />
          ),
          endAdornment: hasValue ? (
            <IconButton
              size="small"
              onClick={handleClear}
              edge="end"
              sx={{ color: "#94a3b8" }}
            >
              <CloseOutlinedIcon fontSize="small" />
            </IconButton>
          ) : null,
          sx: {
            height: 42,
            cursor: "pointer",
            bgcolor: "#fff",
            borderRadius: 1.75,
            "& .MuiInputBase-input": {
              cursor: "pointer",
              color: hasValue ? "#0f172a" : "#64748b",
            },
          },
        }}
        sx={{
          mt: 0.6,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#cbd5e1",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#94a3b8",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#2563eb",
          },
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 3,
            border: "1px solid rgba(148, 163, 184, 0.22)",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
            overflow: "hidden",
            width: { xs: "calc(100vw - 24px)", md: 860 },
            maxWidth: "calc(100vw - 16px)",
          },
        }}
      >
        <Box sx={{ display: "flex", backgroundColor: "#fff" }}>
          <Box
            sx={{
              width: 140,
              borderRight: "1px solid rgba(148, 163, 184, 0.18)",
              px: 1,
              py: 1.25,
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            <Typography
              sx={{
                mb: 0.5,
                fontSize: "0.68rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#94a3b8",
              }}
            >
              RANGOS RÁPIDOS
            </Typography>

            {presets.map((preset) => {
              const active =
                draftStart &&
                draftEnd &&
                isSameDay(draftStart, preset.range[0]) &&
                isSameDay(draftEnd, preset.range[1]);

              return (
                <Button
                  key={preset.label}
                  onClick={() => handlePreset(preset.range[0], preset.range[1])}
                  sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                  color: active ? "#2f4b8f" : "#475569",
                  fontWeight: active ? 700 : 500,
                  borderRadius: 999,
                  px: 0.9,
                  py: 0.45,
                  minHeight: 0,
                  minWidth: 0,
                  fontSize: "0.78rem",
                  lineHeight: 1.1,
                  backgroundColor: active ? "#e8eefb" : "transparent",
                  "&:hover": {
                    backgroundColor: active ? "#dbe4fa" : "#f1f5f9",
                  },
                }}
                >
                  {preset.label}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                pt: 1.25,
                pb: 0.75,
              }}
            >
              <IconButton
                onClick={() => setViewMonth((current) => addMonths(current, -1))}
                sx={{ color: "#64748b" }}
                size="small"
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <Box sx={{ width: 16 }} />
              <IconButton
                onClick={() => setViewMonth((current) => addMonths(current, 1))}
                sx={{ color: "#64748b" }}
                size="small"
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 3,
                px: 2,
                pb: 1.5,
                overflowX: "hidden",
                width: { xs: "100%", md: 684 },
                maxWidth: "100%",
              }}
            >
              <MonthGrid
                year={viewMonth.getFullYear()}
                month={viewMonth.getMonth()}
                rangeStart={draftStart}
                rangeEnd={draftEnd}
                hoverDate={hoverDate}
                onDateClick={handleDateClick}
                onDateHover={setHoverDate}
                today={today}
              />
              <MonthGrid
                year={rightMonth.getFullYear()}
                month={rightMonth.getMonth()}
                rangeStart={draftStart}
                rangeEnd={draftEnd}
                hoverDate={hoverDate}
                onDateClick={handleDateClick}
                onDateHover={setHoverDate}
                today={today}
              />
            </Box>

            <Divider />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 3, py: 1.5 }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    minWidth: 100,
                    px: 1.2,
                    py: 0.85,
                    borderRadius: 1.5,
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "#334155",
                    textAlign: "center",
                  }}
                >
                  {draftStart ? toDateStr(draftStart) : "yyyy-mm-dd"}
                </Box>
                <Typography sx={{ color: "#94a3b8" }}>-</Typography>
                <Box
                  sx={{
                    minWidth: 100,
                    px: 1.2,
                    py: 0.85,
                    borderRadius: 1.5,
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "#334155",
                    textAlign: "center",
                  }}
                >
                  {draftEnd ? toDateStr(draftEnd) : "yyyy-mm-dd"}
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.25} justifyContent="flex-end">
                <Button
                  onClick={handleClose}
                  variant="outlined"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 2.5,
                    borderColor: "#cbd5e1",
                    color: "#334155",
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleApply}
                  variant="contained"
                  disabled={!draftStart || !draftEnd}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 2.5,
                    bgcolor: "#2f4b8f",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#254073",
                      boxShadow: "none",
                    },
                  }}
                >
                  Aplicar
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Popover>
    </>
  );
}
