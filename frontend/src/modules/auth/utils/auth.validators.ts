export type RegisterFormValues = {
  nombre: string;
  email: string;
  telefono: string;
  departamento: string;
  password: string;
  confirmPassword: string;
};

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRegisterForm(values: RegisterFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.nombre.trim()) errors.nombre = "Campo requerido";
  if (!values.email.trim()) errors.email = "Campo requerido";
  else if (!isValidEmail(values.email)) errors.email = "Correo no valido";

  if (!values.telefono.trim()) errors.telefono = "Campo requerido";
  if (!values.departamento) errors.departamento = "Campo requerido";
  if (!values.password) errors.password = "Campo requerido";
  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Las contrasenas no coinciden";
  }

  return errors;
}

export function sanitizePhone(value: string): string {
  const onlyNumbers = value.replace(/\D/g, "");
  return onlyNumbers.slice(0, 8);
}

export function normalizeOtpInput(value: string): string {
  return /^\d?$/.test(value) ? value : "";
}
