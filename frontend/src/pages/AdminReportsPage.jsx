import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getAllReports,
    getAllReportsByStatus,
    updateReport,
    deleteReport,
    getReportById
} from '../services/ReportService';
import { deletePost } from '../services/PostService';
import { suspendUser, getUserById } from '../services/UserService';

const statusChipClass = (status) => {
    const base = 'px-2 py-1 rounded-full text-xs font-semibold';
    if (status === 'pending') return `${base} bg-yellow-100 text-yellow-800`;
    if (status === 'revised') return `${base} bg-green-100 text-green-800`;
    return `${base} bg-gray-100 text-gray-700`;
};

const translateStatus = (status) => {
    if (status === 'pending') return 'Pendiente';
    if (status === 'revised') return 'Revisado';
    return status;
};

const AdminReportsPage = () => {
    const { user, token } = useAuth();
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'revised'
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [adminComment, setAdminComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [suspendLoading, setSuspendLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [userNames, setUserNames] = useState({}); // { [id]: 'Nombre Apellido' }
    // Suspended users moved to separate view

    const isAdmin = !!user?.type; // según TokenVerificationResponse.type

    const formatListDate = (raw) => {
        if (!raw) return '';
        // Se asume raw puede venir como string ISO o fecha simple
        const d = new Date(raw);
        if (isNaN(d.getTime())) return raw; // fallback
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const formatDetailDate = (raw) => {
        if (!raw) return '';
        const d = new Date(raw);
        if (isNaN(d.getTime())) return raw;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} - ${hh}:${min}`;
    };

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        // Ordenar por fecha descendente (asumiendo r.date es parseable)
        const sorted = [...reports].sort((a, b) => {
            const da = new Date(a.date).getTime();
            const db = new Date(b.date).getTime();
            if (isNaN(da) && isNaN(db)) return 0;
            if (isNaN(da)) return 1;
            if (isNaN(db)) return -1;
            return db - da; // más reciente primero
        });
        if (!term) return sorted;
        return sorted.filter((r) => {
            return (
                String(r.reportId || '').includes(term) ||
                String(r.id_user || '').includes(term) ||
                String(r.complainingUserId || '').includes(term) ||
                (r.postId || '').toLowerCase().includes(term) ||
                (r.reason || '').toLowerCase().includes(term) ||
                (r.comment || '').toLowerCase().includes(term) ||
                (r.reportStatus || '').toLowerCase().includes(term)
            );
        });
    }, [search, reports]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError('');
            const res =
                statusFilter === 'all'
                    ? await getAllReports()
                    : await getAllReportsByStatus(statusFilter);
            if (!res.success) throw new Error(res.message);
            setReports(Array.isArray(res.data) ? res.data : []);
            const arr = Array.isArray(res.data) ? res.data : [];
            // Pre-cargar nombres de usuarios involucrados
            const ids = new Set();
            arr.forEach(r => {
                if (r.id_user) ids.add(r.id_user);
                if (r.complainingUserId) ids.add(r.complainingUserId);
            });
            const missing = [...ids].filter(id => userNames[id] === undefined);
            if (missing.length) {
                const entries = await Promise.all(missing.map(async (uid) => {
                    const uRes = await getUserById(uid);
                    if (uRes.success && uRes.data) {
                        const first = uRes.data.name || '';
                        const last = uRes.data.surname || uRes.data.apellido || '';
                        const joined = (first + ' ' + last).trim() || uRes.data.fullName || uRes.data.email || `Usuario ${uid}`;
                        return [uid, joined];
                    }
                    return [uid, `Usuario ${uid}`];
                }));
                setUserNames(prev => ({ ...prev, ...Object.fromEntries(entries) }));
            }
        } catch (e) {
            setError(e.message || 'Error al cargar reportes');
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token || !isAdmin) {
            setError('No autorizado');
            setLoading(false);
            return;
        }
        fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, token, isAdmin]);

    const openDetails = async (reportId) => {
        const res = await getReportById(reportId);
        if (res.success) {
            setSelected(res.data);
            setAdminComment(res.data.adminComment || '');
        }
    };

    const handleMarkRevised = async () => {
        if (!selected) return;
        if (!adminComment.trim()) {
            alert('El comentario del administrador es obligatorio.');
            return;
        }
        try {
            setUpdating(true);
            const payload = { adminComment: adminComment.trim(), reportStatus: 'revised' };
            const res = await updateReport(selected.reportId, payload);
            if (!res.success) throw new Error(res.message);
            setSelected(null);
            setAdminComment('');
            await fetchReports();
        } catch (e) {
            alert(e.message || 'Error al marcar como revisado');
        } finally {
            setUpdating(false);
        }
    };

    const handleSuspendAndRevised = async () => {
        if (!selected) return;
        if (!adminComment.trim()) {
            alert('El comentario del administrador es obligatorio.');
            return;
        }
        if (!selected.complainingUserId) {
            alert('No se puede determinar el usuario denunciado.');
            return;
        }
        if (!window.confirm(`¿Suspender la cuenta del usuario denunciado (${selected.complainingUserId}) y marcar el reporte como revisado?`)) return;
        try {
            setSuspendLoading(true);
            const suspendRes = await suspendUser(selected.complainingUserId);
            if (!suspendRes.success) throw new Error(suspendRes.message);
            const payload = { adminComment: adminComment.trim(), reportStatus: 'revised' };
            const updRes = await updateReport(selected.reportId, payload);
            if (!updRes.success) throw new Error(updRes.message);
            setSelected(null);
            setAdminComment('');
            await fetchReports();
        } catch (e) {
            alert(e.message || 'Error al suspender y actualizar el reporte');
        } finally {
            setSuspendLoading(false);
        }
    };

    const handleDeletePost = async () => {
        if (!selected || !selected.postId) return;
        if (!adminComment.trim()) {
            alert('El comentario del administrador es obligatorio.');
            return;
        }
        if (!window.confirm(`¿Eliminar la publicación ${selected.postId}? Esta acción no se puede deshacer.`)) return;
        try {
            setDeleteLoading(true);
            const res = await deletePost(selected.postId);
            if (!res.success) throw new Error(res.message || 'Error al eliminar publicación');
            // marcar reporte como revisado y añadir adminComment
            const payload = { adminComment: adminComment.trim(), reportStatus: 'revised' };
            const updRes = await updateReport(selected.reportId, payload);
            if (!updRes.success) throw new Error(updRes.message || 'Error al actualizar reporte');
            setSelected(null);
            setAdminComment('');
            await fetchReports();
        } catch (e) {
            alert(e.message || 'Error al eliminar la publicación');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDelete = async (reportId) => {
        if (!window.confirm('¿Eliminar este reporte?')) return;
        const res = await deleteReport(reportId);
        if (!res.success) {
            alert(res.message || 'No se pudo eliminar');
            return;
        }
        await fetchReports();
    };

    if (!isAdmin) {
        return <p className="text-center text-red-500 mt-6">No autorizado</p>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold mb-6">Panel de Reportes</h1>

            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">Estado:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border rounded px-2 py-1"
                    >
                        <option value="all">Todos</option>
                        <option value="pending">Pendientes</option>
                        <option value="revised">Revisados</option>
                    </select>
                </div>

                <input
                    type="text"
                    placeholder="Buscar por id, user, post, razón..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border rounded px-3 py-2 flex-1"
                />

                <button
                    onClick={fetchReports}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Refrescar
                </button>
                <button onClick={() => window.location.href = '/admin/usuarios-suspendidos'} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 ml-2">Usuarios suspendidos</button>
            </div>

            {loading ? (
                <p className="text-gray-600">Cargando reportes...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : filtered.length === 0 ? (
                <p className="text-gray-600">No hay reportes.</p>
            ) : (
                <div className="overflow-x-auto bg-white rounded shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Reporte</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario denunciante</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario denunciado</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filtered.map((r) => (
                                <tr key={r.reportId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-700">{r.reportId}</td>
                                    <td className="px-4 py-3 text-sm text-blue-700 underline">
                                        <Link to={`/admin/reportes/denunciante/${r.id_user}`}>
                                            {userNames[r.id_user] || `Usuario ${r.id_user}`}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-blue-700 underline">
                                        <Link to={`/admin/reportes/denunciado/${r.complainingUserId}`}>
                                            {userNames[r.complainingUserId] || `Usuario ${r.complainingUserId}`}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-blue-700 underline"><Link to={`/mascota/${r.postId}`}>{r.postId}</Link></td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{r.reason}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{formatListDate(r.date)}</td>
                                    <td className="px-4 py-3"><span className={statusChipClass(r.reportStatus)}>{translateStatus(r.reportStatus)}</span></td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button
                                            onClick={() => openDetails(r.reportId)}
                                            className="text-sm bg-neutral-800 text-white px-3 py-1 rounded hover:bg-neutral-700"
                                        >
                                            Ver
                                        </button>
                                        <button
                                            onClick={() => handleDelete(r.reportId)}
                                            className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selected && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded shadow-xl w-full max-w-2xl p-6">
                        <h2 className="text-xl font-semibold mb-4">Detalle Reporte #{selected.reportId}</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-gray-500">Usuario denunciante</p>
                                <p className="text-gray-800"><Link className="text-blue-700 underline" to={`/admin/reportes/denunciante/${selected.id_user}`}>{userNames[selected.id_user] || `Usuario ${selected.id_user}`}</Link></p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Usuario denunciado</p>
                                <p className="text-gray-800"><Link className="text-blue-700 underline" to={`/admin/reportes/denunciado/${selected.complainingUserId}`}>{userNames[selected.complainingUserId] || `Usuario ${selected.complainingUserId}`}</Link></p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Post</p>
                                <p className="text-blue-700 break-all underline"><Link to={`/mascota/${selected.postId}`}>{selected.postId}</Link></p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Razón</p>
                                <p className="text-gray-800">{selected.reason}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Comentario</p>
                                <p className="text-gray-800 whitespace-pre-wrap">{selected.comment}</p>
                            </div>
                            {selected.adminComment && (
                                <div className="md:col-span-2">
                                    <p className="text-sm text-gray-500">Comentario Admin</p>
                                    <p className="text-gray-800 whitespace-pre-wrap">{selected.adminComment}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-500">Estado</p>
                                <span className={statusChipClass(selected.reportStatus)}>{translateStatus(selected.reportStatus)}</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Fecha</p>
                                <p className="text-gray-800">{formatDetailDate(selected.date)}</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm text-gray-700 mb-1">Comentario del administrador <span className="text-red-500">*</span></label>
                            <textarea
                                className="w-full border rounded px-3 py-2"
                                rows={3}
                                placeholder="Describí la acción tomada o justificación (obligatorio)"
                                value={adminComment}
                                onChange={(e) => setAdminComment(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setSelected(null)}
                                className="px-4 py-2 rounded border hover:bg-gray-50"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={handleSuspendAndRevised}
                                disabled={suspendLoading || updating}
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {suspendLoading ? 'Suspendiendo...' : 'Suspender cuenta'}
                            </button>
                            <button
                                onClick={handleDeletePost}
                                disabled={deleteLoading || updating}
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleteLoading ? 'Eliminando...' : 'Eliminar publicación'}
                            </button>
                            <button
                                onClick={handleMarkRevised}
                                disabled={updating || actionLoading}
                                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {updating ? 'Guardando...' : 'Marcar como revisado'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspended users moved to separate view */}
        </div>
    );
};

export default AdminReportsPage;
