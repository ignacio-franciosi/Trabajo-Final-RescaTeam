import api from './axiosConfigUsers';

/**
 * Devuelve { fullName, ok } para un userId dado.
 * Si USERS no permite leer ese usuario, degrada a "Usuario {id}".
 */
export async function fetchUserName(userId) {
  try {
    const { data } = await api.get(`/user/${userId}`);
    const name = (data?.name ?? '').trim();
    const surname = (data?.surname ?? '').trim();
    const fullName = [name, surname].filter(Boolean).join(' ') || `Usuario ${userId}`;
    return { fullName, ok: true };
  } catch (e) {
    // degrado silenciosamente
    return { fullName: `Usuario ${userId}`, ok: false };
  }
}
