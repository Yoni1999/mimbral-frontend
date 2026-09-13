"use client";
import React from "react";
import Link from "next/link";
import { IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import { useAuthLogin } from "@/modules/auth/hooks/useAuthLogin";
import styles from "./AuthLogin.module.css";

/**
 * Misma estructura visual que FrontOmsMimbral/features/auth/pages/Login.tsx
 * (mismo layout, mismos textos de acompanamiento), con "Analisis 360" en vez
 * de "Mimbral 360" y sin Tailwind (ver AuthLogin.module.css).
 */
const AuthLogin = () => {
  const {
    showPassword,
    email,
    password,
    loading,
    error,
    showForceLogin,
    identifierIsValid,
    passwordEnabled,
    setEmail,
    setPassword,
    togglePassword,
    handleLogin,
    handleForceLogin,
  } = useAuthLogin();

  const canSubmit = identifierIsValid && password.trim().length > 0 && !loading;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    void handleLogin();
  };

  return (
    <div className={styles.page}>
      <div className={styles.decorTop} />
      <div className={styles.decorBlobLeft} />
      <div className={styles.decorBlobRight} />

      <div className={styles.content}>
        <div className={styles.brand}>
          <p className={styles.brandTitle}>Analisis 360</p>
        </div>

        <form className={styles.card} onSubmit={onSubmit}>
          <h2 className={styles.cardHeading}>Inicia sesion con tu cuenta</h2>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Usuario
            </label>
            <div className={styles.inputWrap}>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                autoCorrect="off"
                autoCapitalize="none"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="Correo o RUT"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Contrasena
            </label>
            <div className={styles.inputWrap}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={!passwordEnabled}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder={passwordEnabled ? "Ingresa tu contrasena" : "Primero valida tu correo o RUT"}
              />
              <IconButton
                type="button"
                onClick={togglePassword}
                edge="end"
                size="small"
                disabled={!passwordEnabled}
                className={styles.eyeButton}
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </div>

            {!passwordEnabled && (
              <p className={styles.hint}>
                La contrasena se habilita cuando el correo o RUT tiene formato valido.
              </p>
            )}
          </div>

          {(error || showForceLogin) && (
            <div className={`${styles.alert} ${showForceLogin ? styles.warning : ""}`} role="alert">
              <p className={styles.alertText}>{error}</p>
              {showForceLogin && (
                <button
                  type="button"
                  className={styles.forceLoginButton}
                  onClick={() => void handleForceLogin()}
                >
                  Cerrar sesion e iniciar nueva
                </button>
              )}
            </div>
          )}

          <button type="submit" disabled={!canSubmit} className={styles.submitButton}>
            {loading ? "Cargando..." : "Ingresar"}
          </button>

          <div className={styles.divider}>O tambien</div>

          <div className={styles.secondaryRow}>
            <span className={styles.secondaryButton} title="Los usuarios los crea un administrador">
              Crear cuenta
            </span>
            <Link href="/authentication/recuperar" className={styles.recoverLink}>
              Olvide mi contrasena
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthLogin;
