import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPosts } from '../../services/PostService';

const HeartIcon = ({ className = 'w-16 h-16 text-emerald-600' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.062 3 12.747 3 10.125 3 7.753 4.86 6 7.125 6c1.3 0 2.508.528 3.375 1.47C11.367 6.528 12.575 6 13.875 6 16.14 6 18 7.753 18 10.125c0 2.622-1.688 4.937-3.989 7.382a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.218l-.022.012-.007.003-.003.002a.746.746 0 01-.712 0l-.003-.002z" />
    </svg>
);

const SearchIcon = ({ className = 'w-16 h-16 text-red-600' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

// Nuevo icono de hogar (estilo sólido)
const HomeSolidIcon = ({ className = 'w-16 h-16 text-blue-600' }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <path d="M3 10.5l9-7 9 7V20a2 2 0 01-2 2h-4v-6H9v6H5a2 2 0 01-2-2v-9.5z" />
    </svg>
);

const Card = ({ title, description, actionLabel, to, colorClass, borderColor, badgeColor, icon, count, countSuffix }) => {
    const navigate = useNavigate();
    return (
        <div className={`rounded-xl shadow-md p-6 bg-white border-t-4 ${borderColor} text-center flex flex-col items-center`}>
            <div className="mb-3">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-gray-600 mb-2">{description}</p>
            <p className="text-sm text-gray-500 mb-4">
                {typeof count === 'number'
                    ? <>
                        <span className="font-semibold">{count}</span> mascotas {countSuffix}
                    </>
                    : 'Cargando…'}
            </p>
            <button
                onClick={() => navigate(to)}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                {actionLabel}
            </button>
        </div>
    );
};

const CategoryCards = () => {
    const [counts, setCounts] = useState({ adoption: null, lost: null, found: null });

    useEffect(() => {
        let mounted = true;
        const fetchCounts = async () => {
            try {
                const [adoptRes, lostRes, foundRes] = await Promise.all([
                    getAllPosts('adoption'),
                    getAllPosts('lost'),
                    getAllPosts('found'),
                ]);
                if (!mounted) return;
                setCounts({
                    adoption: Array.isArray(adoptRes.data) ? adoptRes.data.length : 0,
                    lost: Array.isArray(lostRes.data) ? lostRes.data.length : 0,
                    found: Array.isArray(foundRes.data) ? foundRes.data.length : 0,
                });
            } catch {
                if (!mounted) return;
                setCounts({ adoption: 0, lost: 0, found: 0 });
            }
        };
        fetchCounts();
        return () => { mounted = false; };
    }, []);

    return (
        <section id="pets-list" className="container mx-auto px-4 py-10">
            <h2 className="text-3xl font-bold text-center mb-8">Explora por categoría</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                    title="Adopción"
                    description="Encontrá a tu nuevo mejor amigo entre las mascotas que buscan un hogar."
                    actionLabel="Ver adopciones"
                    to="/adopcion"
                    borderColor="border-emerald-500"
                    badgeColor="bg-emerald-500"
                    icon={<HeartIcon />}
                    count={counts.adoption}
                    countSuffix="en adopción"
                />
                <Card
                    title="Perdidos"
                    description="Reportá y buscá mascotas perdidas en tu zona para acelerar el reencuentro."
                    actionLabel="Ver perdidos"
                    to="/perdidos"
                    borderColor="border-red-500"
                    badgeColor="bg-red-500"
                    icon={<SearchIcon />}
                    count={counts.lost}
                    countSuffix="perdidas"
                />
                <Card
                    title="Encontrados"
                    description="Publicá mascotas que encontraste o revisá reportes para ayudar a que vuelvan a casa."
                    actionLabel="Ver encontrados"
                    to="/encontrados"
                    borderColor="border-blue-500"
                    badgeColor="bg-blue-500"
                    icon={<HomeSolidIcon />}
                    count={counts.found}
                    countSuffix="encontradas"
                />
            </div>
        </section>
    );
};

export default CategoryCards;
