import { useState } from "react";
import { registerUser } from "../services/auth.service";
import {
  sanitizePhone,
  validateRegisterForm,
  type RegisterFormValues,
} from "../utils/auth.validators";

const INITIAL_VALUES: RegisterFormValues = {
  nombre: "",
  email: "",
  telefono: "",
  departamento: "",
  password: "",
  confirmPassword: "",
};

export function useAuthRegister() {
  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const setField = (key: keyof RegisterFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const setTelefono = (value: string) => {
    setField("telefono", sanitizePhone(value));
  };

  const handleRegister = async () => {
    const validationErrors = validateRegisterForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await registerUser({
        nombre: values.nombre,
        email: values.email,
        password: values.password,
        telefono: values.telefono,
        direccion: values.departamento,
      });

      setOpenDialog(true);
    } catch (error: any) {
      setErrors({ email: error.message || "Error al registrar" });
    } finally {
      setLoading(false);
    }
  };

  return {
    values,
    showPassword,
    showConfirm,
    errors,
    loading,
    openDialog,
    setField,
    setTelefono,
    setOpenDialog,
    setShowPassword,
    setShowConfirm,
    handleRegister,
  };
}
