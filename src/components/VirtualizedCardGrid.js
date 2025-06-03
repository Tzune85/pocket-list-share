import React, { useCallback } from 'react';
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { LazyImage } from './LazyImage';

const CARD_WIDTH = 200; // Larghezza fissa per ogni carta
const CARD_HEIGHT = 285; // Altezza fissa per ogni carta (inclusi i dettagli)
const GRID_GAP = 16; // Spazio tra le carte

export const VirtualizedCardGrid = ({ 
    cards, 
    userCollection, 
    onQuantityChange,
    isEditable = true 
}) => {
    // Calcola il numero di colonne in base alla larghezza disponibile
    const getColumnCount = (width) => {
        return Math.floor((width + GRID_GAP) / (CARD_WIDTH + GRID_GAP));
    };

    // Calcola il numero di righe necessarie
    const getRowCount = (columnCount) => {
        return Math.ceil(cards.length / columnCount);
    };

    // Renderizza una singola cella della griglia
    const Cell = useCallback(({ columnIndex, rowIndex, style, data }) => {
        const { cards, columnCount } = data;
        const index = rowIndex * columnCount + columnIndex;
        
        if (index >= cards.length) {
            return null;
        }

        const card = cards[index];
        const quantity = userCollection[card.id] || 0;

        // Aggiorniamo lo stile della cella per un layout migliore
        const cellStyle = {
            ...style,
            left: Number(style.left) + GRID_GAP / 2,
            top: Number(style.top) + GRID_GAP / 2,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            padding: 0,
        };

        return (
            <div style={cellStyle} className="flex flex-col">
                <div className="bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-2 h-full">
                    {card.image && (
                        <div className="relative w-full pt-[100%] mb-2">
                            <LazyImage
                                src={`${card.image}/high.png`}
                                alt={card.cardName}
                                className="absolute inset-0 w-full h-full object-contain rounded-lg"
                            />
                        </div>
                    )}
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-gray-800 truncate">
                            {card.cardName}
                            <span className="text-xs text-gray-500 ml-1">#{card.localId}</span>
                        </h3>
                        <p className="text-xs text-gray-600">{card.setName}</p>
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-gray-600">Quantità:</label>
                            {isEditable ? (
                                <input
                                    type="number"
                                    min="0"
                                    value={quantity}
                                    onChange={(e) => onQuantityChange(card.id, parseInt(e.target.value, 10) || 0)}
                                    className="w-16 p-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-center text-sm"
                                />
                            ) : (
                                <span className="text-sm font-medium text-gray-900">{quantity}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [userCollection, onQuantityChange, isEditable]);

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 300px)' }}> {/* Altezza regolabile in base alle necessità */}
            <AutoSizer>
                {({ height, width }) => {
                    const columnCount = getColumnCount(width);
                    const rowCount = getRowCount(columnCount);

                    return (
                        <FixedSizeGrid
                            className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
                            columnCount={columnCount}
                            columnWidth={CARD_WIDTH + GRID_GAP}
                            height={height}
                            rowCount={rowCount}
                            rowHeight={CARD_HEIGHT + GRID_GAP}
                            width={width}
                            itemData={{ cards, columnCount }}
                            overscanRowCount={2}
                            style={{ padding: `${GRID_GAP / 2}px` }}
                        >
                            {Cell}
                        </FixedSizeGrid>
                    );
                }}
            </AutoSizer>
        </div>
    );
}; 