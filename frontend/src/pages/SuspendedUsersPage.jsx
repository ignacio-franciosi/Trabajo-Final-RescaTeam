import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSuspendedUsers, reactivateUser } from '../services/UserService';
import { getAllReportsByStatus } from '../services/ReportService';

const SuspendedUsersPage = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [suspendedUsers, setSuspendedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const res = await getSuspendedUsers();
                if (!res.success) throw new Error(res.message || 'Error');
                setSuspendedUsers(Array.isArray(res.data) ? res.data : []);
            } catch (e) {
                console.error('Error loading suspended users', e);
                alert(e.message || 'Error al cargar usuarios suspendidos');
            } finally {
                setLoading(false);
            }
        };
        if (token && user?.type) fetch();
    }, [token, user]);

    const handleReactivate = async (uid) => {
        if (!window.confirm(`Reactivar cuenta del usuario ${uid}?`)) return;
        try {
            const res = await reactivateUser(uid);
            if (!res.success) throw new Error(res.message || 'Error');
            alert('Usuario reactivado');
            // refresh list
            const refreshed = await getSuspendedUsers();
            setSuspendedUsers(Array.isArray(refreshed.data) ? refreshed.data : []);
        } catch (e) {
            console.error('Error reactivating', e);
            alert(e.message || 'Error al reactivar usuario');
        }
    };

    if (!user?.type) return <p className="text-center text-red-500 mt-6">No autorizado</p>;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Usuarios suspendidos</h1>
                <button onClick={() => navigate('/admin/reportes')} className="px-3 py-1 rounded border">Volver a reportes</button>
            </div>

            {loading ? (
                <p>Cargando usuarios suspendidos...</p>
            ) : suspendedUsers.length === 0 ? (
                <p>No hay usuarios suspendidos.</p>
            ) : (
                <div className="space-y-3">
                    {suspendedUsers.map(u => (
                        <div key={u.id_user || u.userId} className="p-4 border rounded flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-500">ID</div>
                                <div className="text-gray-800">{u.id_user || u.userId}</div>
                                <div className="text-sm text-gray-500">Nombre</div>
                                <div className="text-gray-800">{(u.name || '') + ' ' + (u.surname || '')}</div>
                                <div className="text-sm text-gray-500">Email</div>
                                <div className="text-gray-800">{u.email}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link to={`/admin/reportes/denunciado/${u.id_user || u.userId}`} className="text-sm bg-neutral-800 text-white px-3 py-1 rounded hover:bg-neutral-700">Ver reportes</Link>
                                <button onClick={() => handleReactivate(u.id_user || u.userId)} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Reactivar cuenta</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SuspendedUsersPage;
