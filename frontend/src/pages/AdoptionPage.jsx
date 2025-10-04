import React, { useState } from 'react';
import FilterPanel from '../components/pets/FilterPanel';
import PetList from '../components/pets/PetList';

const AdoptionPage = () => {
    const [filters, setFilters] = useState({ postType: 'adoption' });

    const handleFilterChange = (updated) => {
        setFilters(prev => ({ ...prev, ...updated, postType: 'adoption' }));
    };



    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Mascotas en Adopción</h1>
                <p className="text-gray-600">
                    Aquí encontrarás mascotas que están buscando un hogar definitivo. Puedes filtrar por especie, tamaño, zona y más.
                </p>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                    <FilterPanel onFilterChange={handleFilterChange} postType="adoption" />
                </div>
                <div className="md:col-span-3">
                    <PetList filters={filters} />
                </div>
            </div>
        </div>
    );
};

export default AdoptionPage;
