"use client";
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Paper,
  Chip,
  Stack,
  Button,
  CircularProgress,
  useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import BusinessIcon from "@mui/icons-material/Business";
import PublicIcon from "@mui/icons-material/Public";
import ShieldIcon from "@mui/icons-material/Shield";
import BadgeIcon from "@mui/icons-material/Badge";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import EditIcon from "@mui/icons-material/Edit";
import { useEffect, useRef, useState } from "react";
import {
  editarCorreoUsuario,
  editarPerfil,
  obtenerDepartamentoPorId,
  obtenerPerfil,
  obtenerRolPorId,
  listarPlataformasUsuario,
  subirImagenPerfil,
  type IdServiceDepartamento,
  type IdServicePerfil,
  type IdServicePlataforma,
  type IdServiceRol,
  type IdServiceUsuarioResumen,
} from "@/modules/auth/services/idservice.client";
import { getIdServiceSession } from "@/modules/auth/utils/auth.storage";
import type { IdServiceSession } from "@/modules/auth/types/auth.types";
import { notifyError, notifySuccess } from "@/components/ui/toast/notify";

/** Tarjeta con icono + titulo + linea divisoria, igual estilo que el "Card" de
 * FrontOms (icono, titulo y una linea que llena el resto del encabezado). */
function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        {icon}
        <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={0.5}>
          {title}
        </Typography>
        <Box flex={1} sx={{ height: "1px", bgcolor: theme.palette.divider }} />
      </Box>
      {children}
    </Paper>
  );
}

/** Un campo "etiqueta encima, valor debajo" -version compacta de la fila
 * etiqueta:valor de la tarjeta DETALLE de FrontOms- pensado para ir de a dos
 * por fila y no gastar una fila completa por campo. */
function CampoFila({
  label,
  value,
  onChange,
  readOnly,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <Box>
      <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.25}>
        {label}
      </Typography>
      <Box
        component="input"
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
        sx={{
          width: "100%",
          border: "none",
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "transparent",
          fontSize: "0.875rem",
          fontFamily: "inherit",
          color: readOnly ? "text.secondary" : "text.primary",
          outline: "none",
          py: 0.5,
          "&:focus": { borderColor: readOnly ? "divider" : "primary.main" },
        }}
      />
    </Box>
  );
}

/** Fila de "USUARIO CREADOR" / "USUARIO ACTUALIZADOR": avatar o iniciales +
 * nombre + correo a la izquierda, fecha a la derecha. */
function UsuarioResumenRow({ usuario, fecha }: { usuario?: IdServiceUsuarioResumen | null; fecha?: string | null }) {
  if (!usuario || (!usuario.Nombre && !usuario.Email)) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  const nombreCompleto = `${usuario.Nombre || ""} ${usuario.Apellido || ""}`.trim() || usuario.Email || "—";
  const iniciales = nombreCompleto.charAt(0).toUpperCase();
  const fechaFmt = fecha ? new Date(fecha).toLocaleDateString() : null;

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
      <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
        <Avatar src={usuario.Imagen || undefined} sx={{ width: 32, height: 32, fontSize: "0.85rem" }}>
          {!usuario.Imagen && iniciales}
        </Avatar>
        <Box minWidth={0}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {nombreCompleto}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {usuario.Email}
          </Typography>
        </Box>
      </Box>
      {fechaFmt && (
        <Typography variant="caption" color="text.secondary" whiteSpace="nowrap">
          {fechaFmt}
        </Typography>
      )}
    </Box>
  );
}

