import React from 'react';

const ConfirmResolvedModal = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center mb-4">
          <span className="text-green-600 text-3xl mr-2">🐾</span>
          <h2 className="text-lg font-semibold text-gray-800">
            ¿Confirmar como resuelto?
          </h2>
        </div>
        <p className="text-gray-600 mb-6">
          Al marcar esta publicación como resuelta, se eliminará del listado público. ¿Estás seguro de continuar?
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Marcar como resuelto
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmResolvedModal;
