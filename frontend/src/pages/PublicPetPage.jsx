import React from 'react';
import { useNavigate } from 'react-router-dom';

const cards = [
  {
    type: 'adoption',
    title: 'Dar en Adopción',
    description: 'Publicá una mascota que está buscando un hogar responsable. Podés indicar su edad, estado de castración y vacunas.',
    route: '/publicar/adopcion'
  },
  {
    type: 'lost',
    title: 'Mascota Perdida',
    description: 'Te ayudamos a encontrar tu mascota. Detallá la zona, características visibles, si tenía collar y cualquier dato útil.',
    route: '/publicar/perdido'
  },
  {
    type: 'found',
    title: 'Mascota Encontrada',
    description: 'Informá que encontraste una mascota para reunirla con su familia. Indicá zona, apariencia y si tenía collar.',
    route: '/publicar/encontrado'
  },
];

const PublicPetPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen py-12 px-4 bg-stone-200">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">¿Qué querés publicar?</h1>
        <p className="text-center text-gray-600 mb-10">Elegí el tipo de publicación para guiarte con los campos adecuados.</p>
        <div className="grid gap-6 md:grid-cols-3">
          {cards.map(card => (
            <button
              key={card.type}
              onClick={() => navigate(card.route)}
              className="relative group text-left bg-white rounded-xl shadow hover:shadow-lg p-6 transition border border-transparent hover:border-blue-500"
            >
              <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600">{card.title}</h2>
              <p className="text-sm text-gray-600 leading-snug">{card.description}</p>
              <span className="inline-block mt-4 text-blue-600 font-medium group-hover:underline">Continuar →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicPetPage;
