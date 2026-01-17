import React, { useState, useEffect } from 'react';
import FilterPanel from '../components/pets/FilterPanel';
import PetList from '../components/pets/PetList';

const LostPage = () => {
    const [filters, setFilters] = useState({ postType: 'lost' });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleFilterChange = (updated) => {
        setFilters(prev => ({ ...prev, ...updated, postType: 'lost' }));
    };



    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Mascotas Perdidas</h1>
                <p className="text-gray-600">
                    Si perdiste tu mascota o encontraste una similar, revisa estas publicaciones. Usa los filtros para acotar la búsqueda por zona, especie y más.
                </p>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                    <FilterPanel onFilterChange={handleFilterChange} postType="lost" />
                </div>
                <div className="md:col-span-3">
                    <PetList filters={filters} />
                </div>
            </div>
        </div>
    );
};

export default LostPage;