export default function PerfilPage() {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [perfil, setPerfil] = useState<IdServicePerfil | null>(null);
  const [plataformas, setPlataformas] = useState<IdServicePlataforma[]>([]);
  const [roles, setRoles] = useState<IdServiceRol[]>([]);
  const [departamento, setDepartamento] = useState<IdServiceDepartamento | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Solo para el fallo de carga inicial (bloquea la pantalla, no es transitorio
  // como guardar/subir imagen): esos usan el aviso flotante, ver notify.tsx.
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState({ nombres: "", apellidos: "", telefono: "", correo: "" });

  // localStorage no existe en el server: arrancar en null aqui (en vez de
  // leer getIdServiceSession() directo en el cuerpo del componente) evita que
  // el HTML de hidratacion ("sin sesion") no calce con el primer render del
  // cliente ("con sesion") y React tire un error de hidratacion.
  const [session, setSession] = useState<IdServiceSession | null>(null);

  // Datos "de contexto" (plataformas, roles, departamento): no bloquean la
  // pantalla principal, se resuelven aparte y en paralelo apenas se conoce el
  // perfil (el departamento y los roles vienen como IDs sueltos).
  const cargarContexto = async (activeSession: IdServiceSession, data: IdServicePerfil) => {
    const { token, usuarioId } = activeSession;

    listarPlataformasUsuario(usuarioId, token)
      .then(setPlataformas)
      .catch((err) => console.error("Error al obtener plataformas:", err));

    if (data.ID_Departamento) {
      obtenerDepartamentoPorId(data.ID_Departamento, token)
        .then(setDepartamento)
        .catch((err) => console.error("Error al obtener departamento:", err));
    } else {
      setDepartamento(null);
    }

    const rolIds = Array.isArray(data.RolIDs) ? data.RolIDs : [];
    if (rolIds.length) {
      Promise.all(rolIds.map((id) => obtenerRolPorId(id, token)))
        .then((resultados) => setRoles(resultados.filter((r): r is IdServiceRol => Boolean(r))))
        .catch((err) => console.error("Error al obtener roles:", err));
    } else {
      setRoles([]);
    }
  };

  const cargarPerfil = async (activeSession: IdServiceSession | null) => {
    if (!activeSession) {
      setLoading(false);
      return;
    }
    try {
      const data = await obtenerPerfil(activeSession.usuarioId, activeSession.token);
      setPerfil(data);
      setForm({
        nombres: data.Nombres || "",
        apellidos: data.Apellidos || "",
        telefono: data.Telefono || "",
        correo: data.Email || activeSession.correo || "",
      });
      void cargarContexto(activeSession, data);
    } catch (err) {
      console.error("Error al obtener perfil:", err);
      setLoadError("No se pudo cargar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentSession = getIdServiceSession();
    setSession(currentSession);
    cargarPerfil(currentSession);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGuardar = async () => {
    if (!session || !perfil) return;
    setSaving(true);
    try {
      // `/perfiles/editar/:id` sobreescribe TODAS sus columnas en cada llamada
      // (no es un PATCH parcial): RUT y la foto hay que repetirlos tal cual
      // estan hoy o el back los deja en null, aunque el usuario no los toco.
      await editarPerfil(session.usuarioId, session.token, {
        nombres: form.nombres,
        apellidos: form.apellidos,
        telefono: form.telefono,
        rut: perfil.RUT || undefined,
        urlImagenPerfil: perfil.URLImagenPerfil || undefined,
      });

      // El correo (identidad de login) vive en USUARIOS, no en PERFILES: solo
      // se toca si de verdad cambio, y repitiendo el activo/roles actuales
      // para no pisarlos (ver editarCorreoUsuario).
      const correoNuevo = form.correo.trim();
      if (correoNuevo && correoNuevo !== perfil.Email) {
        await editarCorreoUsuario({
          usuarioId: session.usuarioId,
          token: session.token,
          correo: correoNuevo,
          activo: perfil.Activo !== false,
          rolesIds: perfil.RolIDs || [],
          plataformaIds: perfil.PlataformaIDs,
        });
      }

      notifySuccess("Perfil actualizado correctamente.");
      await cargarPerfil(session);
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      notifyError("No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleSeleccionarImagen = () => fileInputRef.current?.click();

  const handleSubirImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !session) return;

    setUploading(true);
    try {
      await subirImagenPerfil(session.usuarioId, session.token, file);
      await cargarPerfil(session);
      // El header (Profile.tsx) lee la imagen de nuevo la proxima vez que
      // monte; para que se refresque ya mismo en esta misma pestana avisamos
      // por evento, sin necesitar un store global solo para esto.
      window.dispatchEvent(new Event("perfil:imagen-actualizada"));
      notifySuccess("Foto de perfil actualizada.");
    } catch (err) {
      console.error("Error al subir imagen:", err);
      notifyError("No se pudo subir la imagen.", { description: "Verifica que sea JPG, PNG o WEBP." });
    } finally {
      setUploading(false);
    }
  };

  // `loading` se revisa antes que `session`: arranca en true y solo baja
  // despues de que el efecto de montaje ya leyo localStorage, asi que para
  // cuando se muestra "No hay sesion activa" el chequeo es real y no un
  // falso negativo del primer render (antes de que el efecto corriera).
  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Box p={4}>
        <Typography>No hay sesion activa.</Typography>
      </Box>
    );
  }

  const nombreCompleto = `${form.nombres || session.nombre || ""} ${form.apellidos || ""}`.trim() || session.correo;

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 26, height: 26, fontSize: "0.9rem" }}>
          👤
        </Avatar>
        <Typography variant="h6" fontWeight={700}>
          Mi Perfil
        </Typography>
      </Box>

      {loadError && (
        <Typography color="error" variant="body2" mb={2}>
          {loadError}
        </Typography>
      )}

      <Paper elevation={1} sx={{ borderRadius: 3, overflow: "hidden", mb: 2 }}>
        {/* Portada + avatar */}
        <Box
          sx={{
            height: 64,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          }}
        />
        <Box sx={{ px: 3, pb: 2, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
          <Box position="relative" sx={{ mt: "-40px" }}>
            <Avatar
              alt={nombreCompleto}
              src={perfil?.URLImagenPerfil || undefined}
              sx={{ width: 80, height: 80, border: "3px solid white", boxShadow: 3, fontSize: "1.8rem" }}
            >
              {nombreCompleto.charAt(0).toUpperCase()}
            </Avatar>
            <Box
              onClick={uploading ? undefined : handleSeleccionarImagen}
              sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                bgcolor: theme.palette.primary.main,
                color: "#fff",
                borderRadius: "50%",
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: uploading ? "wait" : "pointer",
                border: "2px solid white",
              }}
            >
              {uploading ? <CircularProgress size={13} color="inherit" /> : <PhotoCameraIcon sx={{ fontSize: 14 }} />}
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleSubirImagen}
            />
          </Box>

          <Box sx={{ mt: { xs: 0, md: "8px" }, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              {nombreCompleto}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
              {session.correo}
            </Typography>

            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              <Chip
                size="small"
                icon={perfil?.Activo === false ? <HighlightOffIcon /> : <CheckCircleIcon />}
                label={perfil?.Activo === false ? "Inactivo" : "Activo"}
                color={perfil?.Activo === false ? "default" : "success"}
                variant="outlined"
                sx={{ height: 22, "& .MuiChip-label": { px: 1 } }}
              />
              {perfil?.EsExterno && (
                <Chip size="small" icon={<PublicIcon />} label="Usuario externo" variant="outlined" sx={{ height: 22 }} />
              )}
              {departamento && (
                <Chip size="small" icon={<BusinessIcon />} label={departamento.Name} variant="outlined" sx={{ height: 22 }} />
              )}
              {roles.map((rol) => (
                <Chip key={rol.roleId} size="small" icon={<ShieldIcon />} label={rol.nombre} color="primary" variant="outlined" sx={{ height: 22 }} />
              ))}
              {plataformas.map((p) => (
                <Chip key={p.ID} size="small" label={p.NOMBRE} variant="outlined" sx={{ height: 22 }} />
              ))}
            </Stack>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <SectionCard title="DETALLE" icon={<EditIcon color="action" fontSize="small" />}>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <CampoFila
                  label="Nombres"
                  value={form.nombres}
                  onChange={(v) => setForm({ ...form, nombres: v })}
                  placeholder="Nombres"
                />
              </Grid>
              <Grid item xs={6}>
                <CampoFila
                  label="Apellidos"
                  value={form.apellidos}
                  onChange={(v) => setForm({ ...form, apellidos: v })}
                  placeholder="Apellidos"
                />
              </Grid>
              <Grid item xs={6}>
                <CampoFila
                  label="Correo"
                  type="email"
                  value={form.correo}
                  onChange={(v) => setForm({ ...form, correo: v })}
                  placeholder="correo@dominio.cl"
                />
              </Grid>
              <Grid item xs={6}>
                <CampoFila
                  label="Telefono"
                  value={form.telefono}
                  onChange={(v) => setForm({ ...form, telefono: v })}
                  placeholder="+56 9 1122 3344"
                />
              </Grid>
              <Grid item xs={12}>
                <CampoFila label="RUT" value={perfil?.RUT || ""} readOnly placeholder="—" />
              </Grid>
            </Grid>

            <Button variant="contained" size="small" onClick={handleGuardar} disabled={saving} sx={{ mt: 1.5 }}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <SectionCard title="USUARIO CREADOR" icon={<PersonAddAltIcon color="action" fontSize="small" />}>
              <UsuarioResumenRow usuario={perfil?.UsuarioCreador} fecha={perfil?.UsuarioCreador?.FechaCreacion} />
            </SectionCard>

            <SectionCard title="ULTIMA MODIFICACION" icon={<BadgeIcon color="action" fontSize="small" />}>
              <UsuarioResumenRow
                usuario={perfil?.UsuarioActualizador}
                fecha={perfil?.UsuarioActualizador?.FechaActualizacion}
              />
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
