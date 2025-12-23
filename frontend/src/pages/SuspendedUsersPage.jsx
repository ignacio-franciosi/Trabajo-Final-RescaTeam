import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSuspendedUsers, reactivateUser } from '../services/UserService';

const SuspendedUsersPage = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [suspendedUsers, setSuspendedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    // Filtrar usuarios según el término de búsqueda
    const filteredUsers = suspendedUsers.filter(u => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${u.name || ''} ${u.surname || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const userId = String(u.id_user || u.userId || '');

        return fullName.includes(searchLower) ||
            email.includes(searchLower) ||
            userId.includes(searchLower);
    });

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Usuarios suspendidos</h1>
                <button onClick={() => navigate('/admin/reportes')} className="px-3 py-1 rounded border">Volver a reportes</button>
            </div>

            {loading ? (
                <p>Cargando usuarios suspendidos...</p>
            ) : (
                <>
                    {/* Buscador */}
                    <div className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar por nombre, email o ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        {searchTerm && (
                            <p className="text-sm text-gray-600 mt-2">
                                Mostrando {filteredUsers.length} de {suspendedUsers.length} usuarios
                            </p>
                        )}
                    </div>

                    {filteredUsers.length === 0 ? (
                        <p className="text-center text-gray-500">
                            {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda.' : 'No hay usuarios suspendidos.'}
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {filteredUsers.map(u => (
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
                </>
            )}
        </div>
    );
};

export default SuspendedUsersPage;
