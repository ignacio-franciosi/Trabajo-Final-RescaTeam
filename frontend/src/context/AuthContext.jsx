import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../services/axiosConfigUsers';
import { initPush } from "../services/PushService";

// ⬅️ ahora exportamos también el contexto como named export
export const AuthContext = createContext(null);

// Hook personalizado
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);     // { userId, type, suspended }
  const [token, setToken] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Evita doble init de push
  const pushInitDoneRef = useRef(false);

  // Inicializa Push solo una vez si tenemos JWT
  const ensurePushInit = async (jwt) => {
    if (!jwt || pushInitDoneRef.current) return;
    try {
      await initPush(jwt);
      pushInitDoneRef.current = true;
    } catch (err) {
      console.warn("[Push] init falló:", err);
    }
  };

  // Bootstrap desde localStorage
  useEffect(() => {
    (async () => {
      try {
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          await ensurePushInit(savedToken);
        }
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  const login = async ({ email, password }) => {
    try {
      const res = await api.post('/login', { email, password });
      const { token, id_user, type, suspended } = res.data;
      const nextUser = { userId: id_user, type, suspended };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(nextUser));
      setToken(token);
      setUser(nextUser);

      await ensurePushInit(token);

      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.error || error.response?.data?.message || "Error al iniciar sesión." };
    }
  };

  const register = async (data) => {
    try {
      const res = await api.post('/register', data);
      const { token, id_user, type, suspended } = res.data;
      const nextUser = { userId: id_user, type, suspended };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(nextUser));
      setToken(token);
      setUser(nextUser);

      await ensurePushInit(token);

      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.error || error.response?.data?.message || "Error al registrarse." };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    // permitir nueva init de push si vuelve a loguearse
    pushInitDoneRef.current = false;
  };

  // Permite actualizar token y user desde otras partes de la app
  const setAuth = (newToken, newUser) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
      // Intentar init push si aún no lo hicimos
      ensurePushInit(newToken);
    }
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  // Verificar estado de suspensión del usuario periódicamente
  useEffect(() => {
    if (!user?.userId || !token) return;

    const checkUserStatus = async () => {
      try {
        const res = await api.get(`/user/${user.userId}`);
        if (res.data?.suspended !== user.suspended) {
          // El estado de suspensión cambió, actualizar
          const updatedUser = { ...user, suspended: res.data.suspended };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      } catch (err) {
        console.error("Error verificando estado de usuario:", err);
      }
    };

    // Verificar inmediatamente
    checkUserStatus();

    // Verificar cada 30 segundos
    const interval = setInterval(checkUserStatus, 30000);

    return () => clearInterval(interval);
  }, [user?.userId, token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, initialized, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
