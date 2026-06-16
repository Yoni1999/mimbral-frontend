"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { IconSparkles, IconX, IconSend } from "@tabler/icons-react";
import { apiJson } from "@/utils/apiClient";
import { BACKEND_URL } from "@/config";

type AgentOption = {
  label: string;
  route: string;
};

type ChatMessage = {
  role: "user" | "agent";
  text: string;
  options?: AgentOption[];
};

type SkuQuery = {
  isSkuQuestion: boolean;
  periodo: string;
  periodoLabel: string;
  canal: string;
  canalLabel: string;
};

const FRONT_OPTIONS: AgentOption[] = [
  { label: "Resumen Ventas", route: "/utilities/ventas/resumen-ventas" },
  { label: "Ventas por Canal", route: "/utilities/ventas/ventas-por-canal" },
  { label: "Ventas por Vendedor", route: "/utilities/ventas/ventas-por-vendedor" },
  { label: "Analisis por Categoria", route: "/utilities/analisis-categoria/resumen-categorias" },
  { label: "Analisis por Producto", route: "/utilities/analisis-producto1.1" },
  { label: "Informe Ventas de Productos por Canal", route: "/informes/ventas-productos-por-canal" },
  { label: "Informe Ventas de Productos", route: "/informes/ventas-productos" },
  { label: "Informe Productos sin ventas", route: "/informes/productos-sin-ventas" },
  { label: "Informe Productos menos rentables", route: "/informes/productos-menos-rentables" },
  { label: "Informe Productos detenidos", route: "/informes/productos-detenidos" },
];

const picks = (labels: string[]) => FRONT_OPTIONS.filter((x) => labels.includes(x.label));

const PRODUCT_SEARCH_GUIDE = [
  {
    term: "sku",
    text: "Para buscar por SKU puedes ir a Resumen Ventas, Ventas por Canal, Analisis por Producto, Informe Ventas de Productos por Canal y los informes de productos.",
  },
  {
    term: "nombre",
    text: "Para buscar por nombre de producto, revisa el Informe Ventas de Productos por Canal y los informes de productos, donde el nombre del producto aparece junto al SKU.",
  },
  {
    term: "familia",
    text: "Para familia, revisa Resumen Ventas, Analisis por Categoria e Informe Ventas de Productos por Canal.",
  },
  {
    term: "subfamilia",
    text: "Para subfamilia, revisa Resumen Ventas, Analisis por Categoria e Informe Ventas de Productos por Canal.",
  },
  {
    term: "primer nivel",
    text: "Para primer nivel, revisa Resumen Ventas, Analisis por Categoria e Informe Ventas de Productos por Canal.",
  },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const resolvePeriodo = (query: string): { periodo: string; label: string } => {
  const q = normalize(query);
  if (q.includes("hoy") || q.includes("1d")) return { periodo: "1D", label: "Hoy" };
  if (q.includes("14") || q.includes("quince") || q.includes("ultimos 14") || q.includes("ultimas 2 semanas")) {
    return { periodo: "14D", label: "Ultimos 14 dias" };
  }
  if (q.includes("3 meses") || q.includes("3m") || q.includes("trimestre")) return { periodo: "3M", label: "Ultimos 3 meses" };
  if (q.includes("6 meses") || q.includes("6m") || q.includes("semestre")) return { periodo: "6M", label: "Ultimos 6 meses" };
  if (q.includes("mes") || q.includes("30 dias") || q.includes("1m")) return { periodo: "1M", label: "Ultimo mes" };
  return { periodo: "7D", label: "Ultimos 7 dias" };
};

const resolveCanal = (query: string): { canal: string; label: string } => {
  const q = normalize(query);
  if (q.includes("mercado libre") || q.includes("meli")) return { canal: "Meli", label: "Mercado Libre" };
  if (q.includes("falabella")) return { canal: "Falabella", label: "Falabella" };
  if (q.includes("vtex") || q.includes("vitex")) return { canal: "Vitex", label: "Vtex" };
  if (q.includes("chorrillo") || q.includes("chorrillos")) return { canal: "Chorrillo", label: "Chorrillos" };
  if (q.includes("balmaceda")) return { canal: "Balmaceda", label: "Balmaceda" };
  if (q.includes("empresa") || q.includes("empresas")) return { canal: "Empresas", label: "Empresas" };
  return { canal: "", label: "Todos los canales" };
};

const parseSkuQuery = (query: string): SkuQuery => {
  const q = normalize(query);
  const asksSku = q.includes("sku") || q.includes("producto") || q.includes("item");
  const asksTop =
    q.includes("mas vendido") ||
    q.includes("mas vendid") ||
    q.includes("top") ||
    q.includes("mayor venta") ||
    q.includes("numero 1");

  const isSkuQuestion = asksSku && asksTop;
  const { periodo, label: periodoLabel } = resolvePeriodo(query);
  const { canal, label: canalLabel } = resolveCanal(query);

  return { isSkuQuestion, periodo, periodoLabel, canal, canalLabel };
};

const getSuggestions = (query: string): { text: string; options: AgentOption[] } => {
  const q = normalize(query);

  if (q.includes("venta") || q.includes("vender") || q.includes("comercial")) {
    return {
      text: "Para ventas, te recomiendo estas vistas. Elige una opcion:",
      options: picks([
        "Resumen Ventas",
        "Ventas por Canal",
        "Ventas por Vendedor",
        "Informe Ventas de Productos",
      ]),
    };
  }

  if (q.includes("canal")) {
    return {
      text: "Para analizar por canal, estas vistas son las mas utiles:",
      options: picks(["Ventas por Canal", "Informe Ventas de Productos"]),
    };
  }

  if (q.includes("vendedor")) {
    return {
      text: "Para revisar desempeno de vendedores, te sugiero:",
      options: picks(["Ventas por Vendedor", "Resumen Ventas"]),
    };
  }

  if (q.includes("categoria")) {
    return {
      text: "Para categoria y mix comercial, puedes ir a:",
      options: picks(["Analisis por Categoria", "Resumen Ventas"]),
    };
  }

  if (q.includes("producto") || q.includes("sku")) {
    return {
      text: "Para analisis de producto, te recomiendo estas secciones:",
      options: picks([
        "Analisis por Producto",
        "Informe Ventas de Productos por Canal",
        "Informe Productos sin ventas",
        "Informe Productos menos rentables",
        "Informe Productos detenidos",
      ]),
    };
  }

  if (q.includes("familia") || q.includes("subfamilia") || q.includes("primer nivel")) {
    return {
      text:
        "Para familia, subfamilia o primer nivel puedes buscar en estas vistas:\n" +
        "• Resumen Ventas\n" +
        "• Analisis por Categoria\n" +
        "• Informe Ventas de Productos por Canal",
      options: picks([
        "Resumen Ventas",
        "Analisis por Categoria",
        "Informe Ventas de Productos por Canal",
      ]),
    };
  }

  if (q.includes("informe") || q.includes("reporte")) {
    return {
      text: "Estas son las vistas de informes disponibles. Elige una:",
      options: FRONT_OPTIONS.filter((x) => x.route.startsWith("/informes")),
    };
  }

  return {
    text:
      "Puedo ayudarte a navegar por ventas, canales, vendedores, categorias, productos e informes.\n" +
      "Tambien te puedo orientar por SKU, nombre, familia o subfamilia. Elige una opcion:",
    options: picks([
      "Resumen Ventas",
      "Ventas por Canal",
      "Ventas por Vendedor",
      "Analisis por Categoria",
      "Informe Ventas de Productos por Canal",
      "Informe Ventas de Productos",
    ]),
  };
};

const getField = (obj: any, keys: string[]) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
};

