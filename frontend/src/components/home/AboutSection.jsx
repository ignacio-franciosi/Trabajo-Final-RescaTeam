import React from 'react';

const AboutSection = () => {
  return (
    <section id="about" className="py-16 bg-gray-100">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
        <div className="md:w-1/2">
          <img 
            src="https://images.unsplash.com/photo-1598875980000-800520000000?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80" 
            alt="Equipo RescaTeam" 
            className="rounded-lg shadow-md"
          />
        </div>
        <div className="md:w-1/2 space-y-4">
          <h2 className="text-3xl font-bold text-gray-800">Sobre RescaTeam</h2>
          <p className="text-gray-600">
            Somos un equipo apasionado por el bienestar animal, dedicados a conectar mascotas sin hogar con familias amorosas. Creemos que cada animal merece una segunda oportunidad y un hogar para siempre.
          </p>
          <p className="text-gray-600">
            Nuestra plataforma facilita el proceso de adopción, permitiendo a refugios y particulares publicar mascotas disponibles y a futuros adoptantes encontrar a su compañero ideal de forma sencilla y segura.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;