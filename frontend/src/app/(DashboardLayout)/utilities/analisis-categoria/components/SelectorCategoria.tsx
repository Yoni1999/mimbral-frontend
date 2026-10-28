"use client";

import React from "react";
import { Box, Button, Dialog, IconButton, InputAdornment, Skeleton, TextField, Typography } from "@mui/material";
import { IconCategory, IconCheck, IconChevronDown, IconChevronRight, IconSearch, IconX } from "@tabler/icons-react";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import { controlSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { ARBOLES, Arbol, CATALOGOS, Paso } from "../niveles";
import type { ArbolVista, OpcionCategoria } from "./HeaderCategorias";

interface Props {
  arbol: ArbolVista;
  ruta: Paso[];
  /** Texto del botón cuando se mira el árbol de Mercado Libre. */
  textoMl?: string;
  catalogos: Record<Arbol, OpcionCategoria[]>;
  cargando: Record<Arbol, boolean>;
  onElegir: (arbol: ArbolVista, ruta: Paso[]) => void;
}

type Opcion = Paso & { imagen?: string; padre?: string };

/** Miniatura de la categoría; sin imagen, la inicial. */
function Miniatura({ src, texto }: { src?: string; texto: string }) {
  const [rota, setRota] = React.useState(false);
  return (
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: "7px",
        border: `1px solid ${tinta.borde}`,
        bgcolor: "#fff",
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        fontSize: 11,
        fontWeight: 700,
        color: tinta.tenue,
      }}
    >
      {src && !rota ? (
        <Box component="img" src={src} alt="" onError={() => setRota(true)} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
      ) : (
        texto.charAt(0)
      )}
    </Box>
  );
}

/** Fila de una columna: al pulsarla se marca y abre la columna siguiente; con
 *  doble clic se elige directo. */
function Fila({
  texto,
  imagen,
  detalle,
  marcada,
  conHijos,
  destacada = false,
  onClick,
  onDobleClick,
}: {
  texto: string;
  imagen?: string | null;
  detalle?: string;
  marcada: boolean;
  conHijos: boolean;
  /** Fila "Todo …": se ve distinta de las demás. */
  destacada?: boolean;
  onClick: () => void;
  onDobleClick: () => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      onDoubleClick={onDobleClick}
      aria-pressed={marcada}
      title={texto}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 1,
        border: 0,
        borderRadius: "8px",
        px: 1,
        py: 0.6,
        mb: 0.25,
        fontFamily: "inherit",
        fontSize: 13,
        textAlign: "left",
        cursor: "pointer",
        bgcolor: marcada ? "#eff4ff" : "transparent",
        color: marcada ? tinta.acento : destacada ? tinta.secundaria : tinta.primaria,
        fontWeight: marcada ? 700 : destacada ? 600 : 500,
        fontStyle: destacada ? "italic" : "normal",
        "&:hover": { bgcolor: marcada ? "#eff4ff" : tinta.fondoSuave },
        "&:focus-visible": { outline: `2px solid ${tinta.acento}`, outlineOffset: -2 },
      }}
    >
      {imagen !== null && <Miniatura src={imagen} texto={texto} />}
      <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {texto}
      </Box>
      {detalle && (
        <Box component="span" sx={{ fontSize: 11, color: tinta.tenue, fontWeight: 500, fontStyle: "normal", flexShrink: 0 }}>
          {detalle}
        </Box>
      )}
      {marcada && !conHijos && <IconCheck size={15} style={{ flexShrink: 0 }} />}
      {conHijos && <IconChevronRight size={14} style={{ flexShrink: 0, opacity: marcada ? 1 : 0.35 }} />}
    </Box>
  );
}

