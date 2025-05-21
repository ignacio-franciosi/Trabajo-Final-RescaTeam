import React from 'react';

const HeroSection = ({ onScrollToPets }) => {
  return (
    <section className="relative bg-cover bg-center h-screen flex items-center justify-center text-white" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1543466835-0991b9c76b01?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80')" }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative text-center p-6">
        <h2 className="text-4xl md:text-6xl font-bold mb-4">Encuentra a tu nuevo mejor amigo</h2>
        <p className="text-xl md:text-2xl mb-8">Adopta, no compres. Cambia una vida.</p>
        <button
          onClick={onScrollToPets}
          className="bg-blue-600 text-white py-3 px-8 rounded-full text-lg hover:bg-blue-700 transition-colors"
        >
          Ver Mascotas en Adopción
        </button>
      </div>
    </section>
  );
};

export default HeroSection;