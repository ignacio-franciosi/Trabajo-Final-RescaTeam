import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getAllReports,
    getAllReportsByStatus,
    updateReport,
    deleteReport,
    getReportById
} from '../services/ReportService';

const statusChipClass = (status) =>
    `px-2 py-1 rounded-full text-xs font-semibold ${status === 'pending'
        ? 'bg-yellow-100 text-yellow-800'
        : status === 'revised'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-700'
    }`;

const AdminReportsPage = () => {
    const { user, token } = useAuth();
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'revised'
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [adminComment, setAdminComment] = useState('');
    const [updating, setUpdating] = useState(false);

    const isAdmin = !!user?.type; // según TokenVerificationResponse.type

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return reports;
        return reports.filter((r) => {
            return (
                String(r.reportId || '').includes(term) ||
                String(r.id_user || '').includes(term) ||
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

    const handleUpdate = async () => {
        if (!selected) return;
        try {
            setUpdating(true);
            const payload = { adminComment, reportStatus: 'revised' };
            const res = await updateReport(selected.reportId, payload);
            if (!res.success) throw new Error(res.message);
            setSelected(null);
            setAdminComment('');
            await fetchReports();
        } catch (e) {
            alert(e.message || 'Error al actualizar el reporte');
        } finally {
            setUpdating(false);
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
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filtered.map((r) => (
                                <tr key={r.reportId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-700">{r.reportId}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{r.id_user}</td>
                                    <td className="px-4 py-3 text-sm text-blue-700">{r.postId}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{r.reason}</td>
                                    <td className="px-4 py-3"><span className={statusChipClass(r.reportStatus)}>{r.reportStatus}</span></td>
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
                                <p className="text-sm text-gray-500">Usuario</p>
                                <p className="text-gray-800">{selected.id_user}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Post</p>
                                <p className="text-blue-700 break-all">{selected.postId}</p>
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
                                <span className={statusChipClass(selected.reportStatus)}>{selected.reportStatus}</span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Fecha</p>
                                <p className="text-gray-800">{selected.date}</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm text-gray-700 mb-1">Comentario del administrador</label>
                            <textarea
                                className="w-full border rounded px-3 py-2"
                                rows={3}
                                placeholder="Escribe un comentario (opcional)"
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
                                onClick={handleUpdate}
                                disabled={updating}
                                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {updating ? 'Guardando...' : 'Marcar como revisado'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReportsPage;
