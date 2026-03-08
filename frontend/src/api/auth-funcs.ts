import { apiRequest } from "./client";
import type { User, LoginInput, RegisterInput, AuthResponse } from "../types/auth";

export function login(data: LoginInput) {
    return apiRequest<AuthResponse>("/auth/login/", {
        method: "POST",
        body: JSON.stringify(data),
    },
    false)
}

export function logout(refresh: string) {
    return apiRequest("/auth/logout/",
        {
            method: "POST",
            body: JSON.stringify({ refresh }),
        }
    );
}
export function register(data: RegisterInput) {
    return apiRequest<AuthResponse>("/auth/register/", {
        method: "POST",
        body: JSON.stringify(data)
    },
    false)
}


export function updateUser(data: { username?: string; email?: string }) {
  return apiRequest<User>("/auth/update/", {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export function getMe() {
    return apiRequest<User>("/auth/me")
}