"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { recuperarPassword } from "@/modules/auth/services/idservice.client";
import type { IdServiceApiError } from "@/modules/auth/types/auth.types";
import styles from "./Recuperar.module.css";

function RecuperarContrasenaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Si se llega desde "Mi Perfil > Cambiar contrasena" ya sabemos el correo.
  useEffect(() => {
    const prefill = params.get("email");
    if (prefill) setEmail(prefill);
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    if (!email.trim()) {
      setError("Ingresa tu correo.");
      return;
    }

    try {
      setLoading(true);
      await recuperarPassword(email.trim());
      setOkMsg("Te enviamos un codigo de 6 digitos a tu correo.");
      setTimeout(
        () => router.push(`/authentication/recuperar/otp?email=${encodeURIComponent(email.trim())}`),
        1500
      );
    } catch (err) {
      const apiError = err as IdServiceApiError;
      setError(apiError.message || "Se produjo un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.brand}>
          <p className={styles.brandTitle}>Analisis 360</p>
        </div>

        <form className={styles.card} onSubmit={onSubmit}>
          <h1 className={styles.heading}>Recuperar contrasena</h1>
          <p className={styles.subheading}>
            Introduce tu correo y te enviaremos un codigo de 6 digitos.
          </p>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="usuario@dominio.cl"
            />
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
            {loading ? "Enviando..." : "Continuar"}
          </button>

          <Link href="/authentication/login" className={styles.backLink}>
            Volver a iniciar sesion
          </Link>
        </form>
      </div>
    </div>
  );
}

export default function RecuperarContrasenaPage() {
  return (
    <Suspense fallback={null}>
      <RecuperarContrasenaForm />
    </Suspense>
  );
}
