import React, { useCallback, useMemo } from 'react';
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { LazyImage } from './LazyImage';

// Dimensioni base per desktop
const BASE_CARD_WIDTH = 200;
const BASE_CARD_HEIGHT = 285;
const GRID_GAP = 16;

// Dimensioni minime per mobile
const MIN_CARD_WIDTH = 150;
const MIN_CARD_HEIGHT = 220;

export const VirtualizedCardGrid = ({ 
    cards, 
    userCollection, 
    onQuantityChange,
    isEditable = true 
}) => {
    // Calcola le dimensioni delle carte in base alla larghezza dello schermo
    const getCardDimensions = useCallback((width) => {
        // Se la larghezza è inferiore a 640px (breakpoint sm di Tailwind)
        if (width < 640) {
            // Calcola quante carte possono stare in una riga con MIN_CARD_WIDTH
            const possibleColumns = Math.floor((width + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP));
            // Calcola la larghezza effettiva della carta
            const actualCardWidth = Math.floor((width - (GRID_GAP * (possibleColumns - 1))) / possibleColumns);
            // Calcola l'altezza proporzionale
            const actualCardHeight = Math.floor(actualCardWidth * (MIN_CARD_HEIGHT / MIN_CARD_WIDTH));
            return { cardWidth: actualCardWidth, cardHeight: actualCardHeight };
        }
        return { cardWidth: BASE_CARD_WIDTH, cardHeight: BASE_CARD_HEIGHT };
    }, []);

    // Calcola il numero di colonne in base alla larghezza disponibile
    const getColumnCount = useCallback((width) => {
        const { cardWidth } = getCardDimensions(width);
        return Math.floor((width + GRID_GAP) / (cardWidth + GRID_GAP));
    }, [getCardDimensions]);

    // Calcola il numero di righe necessarie
    const getRowCount = useCallback((columnCount) => {
        return Math.ceil(cards.length / columnCount);
    }, [cards.length]);

    // Renderizza una singola cella della griglia
    const Cell = useCallback(({ columnIndex, rowIndex, style, data }) => {
        const { cards, columnCount, dimensions } = data;
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
            width: dimensions.cardWidth,
            height: dimensions.cardHeight,
            padding: 0,
        };

        const imageSize = Math.min(dimensions.cardWidth - 16, dimensions.cardHeight - 100);

        return (
            <div style={cellStyle} className="flex flex-col">
                <div className="bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-2 h-full">
                    {card.image && (
                        <div className="relative mb-2" style={{ width: '100%', height: imageSize, minHeight: imageSize }}>
                            <LazyImage
                                src={`${card.image}/high.png`}
                                alt={card.cardName}
                                className="absolute inset-0 w-full h-full object-contain rounded-lg"
                            />
                        </div>
                    )}
                    <div className="space-y-1 text-xs sm:text-sm">
                        <h3 className="font-semibold text-gray-800 truncate">
                            {card.cardName}
                            <span className="text-gray-500 ml-1">#{card.localId}</span>
                        </h3>
                        <p className="text-gray-600">{card.setName}</p>
                        <div className="flex items-center justify-between">
                            <label className="text-gray-600">Quantità:</label>
                            {isEditable ? (
                                <input
                                    type="number"
                                    min="0"
                                    value={quantity}
                                    onChange={(e) => onQuantityChange(card.id, parseInt(e.target.value, 10) || 0)}
                                    className="w-14 p-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-center"
                                />
                            ) : (
                                <span className="font-medium text-gray-900">{quantity}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [userCollection, onQuantityChange, isEditable]);

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 300px)' }}>
            <AutoSizer>
                {({ height, width }) => {
                    const dimensions = getCardDimensions(width);
                    const columnCount = getColumnCount(width);
                    const rowCount = getRowCount(columnCount);

                    return (
                        <FixedSizeGrid
                            className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
                            columnCount={columnCount}
                            columnWidth={dimensions.cardWidth + GRID_GAP}
                            height={height}
                            rowCount={rowCount}
                            rowHeight={dimensions.cardHeight + GRID_GAP}
                            width={width}
                            itemData={{ cards, columnCount, dimensions }}
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