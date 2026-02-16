import React from 'react';
import fondo from '../../assets/fondo.png';

const HeroSection = ({ onScrollToPets }) => {
  return (
    <section className="relative bg-cover bg-center min-h-[70vh] sm:h-screen flex items-center justify-center text-white" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative text-center px-4 sm:px-6 py-8 sm:py-0 max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 sm:mb-4 leading-tight">Encontrá, reportá y adoptá</h2>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 opacity-90 px-2">Una plataforma para adopciones y mascotas perdidas o encontradas.</p>
        <button
          onClick={onScrollToPets}
          className="bg-rose-600 text-white py-2.5 sm:py-3 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-rose-500 transition-colors shadow-lg"
        >
          Ver mascotas
        </button>
      </div>
    </section>
  );
};

export default HeroSection;