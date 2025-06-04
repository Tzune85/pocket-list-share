import React from 'react';
import { LazyImage } from './LazyImage';

export const ImageModal = ({ card, onClose }) => {
    if (!card) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg p-4 max-w-sm w-full"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 truncate pr-4">
                        {card.cardName}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="relative w-full pt-[100%]">
                    <LazyImage
                        src={`${card.image}/high.png`}
                        alt={card.cardName}
                        className="absolute inset-0 w-full h-full object-contain rounded-lg"
                    />
                </div>
                <div className="mt-4 text-sm text-gray-600">
                    <p>Set: {card.setName}</p>
                    <p>Numero: #{card.localId}</p>
                </div>
            </div>
        </div>
    );
}; 