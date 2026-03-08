export interface User {
    id: number
    username: string
    email: string
}

export interface LoginInput {
  username: string
  password: string
}

export interface RegisterInput {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  user?: User
  access: string
  refresh: string
}

