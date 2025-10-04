import React, { useState } from 'react';
import FilterPanel from '../components/pets/FilterPanel';
import PetList from '../components/pets/PetList';

const FoundPage = () => {
    const [filters, setFilters] = useState({ postType: 'found' });

    const handleFilterChange = (updated) => {
        setFilters(prev => ({ ...prev, ...updated, postType: 'found' }));
    };



    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Mascotas Encontradas</h1>
                <p className="text-gray-600">
                    Publicaciones de mascotas encontradas por la comunidad. Si reconoces a tu mascota, contacta al publicante.
                </p>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
