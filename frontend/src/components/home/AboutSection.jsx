import React, { useRef } from 'react';
import { useInView } from 'framer-motion';
import * as Framer from 'framer-motion';
import logo from '../../assets/logo.png';
import logo3 from '../../assets/logo3.png';

const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <section
      id="about"
      className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-cover bg-fixed bg-center"
      style={{ backgroundImage: `url(${logo3})` }}
    >
      {/* Overlay para legibilidad (más transparente) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/30"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Framer.motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 bg-white/60 backdrop-blur-md p-6 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl shadow-2xl ring-1 ring-black/10"
        >
          {/* Imagen */}
          <Framer.motion.div
            className="md:w-1/2"
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <img
              src={logo}
              alt="Equipo RescaTeam"
              className="rounded-xl shadow-xl w-full max-w-md mx-auto ring-1 ring-black/10 hover:shadow-2xl hover:scale-[1.015] transition duration-300"
            />
          </Framer.motion.div>

          {/* Texto */}
          <Framer.motion.div
            className="md:w-1/2 space-y-6"
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-center md:text-left leading-tight">
              Sobre
              {' '}
              <span className="text-blue-600">
                RescaTeam
              </span>
            </h2>

            <p className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed">
              Conectamos personas y mascotas: ya sea para adoptar un compañero, reportar una mascota perdida o ayudar a reunir a una encontrada con su familia.
            </p>
            <p className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed">
              Publicá publicaciones de adopción, avisos de pérdida o hallazgo, y descubrí listados filtrados por categoría para actuar rápido y con información clara.
            </p>

            {/* Features */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <li className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 ring-1 ring-rose-200">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.062 3 12.747 3 10.125 3 7.753 4.86 6 7.125 6c1.3 0 2.508.528 3.375 1.47C11.367 6.528 12.575 6 13.875 6 16.14 6 18 7.753 18 10.125c0 2.622-1.688 4.937-3.989 7.382a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.218l-.022.012-.007.003-.003.002a.746.746 0 01-.712 0l-.003-.002z" />
                  </svg>
                </span>
                <span className="text-gray-800 font-medium">Adopciones responsables</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 ring-1 ring-blue-200">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2l7 4v6c0 5-3.5 9.5-7 10-3.5-.5-7-5-7-10V6l7-4zm0 6a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </span>
                <span className="text-gray-800 font-medium">Publicaciones moderadas</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C17 14.17 12.33 13 10 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5C25 14.17 20.33 13 18 13z" />
                  </svg>
                </span>
                <span className="text-gray-800 font-medium">Comunidad solidaria</span>
              </li>
            </ul>

            {/* CTA eliminado según feedback */}
          </Framer.motion.div>
        </Framer.motion.div>
      </div>
    </section>
  );
};

export default AboutSection;