// const API_URL = "http://10.131.90.170:8000/api";
const API_URL = "http://10.213.76.170:8000/api";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  auth: boolean = true,
): Promise<T> {
  let token = localStorage.getItem("access");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  //   on token expire
  if (auth && response.status === 401) {
    const refresh = localStorage.getItem("refresh");

    const refreshResponse = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh }),
    });

    if (!refreshResponse.ok) {
      throw { detail: "Session expired" }
    }

    const data = await refreshResponse.json();

    localStorage.setItem("access", data.access);

    token = data.access;

    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  if (!response.ok) {
    let data: any = {};

    try {
      data = await response.json();
    } catch {}

    let message = "Request failed";

    if (data.detail) {
      message = data.detail;
    } else if (data.error) {
      message = data.error;
    } else if (typeof data === "object") {
      const firstKey = Object.keys(data)[0];
      if (Array.isArray(data[firstKey])) {
        message = data[firstKey][0];
      }
    }

    throw { detail: message };
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}


function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export async function getValidToken(): Promise<string | null> {
  let token = localStorage.getItem("access");
  if (!token) return null;

  if (isTokenExpired(token)) {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) return null;

    try {
      const res = await fetch(`${API_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      localStorage.setItem("access", data.access);
      token = data.access;
    } catch {
      return null;
    }
  }

  return token;
}