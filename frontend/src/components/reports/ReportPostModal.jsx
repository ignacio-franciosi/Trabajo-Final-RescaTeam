import React, { useEffect, useState } from 'react';
import { createReport } from '../../services/ReportService';
import { useAuth } from '../../context/AuthContext';



const MOTIVOS = [
    'Contenido inapropiado',
    'Información incorrecta',
    'Spam / Publicidad',
    'Maltrato animal',
    'Lenguaje ofensivo',
    'Duplicado',
    'Posible estafa',
    'Otro'
];

const ReportPostModal = ({ post, ownerUserId, isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [reason, setReason] = useState(MOTIVOS[0]);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    // Reset básico al abrir
    useEffect(() => {
        if (isOpen) {
            setError('');
            setDone(false);
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setDone(false);

        if (!reason) {
            setError('La razón es obligatoria');
            return;
        }
        if (!comment.trim()) {
            setError('El comentario es obligatorio');
            return;
        }
        if (!user?.userId) {
            setError('Debes iniciar sesión para reportar');
            return;
        }
        if (!post?.postId) {
            setError('Publicación inválida');
            return;
        }

        const payload = {
            id_user: user.userId, // denunciante
            complainingUserId: ownerUserId, // denunciado (dueño post)
            postId: post.postId,
            reason,
            comment: comment.trim()
        };

        try {
            setLoading(true);
            const res = await createReport(payload);
            if (!res.success) throw new Error(res.message);
            setDone(true);
            setTimeout(() => {
                onClose?.();
                onSuccess?.(res.data);
            }, 800);
        } catch (err) {
            setError(err.message || 'Error al enviar el reporte');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >✕</button>
                <h2 className="text-lg font-semibold mb-4">Reportar publicación</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Razón *</label>
                        <select
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                        >
                            {MOTIVOS.map(m => <option key={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comentario *</label>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={4}
                            placeholder="Describe brevemente el problema"
                            className="w-full border rounded px-3 py-2 text-sm"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {done && <p className="text-sm text-green-600">Reporte enviado correctamente</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded border"
                            disabled={loading}
                        >Cancelar</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded text-sm disabled:opacity-50"
                        >{loading ? 'Enviando...' : 'Enviar reporte'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportPostModal;