import { createContext, useContext, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("algolens_user");
    return stored ? JSON.parse(stored) : null;
  });

  const persistSession = (data) => {
    const { token, ...userData } = data;
    localStorage.setItem("algolens_token", token);
    localStorage.setItem("algolens_user", JSON.stringify(userData));
    setUser(userData);
  };

  const signup = async (name, email, password) => {
    const { data } = await api.post("/auth/signup", { name, email, password });
    persistSession(data);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    persistSession(data);
  };

  const logout = () => {
    localStorage.removeItem("algolens_token");
    localStorage.removeItem("algolens_user");
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem("algolens_user", JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