export default function FloatingHelpAgent() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const initialMessages = useMemo<ChatMessage[]>(
    () => [
      {
        role: "agent",
        text:
          "Hola, soy tu Agente de Ayuda. Dime que necesitas ver y te sugiero a que apartado del sitio ir.\n" +
          "Puedo orientarte por SKU, nombre, familia o subfamilia.",
        options: picks([
          "Resumen Ventas",
          "Ventas por Canal",
          "Ventas por Vendedor",
          "Analisis por Categoria",
          "Informe Ventas de Productos por Canal",
        ]),
      },
    ],
    []
  );

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const fetchTopSku = async (query: string): Promise<ChatMessage> => {
    const parsed = parseSkuQuery(query);
    const params = new URLSearchParams();
    params.append("periodo", parsed.periodo);
    if (parsed.canal) params.append("canal", parsed.canal);

    try {
      const response = await apiJson(`${BACKEND_URL}/api/top-productos?${params.toString()}`);
      if (!response) {
        return {
          role: "agent",
          text: "No pude consultar el servicio en este momento. Intenta nuevamente.",
          options: picks(["Ventas por Canal"]),
        };
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];

      if (!list.length) {
        return {
          role: "agent",
          text: `No encontre productos para ${parsed.canalLabel} en ${parsed.periodoLabel}.`,
          options: picks(["Ventas por Canal", "Informe Ventas de Productos"]),
        };
      }

      const first = list[0];
      const sku = getField(first, ["Codigo_Producto", "SKU", "Sku", "ItemCode", "itemCode"]) || "SKU no disponible";
      const nombre = getField(first, ["Nombre_Producto", "Descripcion", "nombre", "producto"]) || "Producto sin nombre";
      const cantidad = Number(getField(first, ["Cantidad_Vendida", "CantidadVendida", "cantidad_vendida", "Unidades"]) || 0);

      return {
        role: "agent",
        text:
          `El SKU mas vendido en ${parsed.periodoLabel}` +
          `${parsed.canal ? ` para ${parsed.canalLabel}` : ""} es:\n` +
          `SKU: ${sku}\n` +
          `Producto: ${nombre}\n` +
          `Unidades vendidas: ${cantidad.toLocaleString("es-CL")}.`,
        options: picks(["Ventas por Canal", "Informe Ventas de Productos", "Resumen Ventas"]),
      };
    } catch (error) {
      console.error("Error consultando top-productos desde agente:", error);
      return {
        role: "agent",
        text: "Ocurrio un error al consultar el SKU mas vendido. Puedes intentar con otro periodo o canal.",
        options: picks(["Ventas por Canal", "Informe Ventas de Productos"]),
      };
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");

    const parsed = parseSkuQuery(trimmed);
    const q = normalize(trimmed);

    const searchHelp = PRODUCT_SEARCH_GUIDE.find((item) => q.includes(item.term));
    if (searchHelp && !parsed.isSkuQuestion) {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: searchHelp.text,
          options: picks([
            "Resumen Ventas",
            "Ventas por Canal",
            "Ventas por Vendedor",
            "Analisis por Categoria",
            "Informe Ventas de Productos por Canal",
          ]),
        },
      ]);
      return;
    }

    if (parsed.isSkuQuestion) {
      setIsThinking(true);
      const responseMsg = await fetchTopSku(trimmed);
      setMessages((prev) => [...prev, responseMsg]);
      setIsThinking(false);
      return;
    }

    const suggestion = getSuggestions(trimmed);
    setMessages((prev) => [
      ...prev,
      { role: "agent", text: suggestion.text, options: suggestion.options },
    ]);
  };

  const goToRoute = (option: AgentOption) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: `Ir a ${option.label}` },
      { role: "agent", text: `Perfecto, te llevo a ${option.label}.` },
    ]);
    router.push(option.route);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 1400,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 1,
      }}
    >
      {isOpen && (
        <Paper
          elevation={8}
          sx={{
            width: { xs: "calc(100vw - 32px)", sm: 380 },
            maxWidth: 380,
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid rgba(30, 41, 59, 0.12)",
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 1,
              background: "linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Agente de Ayuda
            </Typography>
            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: "#fff" }}>
              <IconX size={16} />
            </IconButton>
          </Box>

          <Box sx={{ p: 1.25, height: 300, overflowY: "auto", bgcolor: "#f8fafc" }}>
            {messages.map((msg, index) => (
              <Box
                key={`${msg.role}-${index}`}
                sx={{
                  mb: 1,
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Box
                  sx={{
                    px: 1.2,
                    py: 0.8,
                    borderRadius: 2,
                    maxWidth: "90%",
                    fontSize: "0.82rem",
                    whiteSpace: "pre-line",
                    bgcolor: msg.role === "user" ? "#dbeafe" : "#ffffff",
                    color: "#0f172a",
                    border: "1px solid rgba(148, 163, 184, 0.25)",
                  }}
                >
                  {msg.text}
                  {msg.role === "agent" && msg.options && msg.options.length > 0 && (
                    <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      {msg.options.map((option) => (
                        <Button
                          key={option.route}
                          size="small"
                          variant="outlined"
                          onClick={() => goToRoute(option)}
                          sx={{
                            textTransform: "none",
                            fontSize: "0.72rem",
                            borderRadius: 999,
                            px: 1,
                            py: 0.25,
                          }}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            ))}

            {isThinking && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 0.5, py: 0.5 }}>
                <CircularProgress size={14} />
                <Typography variant="caption" color="text.secondary">
                  Consultando datos...
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ p: 1, display: "flex", gap: 1, borderTop: "1px solid rgba(15, 23, 42, 0.08)" }}>
            <TextField
              size="small"
              placeholder="Ej: SKU mas vendido en ultimos 7 dias canal Meli"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={() => void sendMessage()}
              disabled={isThinking}
              sx={{ minWidth: 44, px: 1.2 }}
            >
              <IconSend size={16} />
            </Button>
          </Box>
        </Paper>
      )}

      <Button
        variant="contained"
        onClick={() => setIsOpen((prev) => !prev)}
        startIcon={<IconSparkles size={18} />}
        sx={{
          borderRadius: 999,
          px: 2,
          py: 1,
          textTransform: "none",
          fontWeight: 700,
          boxShadow: "0 10px 24px rgba(37, 99, 235, 0.35)",
        }}
      >
        Agente
      </Button>
    </Box>
  );
}

