import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Tarjeta lateral con datos mínimos del post.
 * Props:
 * - post: { postId, postType, name, species, breed, zone, images(opcional) }
 */
export default function PostSideCard({ post }) {
  const navigate = useNavigate();
  if (!post) {
    return (
      <aside className="hidden xl:block w-full border-l border-gray-200 bg-white">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Detalle de la publicación</h3>
          <p className="text-sm text-gray-500">Seleccioná un chat para ver el post asociado.</p>
        </div>
      </aside>
    );
  }

  const goToDetail = () => {
    // Tu app ya tiene ruta de detalle: /mascota/:id
    navigate(`/mascota/${post.postId}`);
  };

  // Intento de imagen si tu backend la trae dentro de `imagenes`
  const imgUrl = Array.isArray(post.imagenes) && post.imagenes[0]?.filepath
    ? ( /^https?:\/\//i.test(post.imagenes[0].filepath)
        ? post.imagenes[0].filepath
        : `http://localhost:8090${post.imagenes[0].filepath.startsWith('/') ? '' : '/'}${post.imagenes[0].filepath}`
      )
    : null;

  return (
    <aside className="hidden xl:flex w-full max-w-[380px] border-l border-gray-200 bg-white">
      <div className="p-6 space-y-4 w-full">
        <h3 className="text-lg font-semibold">Publicación vinculada</h3>

        <div className="rounded-lg border">
          {imgUrl ? (
            <img
              src={imgUrl}
              className="w-full h-44 object-cover rounded-t-lg"
              alt={post.name || "Mascota"}
            />
          ) : (
            <div className="w-full h-44 bg-gray-100 rounded-t-lg grid place-items-center text-gray-400 text-sm">
              Sin imagen
            </div>
          )}

          <div className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
              <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100">
                {post.postType}
              </span>
              {post.species ? <span>{post.species}</span> : null}
              {post.breed ? <span>• {post.breed}</span> : null}
            </div>

            <h4 className="text-base font-semibold">
              {post.name || "Mascota"}
            </h4>

            {post.zone ? (
              <p className="text-sm text-gray-600">Zona: {post.zone}</p>
            ) : null}

            <button
              onClick={goToDetail}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
              type="button"
            >
              Ver detalle completo
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
