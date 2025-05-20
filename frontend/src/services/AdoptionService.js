const API_URL = "http://localhost:8080"; // Cambialo si tu backend usa otro puerto

export const getAllPosts = async () => {
  const res = await fetch(`${API_URL}/adoptionPost`);
  if (!res.ok) throw new Error("Error al obtener las publicaciones");
  return await res.json();
};

export const getUserPosts = async (token) => {
  const res = await fetch(`${API_URL}/adoptionPost/mis-publicaciones`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Error al obtener tus publicaciones");
  return await res.json();
};

export const updatePost = async (id, data, token) => {
  const res = await fetch(`${API_URL}/adoptionPost/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar publicación");
  return await res.json();
};
