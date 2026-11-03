/**
 * Aviso de mantención en el login.
 *
 * Mientras `MANTENCION_ACTIVA` sea `true`, el cuadro de inicio de sesión queda
 * tapado por el aviso y no se puede ingresar. Para quitarlo basta con
 * cambiarlo a `false` (o borrar este archivo y sus dos usos en AuthLogin.tsx).
 */
export const MANTENCION_ACTIVA = true;

export const MANTENCION_TITULO = "Plataforma bloqueada";
export const MANTENCION_MENSAJE =
  "El ingreso a la plataforma está deshabilitado temporalmente.";
