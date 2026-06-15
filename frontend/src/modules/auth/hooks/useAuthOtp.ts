import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyOtp } from "../services/auth.service";
import { saveSession } from "../utils/auth.storage";
import { normalizeOtpInput } from "../utils/auth.validators";

export function useAuthOtp(email: string) {
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(300);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const router = useRouter();

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleChange = (index: number, value: string) => {
    const next = normalizeOtpInput(value);
    if (next === "" && value !== "") return;

    const newValues = [...otpValues];
    newValues[index] = next;
    setOtpValues(newValues);

    if (next && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = otpValues.join("");
    if (otp.length < 6) {
      setSnackbarMessage("Debes ingresar los 6 digitos");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOtp({ email, otp });
      saveSession(data.token, data.rol);

      setSnackbarMessage("Verificacion exitosa");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setTimeout(() => router.push("/inicio"), 1500);
    } catch (error: any) {
      setSnackbarMessage(error.message || "Codigo invalido");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return {
    otpValues,
    inputsRef,
    timer,
    loading,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    formatTime,
    setSnackbarOpen,
    handleChange,
    handleKeyDown,
    handleVerify,
  };
}
