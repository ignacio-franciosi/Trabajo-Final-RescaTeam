import { useEffect, useMemo, useState } from 'react';
import { getPostByIdForChat, getImagesByPostIdForChat, buildPostImageUrl } from '../../services/PostService';
import { useNavigate } from 'react-router-dom';

export default function ChatPostPanel({ postId }) {
  const [post, setPost] = useState(null);
  const [imgUrl, setImgUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    if (!postId) { setPost(null); setImgUrl(''); return; }

    (async () => {
      setLoading(true);
      try {
        const [p, imgs] = await Promise.all([
          getPostByIdForChat(postId),
          getImagesByPostIdForChat(postId),
        ]);
        if (!alive) return;
        setPost(p);
        const first = imgs?.[0]?.filepath;
        setImgUrl(buildPostImageUrl(first || ''));
      } catch (e) {
        if (!alive) return;
        setPost(null);
        setImgUrl('');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [postId]);

  const badge = useMemo(() => {
    const t = (post?.postType || '').toLowerCase();
    if (!t) return null;
    const map = { adoption: 'ADOPCIÓN', lost: 'LOST', found: 'FOUND' };
    return map[t] || t.toUpperCase();
  }, [post?.postType]);

  return (
    <aside className="w-full xl:w-96 bg-white border-l border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-3">Publicación vinculada</h3>

      <div className="rounded-lg border bg-gray-50 overflow-hidden">
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          {loading ? (
            <span className="text-sm text-gray-400">Cargando…</span>
          ) : imgUrl ? (
            <img src={imgUrl} alt="Imagen de la publicación" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm text-gray-400">Sin imagen</span>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {badge && <span className="inline-block px-2 py-0.5 rounded-full bg-gray-200">{badge}</span>}
            {post?.species && <span>{post.species.toUpperCase?.() || post.species}</span>}
            {post?.breed && <span>• {post.breed}</span>}
          </div>

          <div className="text-base font-medium">
            {post?.name || '(Sin nombre)'}
          </div>

          {post?.zone && (
            <div className="text-sm text-gray-600">Zona: {post.zone}</div>
          )}

          <button
            type="button"
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
            onClick={() => navigate(`/mascota/${postId}`)}
            disabled={!postId}
          >
            Ver detalle completo
          </button>
        </div>
      </div>
    </aside>
  );
}
