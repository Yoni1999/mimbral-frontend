"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { verificarOtpPassword } from "@/modules/auth/services/idservice.client";
import type { IdServiceApiError } from "@/modules/auth/types/auth.types";
import styles from "../Recuperar.module.css";

const FRIENDLY_OTP_ERROR = "El código es inválido o ha expirado. Intenta nuevamente.";

/** Quita tildes (rango Unicode de diacriticos combinados) para comparar texto. */
function stripDiacritics(value: string): string {
  return value
    .normalize("NFD")
    .split("")
    .filter((ch) => {
      const code = ch.codePointAt(0) || 0;
      return code < 0x0300 || code > 0x036f;
    })
    .join("");
}

function isOtpOk(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const data = payload as Record<string, unknown>;
  if (data.valid === true) return true;
  if (typeof data.valid === "string" && data.valid.toLowerCase() === "true") return true;
  if (data.ok === true) return true;
  const status = String(data.status ?? "").toLowerCase();
  if (status === "ok" || status === "success") return true;
  const msg = stripDiacritics(String(data.message ?? "").toLowerCase());
  return msg.includes("valido");
}

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const emailParam = params.get("email") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!emailParam) router.replace("/authentication/recuperar");
  }, [emailParam, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.length !== 6) {
      setError("Ingresa el código de 6 dígitos.");
      return;
    }

    try {
      setLoading(true);
      const correo = emailParam.trim().toLowerCase();
      const data = await verificarOtpPassword(correo, code);

      if (!isOtpOk(data)) throw new Error(FRIENDLY_OTP_ERROR);

      router.push(
        `/authentication/recuperar/nueva?email=${encodeURIComponent(correo)}&otp=${encodeURIComponent(code)}`
      );
    } catch (err) {
      const apiError = err as IdServiceApiError;
      setError(apiError.message || FRIENDLY_OTP_ERROR);
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
          <h1 className={styles.heading}>Introduce el código de seguridad</h1>
          <p className={styles.subheading}>Código de 6 dígitos enviado a {emailParam}</p>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="code">
              Código (6 dígitos)
            </label>
            <input
              id="code"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={styles.otpInput}
              placeholder="------"
            />
          </div>

          {error && (
            <div className={styles.alert} role="alert">
              <p className={styles.alertText}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? "Verificando..." : "Continuar"}
          </button>

          <Link href="/authentication/login" className={styles.backLink}>
            Volver a iniciar sesion
          </Link>
        </form>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpForm />
    </Suspense>
  );
}
