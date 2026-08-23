import React from 'react';

const SuspendedNotice = ({ small = false }) => {
    return (
        <div className={`rounded-lg border border-red-300 bg-red-50 text-red-700 ${small ? 'p-3 text-sm' : 'p-6'} shadow-sm max-w-3xl mx-auto my-8`}>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="inline-block w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">!</span>
                Cuenta suspendida
            </h3>
            <p className="leading-snug">
                Tu cuenta se encuentra suspendida temporalmente. Podés navegar y ver publicaciones, pero no realizar acciones como crear, editar, eliminar o reportar.
            </p>
            <p className="mt-2 text-xs opacity-80">
                Si creés que esto es un error escribinos a <span className="underline">rescateam2025@gmail.com</span>.
            </p>
        </div>
    );
};

export default SuspendedNotice;
