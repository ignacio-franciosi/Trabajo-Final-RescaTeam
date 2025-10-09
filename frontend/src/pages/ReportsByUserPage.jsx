import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getReportsByUserId, getReportsByComplainingUserId, updateReport } from '../services/ReportService';
import { suspendUser, getUserById, reactivateUser } from '../services/UserService';
import { useAuth } from '../context/AuthContext';

const statusChipClass = (status) => {
    const base = 'px-2 py-1 rounded-full text-xs font-semibold';
    if (status === 'pending') return `${base} bg-yellow-100 text-yellow-800`;
    if (status === 'revised') return `${base} bg-green-100 text-green-800`;
    return `${base} bg-gray-100 text-gray-700`;
};
const translateStatus = (s) => (s === 'pending' ? 'Pendiente' : s === 'revised' ? 'Revisado' : s);

const formatDate = (raw) => {
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

// Determina modo según pathname: /admin/reportes/denunciante/:id o /admin/reportes/denunciado/:id
const ReportsByUserPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const { token, user, setAuth } = useAuth();

    const isReporter = location.pathname.includes('/denunciante/');
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [userNames, setUserNames] = useState({});
    const [profileUser, setProfileUser] = useState(null);

    // Modal / acciones
    const [selected, setSelected] = useState(null);
    const [adminComment, setAdminComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [reactivating, setReactivating] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!token || !user?.type) { // sólo admin
                setError('No autorizado');
                setLoading(false);
                return;
            }
            setLoading(true);
            setError('');
            const fn = isReporter ? getReportsByUserId : getReportsByComplainingUserId;
            const res = await fn(id);
            if (!res.success) {
                setError(res.message || 'Error al cargar reportes');
                setReports([]);
            } else {
                const arr = Array.isArray(res.data) ? res.data : [];
                setReports(arr);
                // Pre-cargar nombres
                const ids = new Set();
                arr.forEach(r => {
                    if (r.id_user) ids.add(r.id_user);
                    if (r.complainingUserId) ids.add(r.complainingUserId);
                });
                const missing = [...ids].filter(uid => userNames[uid] === undefined);
                if (missing.length) {
                    const entries = await Promise.all(missing.map(async uid => {
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
            }
            // También traer datos completos del usuario para mostrar arriba
            try {
                const pRes = await getUserById(id);
                if (pRes.success && pRes.data) setProfileUser(pRes.data);
            } catch { }
            setLoading(false);
        };
        fetchData();
    }, [id, isReporter, token, user]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return reports;
        return reports.filter(r =>
            String(r.reportId || '').includes(term) ||
            String(r.id_user || '').includes(term) ||
            String(r.complainingUserId || '').includes(term) ||
            (r.postId || '').toLowerCase().includes(term) ||
            (r.reason || '').toLowerCase().includes(term) ||
            (r.comment || '').toLowerCase().includes(term) ||
            (r.reportStatus || '').toLowerCase().includes(term)
        );
    }, [reports, search]);

    const title = isReporter ? `Reportes hechos por ${profileUser ? (profileUser.name + ' ' + profileUser.surname).trim() : ('usuario ' + id)}` : `Reportes contra ${profileUser ? (profileUser.name + ' ' + profileUser.surname).trim() : ('usuario ' + id)}`;

    const openModal = (report) => {
        setSelected(report);
        setAdminComment(report.adminComment || '');
        setFeedback('');
    };

    const closeModal = () => {
        setSelected(null);
        setAdminComment('');
        setActionLoading(false);
        setFeedback('');
    };

    const handleMarkRevised = async () => {
        if (!selected) return;
        if (!adminComment.trim()) {
            setFeedback('El comentario de admin es obligatorio');
            return;
        }
        try {
            setActionLoading(true);
            const res = await updateReport(selected.reportId, { adminComment: adminComment.trim(), reportStatus: 'revised' });
            if (!res.success) throw new Error(res.message);
            setReports(prev => prev.map(r => r.reportId === selected.reportId ? { ...r, adminComment: adminComment.trim(), reportStatus: 'revised' } : r));
            setFeedback('Reporte marcado como revisado');
            setTimeout(closeModal, 800);
        } catch (e) {
            setFeedback(e.message || 'Error al actualizar');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSuspend = async () => {
        if (!selected) return;
        if (!adminComment.trim()) {
            setFeedback('El comentario de admin es obligatorio');
            return;
        }
        try {
            setActionLoading(true);
            // Suspender usuario denunciado (complainingUserId)
            const susRes = await suspendUser(selected.complainingUserId, { reason: adminComment.trim() });
            if (!susRes.success) throw new Error(susRes.message);
            const updRes = await updateReport(selected.reportId, { adminComment: adminComment.trim(), reportStatus: 'revised' });
            if (!updRes.success) throw new Error(updRes.message);
            setReports(prev => prev.map(r => r.reportId === selected.reportId ? { ...r, adminComment: adminComment.trim(), reportStatus: 'revised' } : r));
            setFeedback('Usuario suspendido y reporte revisado');
            setTimeout(closeModal, 1000);
        } catch (e) {
            setFeedback(e.message || 'Error en la acción');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{title}</h1>
                <Link to="/admin/reportes" className="text-sm text-blue-600 hover:underline">Volver al panel</Link>
            </div>

            <div className="mb-4 flex gap-3">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="border rounded px-3 py-2 flex-1"
                />
            </div>

            {loading ? (
                <p>Cargando...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <>
                    <div className="mb-4 p-4 bg-white rounded shadow">
                        {profileUser ? (
                            <div>
                                <p className="text-sm text-gray-500">ID</p>
                                <p className="text-gray-800 mb-2">{profileUser.id_user || profileUser.userId || id}</p>
                                <p className="text-sm text-gray-500">Nombre</p>
                                <p className="text-gray-800">{(profileUser.name || '') + ' ' + (profileUser.surname || '')}</p>
                                <p className="text-sm text-gray-500 mt-2">DNI</p>
                                <p className="text-gray-800">{profileUser.dni || profileUser.DNI || '-'}</p>
                                <p className="text-sm text-gray-500 mt-2">Email</p>
                                <p className="text-gray-800">{profileUser.email || '-'}</p>
                                {profileUser.suspended && user?.type === 'admin' && (
                                    <div className="mt-4">
                                        <button
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                            onClick={async () => {
                                                try {
                                                    setReactivating(true);
                                                    const res = await reactivateUser(profileUser.userId || profileUser.id_user || id);
                                                    if (!res.success) throw new Error(res.message || 'Error al reactivar');
                                                    // Si el backend devolvió token y es el mismo usuario que está logueado,
                                                    // actualizamos el token y user en el AuthContext/localStorage
                                                    if (res.data && res.data.token) {
                                                        const returnedUserId = res.data.id_user || res.data.userId || null;
                                                        // si el usuario reactivado es el mismo que el logueado, actualizar credenciales
                                                        if (user && (user.userId === returnedUserId || user.userId === Number(id))) {
                                                            const newUser = { userId: returnedUserId, type: res.data.type || user.type, suspended: res.data.suspended || false };
                                                            setAuth(res.data.token, newUser);
                                                        }
                                                    }
                                                    // actualizar estado local de perfil
                                                    setProfileUser(prev => ({ ...prev, suspended: false }));
                                                    setFeedback('Usuario reactivado exitosamente');
                                                } catch (e) {
                                                    setFeedback(e.message || 'Error al reactivar usuario');
                                                } finally {
                                                    setReactivating(false);
                                                    setTimeout(() => setFeedback(''), 2500);
                                                }
                                            }}
                                            disabled={reactivating}
                                        >
                                            {reactivating ? 'Procesando...' : 'Reactivar cuenta'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-700">Usuario {id}</p>
                        )}
                    </div>

                    {filtered.length === 0 ? (
                        <p>No hay reportes.</p>
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
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filtered.map(r => (
                                        <tr key={r.reportId} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700">{r.reportId}</td>
                                            <td className="px-4 py-3 text-sm text-blue-700 underline"><Link to={`/admin/reportes/denunciante/${r.id_user}`}>{userNames[r.id_user] || `Usuario ${r.id_user}`}</Link></td>
                                            <td className="px-4 py-3 text-sm text-blue-700 underline"><Link to={`/admin/reportes/denunciado/${r.complainingUserId}`}>{userNames[r.complainingUserId] || `Usuario ${r.complainingUserId}`}</Link></td>
                                            <td className="px-4 py-3 text-sm text-blue-700 underline"><Link to={`/mascota/${r.postId}`}>{r.postId}</Link></td>
                                            <td className="px-4 py-3 text-sm text-gray-700 cursor-pointer" onClick={() => openModal(r)} title="Ver / Acciones">{r.reason}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{formatDate(r.date)}</td>
                                            <td className="px-4 py-3"><span className={statusChipClass(r.reportStatus)}>{translateStatus(r.reportStatus)}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {selected && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                            <div className="bg-white rounded-lg shadow max-w-lg w-full p-6 relative">
                                <button onClick={closeModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">✕</button>
                                <h2 className="text-lg font-semibold mb-4">Reporte #{selected.reportId}</h2>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Usuario denunciante</p>
                                        <p className="text-gray-800"><Link className="text-blue-700 underline" to={`/admin/reportes/denunciante/${selected.id_user}`}>{userNames[selected.id_user] || `Usuario ${selected.id_user}`}</Link></p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Usuario denunciado</p>
                                        <p className="text-gray-800"><Link className="text-blue-700 underline" to={`/admin/reportes/denunciado/${selected.complainingUserId}`}>{userNames[selected.complainingUserId] || `Usuario ${selected.complainingUserId}`}</Link></p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Post</p>
                                        <p className="text-blue-700 underline"><Link to={`/mascota/${selected.postId}`}>{selected.postId}</Link></p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Razón</p>
                                        <p className="text-gray-800 whitespace-pre-line">{selected.reason}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Comentario Usuario</p>
                                        <p className="text-gray-800 whitespace-pre-line">{selected.comment || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 mb-1">Comentario Admin (obligatorio para acciones)</p>
                                        <textarea
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            rows={3}
                                            value={adminComment}
                                            onChange={e => setAdminComment(e.target.value)}
                                            placeholder="Ingresá tu comentario de moderación"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            disabled={actionLoading}
                                            onClick={handleMarkRevised}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
                                            {actionLoading ? 'Procesando...' : 'Marcar Revisado'}
                                        </button>
                                        <button
                                            disabled={actionLoading}
                                            onClick={handleSuspend}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
                                            {actionLoading ? 'Procesando...' : 'Suspender Usuario'}
                                        </button>
                                        <button onClick={closeModal} className="px-4 py-2 text-sm rounded border">Cerrar</button>
                                    </div>
                                    {feedback && <p className="text-sm mt-1 text-blue-600">{feedback}</p>}
                                    {selected.reportStatus === 'revised' && (
                                        <div className="text-xs text-gray-500">Ya revisado. Podés actualizar el comentario.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ReportsByUserPage;
