import React from 'react';
import LostFoundForm from '../components/pets/LostFoundForm';

const PublicLostPage = () => {
    return (
        <div className="min-h-screen py-10 px-4 bg-stone-200">
            <LostFoundForm type="lost" />
        </div>
    );
};

export default PublicLostPage;
