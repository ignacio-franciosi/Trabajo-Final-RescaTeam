import { createContext, useContext, useEffect, useState } from 'react';

// Crear el contexto
const AuthContext = createContext();

// Hook para acceder al contexto
export const useAuth = () => useContext(AuthContext);

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Podés guardar info como id, tipo, etc.
  const [token, setToken] = useState(null);

  // Persistencia desde localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