function Columna({ titulo, children, vacio }: { titulo: string; children?: React.ReactNode; vacio?: string }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${tinta.borde}`,
        "&:last-of-type": { borderRight: 0 },
      }}
    >
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: tinta.tenue, textTransform: "uppercase", letterSpacing: "0.06em", px: 2, pt: 1.5, pb: 0.75 }}>
        {titulo}
      </Typography>
      <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 1 }}>
        {children ?? (
          <Box sx={{ height: "100%", display: "grid", placeItems: "center", px: 2 }}>
            <Typography sx={{ fontSize: 12.5, color: tinta.tenue, textAlign: "center" }}>{vacio}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

/** Texto con la parte buscada en negrita. */
function Resaltado({ texto, busqueda }: { texto: string; busqueda: string }) {
  const i = texto.toLowerCase().indexOf(busqueda);
  if (!busqueda || i < 0) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, i)}
      <Box component="mark" sx={{ bgcolor: "#fef3c7", color: "inherit", borderRadius: "3px", px: 0.25 }}>
        {texto.slice(i, i + busqueda.length)}
      </Box>
      {texto.slice(i + busqueda.length)}
    </>
  );
}

/** Elegir qué mirar, de lo general a lo particular. Tres árboles en pestañas:
 *  Categorías (primer nivel → categoría → subcategoría) y Familias (familia →
 *  subfamilia), cada uno en columnas en cascada, y un buscador para saltar a
 *  cualquiera por nombre; y Mercado Libre, que se recorre desde el desglose
 *  de la vista. Se elige con "Seleccionar", con Enter o con doble clic. */
export default function SelectorCategoria({ arbol, ruta, textoMl, catalogos, cargando: cargandoArbol, onElegir }: Props) {
  const [abierto, setAbierto] = React.useState(false);
  const [pestana, setPestana] = React.useState<ArbolVista>(arbol);
  const [borrador, setBorrador] = React.useState<Paso[]>([]);
  const [busqueda, setBusqueda] = React.useState("");

  const abrir = () => {
    setPestana(arbol);
    setBorrador(ruta);
    setBusqueda("");
    setAbierto(true);
  };
  const cambiarPestana = (nueva: ArbolVista) => {
    if (nueva === pestana) return;
    setPestana(nueva);
    // Al volver al árbol que se está mirando, aparece marcado lo elegido.
    setBorrador(nueva === arbol ? ruta : []);
  };
  const elegir = (nueva: Paso[]) => {
    onElegir(pestana, nueva);
    setAbierto(false);
  };

  const enMl = pestana === "mercadolibre";
  // Mercado Libre no usa catálogo ni columnas: se toma el de categorías para
  // que lo demás no cambie (no se muestra).
  const arbolSap: Arbol = pestana === "mercadolibre" ? "categorias" : pestana;
  const enFamilias = arbolSap === "familias";
  const catalogo = catalogos[arbolSap];
  const cargando = cargandoArbol[arbolSap];
  const niveles = ARBOLES[arbolSap].niveles;

  const n1 = borrador.find((p) => p.nivel === 1);
  const n2 = borrador.find((p) => p.nivel === 2);
  const n3 = borrador.find((p) => p.nivel === 3);

  const primeros = catalogo.filter((o) => o.nivel === 1);
  // Hijos de un primer nivel: las categorías se enlazan por nombre de su
  // primer nivel; las subfamilias, por código de su familia.
  const segundosDe = (o: Paso) =>
    catalogo.filter((x) => x.nivel === 2 && (enFamilias ? x.padreCodigo === o.codigo : x.padre === o.nombre));
  const categorias = n1 ? segundosDe(n1) : [];

  const urlSub = abierto && !enMl && !enFamilias && n2 ? `${BACKEND_URL}${CATALOGOS[3]}?categoria=${encodeURIComponent(n2.codigo)}` : null;
  const { datos: subcategorias, cargando: cargandoSub } = useCargaDatos<Opcion[]>(
    urlSub,
    async (signal) => {
      const json = await apiJson(urlSub!, { signal });
      return (Array.isArray(json) ? json : []).map((o: any) => ({
        nivel: 3 as const,
        codigo: String(o.codigo),
        nombre: o.nombre || String(o.codigo),
        imagen: o.imagen || undefined,
      }));
    },
    []
  );

  const paso = (o: Opcion): Paso => ({ nivel: o.nivel, codigo: o.codigo, nombre: o.nombre });

  // Búsqueda: un resultado de categoría trae su primer nivel; uno de
  // subcategoría entra solo (el catálogo no dice de qué categoría es).
  const q = busqueda.trim().toLowerCase();
  const resultados = q ? catalogo.filter((o) => o.nombre.toLowerCase().includes(q) || o.codigo === q).slice(0, 80) : [];
  const rutaDe = (o: OpcionCategoria): Paso[] => {
    if (o.nivel === 2) {
      const padre = primeros.find((p) => (enFamilias ? p.codigo === o.padreCodigo : p.nombre === o.padre));
      return padre ? [paso(padre), paso(o)] : [paso(o)];
    }
    return [paso(o)];
  };

  const todas = (a: ArbolVista) => (a === "familias" ? "Todas las familias" : a === "mercadolibre" ? "Todo Mercado Libre" : "Todas las categorías");
  const textoBoton =
    arbol === "mercadolibre" ? textoMl || "Categorías de Mercado Libre" : ruta.length ? ruta.map((p) => p.nombre || p.codigo).join(" › ") : todas(arbol);
  const sinCambios =
    pestana === arbol &&
    borrador.length === ruta.length &&
    borrador.every((p, i) => p.codigo === ruta[i]?.codigo && p.nivel === ruta[i]?.nivel);

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        title={textoBoton}
        sx={{
          ...controlSx,
          display: "flex",
          alignItems: "center",
          gap: 1,
          minWidth: 240,
          maxWidth: 340,
          px: 1.25,
          border: `1px solid ${abierto ? tinta.acento : tinta.borde}`,
          color: tinta.primaria,
          fontFamily: "inherit",
          cursor: "pointer",
          "&:hover": { borderColor: "#cbd5e1" },
        }}
      >
        <IconCategory size={16} color={tinta.secundaria} style={{ flexShrink: 0 }} />
        <Box component="span" sx={{ flex: 1, minWidth: 0, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {textoBoton}
        </Box>
        <IconChevronDown size={16} color={tinta.tenue} style={{ flexShrink: 0 }} />
      </Box>

      <Dialog
        open={abierto}
        onClose={() => setAbierto(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}
        // Enter elige lo marcado (o el primer resultado de la búsqueda).
        onKeyDown={(e) => {
          if (e.key !== "Enter" || (e.target as HTMLElement).tagName === "BUTTON") return;
          if (enMl) return;
          e.preventDefault();
          if (q) {
            if (resultados[0]) elegir(rutaDe(resultados[0]));
          } else if (borrador.length) elegir(borrador);
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, px: 2.5, pt: 2.25, pb: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 750, color: tinta.primaria }}>Elegir qué analizar</Typography>
            <Typography sx={{ fontSize: 12.5, color: tinta.secundaria }}>
              De lo general a lo particular. Doble clic o Enter para seleccionar.
            </Typography>
          </Box>
          <IconButton aria-label="Cerrar" onClick={() => setAbierto(false)} size="small">
            <IconX size={18} />
          </IconButton>
        </Box>

        <Box sx={{ px: 2.5, pb: 1.5, borderBottom: `1px solid ${tinta.borde}` }}>
          {/* Árbol: categorías o familias. */}
          <Box role="tablist" aria-label="Agrupar por" sx={{ display: "inline-flex", p: 0.5, mb: 1.5, borderRadius: "12px", bgcolor: "#f1f5f9", gap: 0.5 }}>
            {(["categorias", "familias", "mercadolibre"] as const).map((a) => {
              const activa = pestana === a;
              return (
                <Box
                  key={a}
                  component="button"
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  onClick={() => cambiarPestana(a)}
                  sx={{
                    border: 0,
                    borderRadius: "9px",
                    px: 2.25,
                    py: 0.75,
                    fontFamily: "inherit",
                    fontSize: 13.5,
                    fontWeight: activa ? 700 : 600,
                    cursor: "pointer",
                    bgcolor: activa ? "#fff" : "transparent",
                    color: activa ? tinta.primaria : tinta.secundaria,
                    boxShadow: activa ? "0 1px 3px rgba(15, 23, 42, 0.12)" : "none",
                    transition: "all 120ms ease",
                  }}
                >
                  {a === "mercadolibre" ? "Mercado Libre" : ARBOLES[a].etiqueta}
                  <Box component="span" sx={{ ml: 0.75, fontSize: 11.5, fontWeight: 500, color: tinta.tenue, display: { xs: "none", md: "inline" } }}>
                    {a === "familias" ? "Familia › Subfamilia" : a === "mercadolibre" ? "Árbol de ML · Full, Colecta y Flex" : "Primer nivel › Categoría › Subcategoría"}
                  </Box>
                </Box>
              );
            })}
          </Box>
          {!enMl && (
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder={enFamilias ? "Buscar familia o subfamilia" : "Buscar primer nivel, categoría o subcategoría"}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={15} color={tinta.tenue} />
                </InputAdornment>
              ),
              endAdornment: busqueda ? (
                <IconButton size="small" aria-label="Borrar búsqueda" onClick={() => setBusqueda("")}>
                  <IconX size={15} />
                </IconButton>
              ) : null,
            }}
            sx={{ "& .MuiOutlinedInput-root": controlSx }}
          />
          )}
        </Box>

        {enMl ? (
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: tinta.primaria }}>Categorías de Mercado Libre</Typography>
            <Typography sx={{ fontSize: 13, color: tinta.secundaria, maxWidth: 640 }}>
              La venta de Mercado Libre agrupada por el árbol de categorías de ML (el de cada publicación), separada en Full, Colecta y
              Flex, con lo que cobra ML. Se entra a cada categoría pulsándola en el desglose de la vista.
            </Typography>
            <Button
              variant="contained"
              disableElevation
              onClick={() => elegir([])}
              sx={{ textTransform: "none", borderRadius: "10px", fontSize: 13, fontWeight: 600, px: 2.5 }}
            >
              Ver categorías de Mercado Libre
            </Button>
          </Box>
        ) : q ? (
          <Box sx={{ height: { xs: 420, md: 520 }, overflowY: "auto", p: 1 }}>
            <Typography sx={{ fontSize: 11.5, color: tinta.tenue, px: 1.25, py: 0.5 }}>
              {resultados.length === 0
                ? "Sin coincidencias."
                : `${resultados.length}${resultados.length === 80 ? "+" : ""} resultados · Enter elige el primero`}
            </Typography>
            {resultados.map((o) => (
              <Box
                key={`${o.nivel}-${o.codigo}`}
                component="button"
                type="button"
                onClick={() => elegir(rutaDe(o))}
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  border: 0,
                  borderRadius: "8px",
                  px: 1.25,
                  py: 0.75,
                  bgcolor: "transparent",
                  fontFamily: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                  "&:hover": { bgcolor: tinta.fondoSuave },
                }}
              >
                <Miniatura src={o.imagen} texto={o.nombre} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: tinta.primaria }}>
                    <Resaltado texto={o.nombre} busqueda={q} />
                  </Typography>
                  {o.padre && <Typography noWrap sx={{ fontSize: 11, color: tinta.tenue }}>{o.padre}</Typography>}
                </Box>
                <Box
                  component="span"
                  sx={{ fontSize: 11, fontWeight: 600, color: tinta.secundaria, bgcolor: "#f1f5f9", borderRadius: 999, px: 1, py: 0.25, flexShrink: 0 }}
                >
                  {niveles[o.nivel]?.etiqueta}
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ display: "flex", height: { xs: 420, md: 520 } }}>
            <Columna
              titulo={niveles[1]!.etiqueta}
              vacio={enFamilias ? "Las familias todavía no están disponibles." : "Sin categorías disponibles."}
            >
              {cargando
                ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} height={34} sx={{ mx: 1 }} />)
                : primeros.length === 0
                  ? undefined
                  : primeros.map((o) => (
                    <Fila
                      key={o.codigo}
                      texto={o.nombre}
                      imagen={enFamilias ? null : o.imagen}
                      detalle={String(segundosDe(o).length)}
                      marcada={n1?.codigo === o.codigo}
                      conHijos
                      onClick={() => setBorrador([paso(o)])}
                      onDobleClick={() => elegir([paso(o)])}
                    />
                  ))}
            </Columna>

            <Columna
              titulo={niveles[2]!.etiqueta}
              vacio={enFamilias ? "Elige una familia para ver sus subfamilias." : "Elige un primer nivel para ver sus categorías."}
            >
              {n1 ? (
                <>
                  <Fila
                    texto={`Todo ${n1.nombre}`}
                    imagen={null}
                    destacada
                    marcada={borrador.length === 1}
                    conHijos={false}
                    onClick={() => setBorrador([n1])}
                    onDobleClick={() => elegir([n1])}
                  />
                  {categorias.map((o) => (
                    <Fila
                      key={o.codigo}
                      texto={o.nombre}
                      imagen={enFamilias ? null : o.imagen}
                      marcada={n2?.codigo === o.codigo}
                      conHijos={!enFamilias}
                      onClick={() => setBorrador([n1, paso(o)])}
                      onDobleClick={() => elegir([n1, paso(o)])}
                    />
                  ))}
                </>
              ) : undefined}
            </Columna>

            {!enFamilias && (
            <Columna titulo="Subcategoría" vacio="Elige una categoría para ver sus subcategorías.">
              {n2 ? (
                cargandoSub ? (
                  Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={34} sx={{ mx: 1 }} />)
                ) : (
                  <>
                    <Fila
                      texto={`Todo ${n2.nombre}`}
                      imagen={null}
                      destacada
                      marcada={!n3}
                      conHijos={false}
                      onClick={() => setBorrador([...(n1 ? [n1] : []), n2])}
                      onDobleClick={() => elegir([...(n1 ? [n1] : []), n2])}
                    />
                    {subcategorias.map((o) => (
                      <Fila
                        key={o.codigo}
                        texto={o.nombre}
                        imagen={o.imagen}
                        marcada={n3?.codigo === o.codigo}
                        conHijos={false}
                        onClick={() => setBorrador([...(n1 ? [n1] : []), n2, paso(o)])}
                        onDobleClick={() => elegir([...(n1 ? [n1] : []), n2, paso(o)])}
                      />
                    ))}
                  </>
                )
              ) : undefined}
            </Columna>
            )}
          </Box>
        )}

        {!enMl && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            px: 2.5,
            py: 1.5,
            borderTop: `1px solid ${tinta.borde}`,
            bgcolor: tinta.fondoSuave,
          }}
        >
          {/* La ruta elegida: cada nivel se puede pulsar para quedarse en él. */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", minWidth: 0, fontSize: 12.5 }}>
            <Box component="span" sx={{ color: tinta.tenue, mr: 0.5 }}>
              Selección:
            </Box>
            {borrador.length === 0 ? (
              <Box component="span" sx={{ fontWeight: 700, color: tinta.primaria }}>
                {todas(pestana)}
              </Box>
            ) : (
              borrador.map((p, i) => {
                const ultima = i === borrador.length - 1;
                return (
                  <React.Fragment key={`${p.nivel}-${p.codigo}`}>
                    {i > 0 && <IconChevronRight size={12} color={tinta.tenue} />}
                    <Box
                      component={ultima ? "span" : "button"}
                      type={ultima ? undefined : "button"}
                      onClick={ultima ? undefined : () => setBorrador(borrador.slice(0, i + 1))}
                      sx={{
                        border: 0,
                        p: 0,
                        bgcolor: "transparent",
                        fontFamily: "inherit",
                        fontSize: 12.5,
                        fontWeight: ultima ? 700 : 500,
                        color: ultima ? tinta.primaria : tinta.acento,
                        cursor: ultima ? "default" : "pointer",
                        "&:hover": ultima ? undefined : { textDecoration: "underline" },
                      }}
                    >
                      {p.nombre}
                    </Box>
                  </React.Fragment>
                );
              })
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
            <Button onClick={() => elegir([])} sx={{ textTransform: "none", color: tinta.secundaria, borderRadius: "10px", fontSize: 13 }}>
              Ver todas
            </Button>
            <Button
              variant="contained"
              disableElevation
              disabled={!borrador.length || sinCambios}
              onClick={() => elegir(borrador)}
              sx={{ textTransform: "none", borderRadius: "10px", fontSize: 13, fontWeight: 600, px: 2.5 }}
            >
              Seleccionar
            </Button>
          </Box>
        </Box>
        )}
      </Dialog>
    </>
  );
}
