import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const value = localStorage.getItem("realEstateUser");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  function login(authData) {
    const token =
      authData?.token ??
      authData?.jwt ??
      authData?.accessToken ??
      authData?.access_token;

    if (!token) {
      throw new Error("Login succeeded but the backend did not return a JWT token.");
    }

    const storedUser = {
      id: authData.id ?? authData.userId ?? null,
      fullName: authData.fullName ?? authData.name ?? "",
      email: authData.email ?? "",
      role: authData.role ?? ""
    };

    localStorage.setItem("realEstateToken", token);
    localStorage.setItem("realEstateUser", JSON.stringify(storedUser));
    setUser(storedUser);
  }

  function updateUser(data) {
    const nextUser = {
      id: data.id ?? user?.id ?? null,
      fullName: data.fullName ?? user?.fullName ?? "",
      email: data.email ?? user?.email ?? "",
      role: data.role ?? user?.role ?? ""
    };
    localStorage.setItem("realEstateUser", JSON.stringify(nextUser));
    if (data.token) {
      localStorage.setItem("realEstateToken", data.token);
    }
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem("realEstateToken");
    localStorage.removeItem("realEstateUser");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(localStorage.getItem("realEstateToken")),
      login,
      updateUser,
      logout
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}