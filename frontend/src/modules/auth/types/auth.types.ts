export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  requiresOtp?: boolean;
  token?: string;
  rol?: string;
  message?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  token: string;
  rol: string;
  message?: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  direccion: string;
}

export interface RegisterResponse {
  message?: string;
}
