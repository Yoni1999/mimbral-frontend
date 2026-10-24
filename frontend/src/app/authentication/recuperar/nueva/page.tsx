"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { cambiarContrasenaConOtp } from "@/modules/auth/services/idservice.client";
import type { IdServiceApiError } from "@/modules/auth/types/auth.types";
import styles from "../Recuperar.module.css";

const FRIENDLY_SAVE_ERROR =
  "No pudimos actualizar tu contraseña. Código OTP inválido, expirado o ya usado.";

function SetNewPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();

  const emailParam = params.get("email") || "";
  const otp = params.get("otp") || "";

  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!emailParam || !otp) router.replace("/authentication/recuperar");
  }, [emailParam, otp, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOkMsg(null);

    if (!pwd.trim() || !confirm.trim()) {
      setError("Ingresa y confirma tu contraseña nueva.");
      return;
    }
    if (pwd !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      const correo = emailParam.trim().toLowerCase();
      const response = await cambiarContrasenaConOtp({
        correo,
        codigoOtp: otp,
        nuevaContrasena: pwd,
        confirmarContrasena: confirm,
      });

      setOkMsg(response?.message || "Contrasena actualizada");
      setTimeout(() => router.push("/authentication/login"), 900);
    } catch (err) {
      const apiError = err as IdServiceApiError;
      setError(apiError.message || FRIENDLY_SAVE_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.brand}>
          <p className={styles.brandTitle}>Análisis 360</p>
        </div>

        <form className={styles.card} onSubmit={onSubmit}>
          <h1 className={styles.heading}>Elige una contraseña nueva</h1>
          <p className={styles.subheading}>
            Usa una contraseña segura. Te mostraremos las reglas exactas si el servidor la rechaza.
          </p>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="pwd">
              Contrasena nueva
            </label>
            <div className={styles.inputWrap}>
              <input
                id="pwd"
                type={showPwd ? "text" : "password"}
                required
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className={styles.input}
                placeholder="********"
              />
              <IconButton
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                edge="end"
                size="small"
                className={styles.eyeButton}
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirm">
              Confirmar contraseña
            </label>
            <div className={styles.inputWrap}>
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={styles.input}
                placeholder="********"
              />
              <IconButton
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                edge="end"
                size="small"
                className={styles.eyeButton}
                aria-label={showConfirm ? "Ocultar confirmación" : "Mostrar confirmación"}
              >
                {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </div>
          </div>

          {error && (
            <div className={styles.alert} role="alert">
              <p className={styles.alertText}>{error}</p>
            </div>
          )}

          {okMsg && (
            <div className={styles.success} role="status">
              <p className={styles.successText}>{okMsg}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? "Guardando..." : "Continuar"}
          </button>

          <Link href="/authentication/login" className={styles.backLink}>
            Volver a iniciar sesion
          </Link>
        </form>
      </div>
    </div>
  );
}

export default function SetNewPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetNewPasswordForm />
    </Suspense>
  );
}
