import React, { useState } from 'react';

export const BuggyCounter = () => {
    const [counter, setCounter] = useState(0);

    const handleClick = () => {
        setCounter(prevCounter => {
            // Generiamo intenzionalmente un errore quando il contatore raggiunge 5
            if (prevCounter === 4) {
                throw new Error('Crash simulato! Il contatore ha raggiunto 5!');
            }
            return prevCounter + 1;
        });
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">
                Componente Test per ErrorBoundary
            </h3>
            <p className="mb-4">
                Contatore: {counter}
            </p>
            <button
                onClick={handleClick}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
                Incrementa Contatore
            </button>
            <p className="mt-4 text-sm text-gray-600">
                (Il componente crasherà quando il contatore raggiunge 5)
            </p>
        </div>
    );
}; 