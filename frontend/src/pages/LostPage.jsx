import React, { useState } from 'react';
import FilterPanel from '../components/pets/FilterPanel';
import PetList from '../components/pets/PetList';

const LostPage = () => {
    const [filters, setFilters] = useState({ postType: 'lost' });

    const handleFilterChange = (updated) => {
        setFilters(prev => ({ ...prev, ...updated, postType: 'lost' }));
    };



    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="max-w-3xl mx-auto text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Mascotas Perdidas</h1>
                <p className="text-sm sm:text-base text-gray-600">
                    Si perdiste tu mascota o encontraste una similar, revisa estas publicaciones. Usa los filtros para acotar la búsqueda por zona, especie y más.
                </p>
            </div>



            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="lg:col-span-1">
                    <FilterPanel onFilterChange={handleFilterChange} postType="lost" />
                </div>
                <div className="lg:col-span-3">
                    <PetList filters={filters} />
                </div>
            </div>
        </div>
    );
};

export default LostPage;
