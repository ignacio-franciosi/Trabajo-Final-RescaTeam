import React from 'react';

const ConfirmDeleteModal = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-96 text-center">
        <h3 className="text-lg font-bold mb-4">¿Estás seguro?</h3>
        <p className="mb-6 text-sm text-gray-600">
          Esta acción eliminará la publicación y todas sus imágenes asociadas. No podrás recuperarla.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
