import React from 'react';
import fondo from '../../assets/fondo.png';

const HeroSection = ({ onScrollToPets }) => {
  return (
    <section className="relative bg-cover bg-center h-screen flex items-center justify-center text-white" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative text-center p-6">
        <h2 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">Encontrá, reportá y adoptá</h2>
        <p className="text-xl md:text-2xl mb-8 opacity-90">Una plataforma para adopciones y mascotas perdidas o encontradas.</p>
        <button
          onClick={onScrollToPets}
          className="bg-rose-600 text-white py-3 px-8 rounded-full text-lg hover:bg-rose-500 transition-colors"
        >
          Ver mascotas
        </button>
      </div>
    </section>
  );
};

export default HeroSection;