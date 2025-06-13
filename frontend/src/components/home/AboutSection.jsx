import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import logo from '../../assets/logo.png';
import logo3 from '../../assets/logo3.png';

const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <section 
      id="about" 
      className="relative py-24 bg-cover bg-fixed bg-center"
      style={{ backgroundImage: `url(${logo3})` }}
    >
      {/* Overlay para mejor legibilidad */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row items-center gap-12 bg-white/70 backdrop-blur-sm p-8 rounded-xl shadow-2xl"
        >
          <motion.div 
            className="md:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img 
              src={logo}
              alt="Equipo RescaTeam" 
              className="rounded-lg shadow-lg w-full max-w-md mx-auto hover:scale-105 transition-transform duration-300"
            />
          </motion.div>
          
          <motion.div 
            className="md:w-1/2 space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h2 className="text-4xl font-bold text-gray-800 text-center font-serif">
              Sobre <span className="text-rose-600">RescaTeam</span>
            </h2>
            
            <div className="space-y-4">
              <p className="text-gray-700 text-lg text-justify leading-relaxed">
                Somos un equipo apasionado por el bienestar animal, dedicados a conectar mascotas sin hogar con familias amorosas. Creemos que cada animal merece una segunda oportunidad y un hogar para siempre.
              </p>
              <p className="text-gray-700 text-lg text-justify leading-relaxed">
                Nuestra plataforma facilita el proceso de adopción, permitiendo a refugios y particulares publicar mascotas disponibles y a futuros adoptantes encontrar a su compañero ideal de forma sencilla y segura.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;