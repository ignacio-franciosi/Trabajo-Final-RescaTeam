import React, { useState } from 'react';
import FilterPanel from '../components/pets/FilterPanel';
import PetList from '../components/pets/PetList';

const FoundPage = () => {
    const [filters, setFilters] = useState({ postType: 'found' });

    const handleFilterChange = (updated) => {
        setFilters(prev => ({ ...prev, ...updated, postType: 'found' }));
    };



    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="max-w-3xl mx-auto text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Mascotas Encontradas</h1>
                <p className="text-sm sm:text-base text-gray-600">
                    Aquí encontrarás mascotas que han sido halladas. Si perdiste a tu mascota, podés buscar acá y contactar al dueño de la publicación.
                </p>
            </div>



            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="md:col-span-1">
                    <FilterPanel onFilterChange={handleFilterChange} postType="found" />
                </div>
                <div className="md:col-span-3">
                    <PetList filters={filters} />
                </div>
            </div>
        </div>
    );
};

export default FoundPage;
