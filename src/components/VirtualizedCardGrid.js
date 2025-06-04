import React, { useCallback, useState } from 'react';
import { FixedSizeGrid, FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { LazyImage } from './LazyImage';
import { ImageModal } from './ImageModal';

// Dimensioni base per desktop
const BASE_CARD_WIDTH = 200;
const BASE_CARD_HEIGHT = 285;
const GRID_GAP = 16;

// Altezza riga per la vista mobile
const ROW_HEIGHT = 64;

export const VirtualizedCardGrid = ({ 
    cards, 
    userCollection, 
    onQuantityChange,
    isEditable = true 
}) => {
    const [selectedCard, setSelectedCard] = useState(null);

    // Renderizza una riga della tabella (vista mobile)
    const TableRow = useCallback(({ index, style }) => {
        const card = cards[index];
        const quantity = userCollection[card.id] || 0;

        return (
            <div 
                style={style}
                className="flex items-center px-4 py-2 border-b border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedCard(card)}
            >
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                        {card.cardName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                        {card.setName} #{card.localId}
                    </p>
                </div>
                <div className="flex items-center ml-4">
                    {isEditable ? (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onQuantityChange(card.id, quantity + 1);
                                }}
                                className="w-6 h-6 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-full shadow-sm transition-colors"
                            >
                                +
                            </button>
                            <input
                                type="number"
                                min="0"
                                value={quantity}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    onQuantityChange(card.id, parseInt(e.target.value, 10) || 0);
                                }}
                                className="w-14 p-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-center text-sm"
                                onClick={e => e.stopPropagation()}
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onQuantityChange(card.id, Math.max(0, quantity - 1));
                                }}
                                className="w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm transition-colors"
                            >
                                -
                            </button>
                        </div>
                    ) : (
                        <span className="text-sm font-medium text-gray-900">
                            {quantity}
                        </span>
                    )}
                </div>
            </div>
        );
    }, [userCollection, onQuantityChange, isEditable]);

    // Renderizza una cella della griglia (vista desktop)
    const GridCell = useCallback(({ columnIndex, rowIndex, style, data }) => {
        const { cards, columnCount, dimensions } = data;
        const index = rowIndex * columnCount + columnIndex;
        
        if (index >= cards.length) {
            return null;
        }

        const card = cards[index];
        const quantity = userCollection[card.id] || 0;

        const cellStyle = {
            ...style,
            left: Number(style.left) + GRID_GAP / 2,
            top: Number(style.top) + GRID_GAP / 2,
            width: dimensions.cardWidth,
            height: dimensions.cardHeight,
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

    // Calcola il numero di colonne in base alla larghezza disponibile
    const getColumnCount = (width) => {
        return Math.floor((width + GRID_GAP) / (BASE_CARD_WIDTH + GRID_GAP));
    };

    // Calcola il numero di righe necessarie
    const getRowCount = (columnCount) => {
        return Math.ceil(cards.length / columnCount);
    };

    return (
        <>
            <div style={{ width: '100%', height: 'calc(100vh - 300px)' }}>
                <AutoSizer>
                    {({ height, width }) => {
                        // Se la larghezza è inferiore a 640px (breakpoint sm di Tailwind), usa la vista tabellare
                        if (width < 640) {
                            return (
                                <FixedSizeList
                                    className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
                                    height={height}
                                    itemCount={cards.length}
                                    itemSize={ROW_HEIGHT}
                                    width={width}
                                    overscanCount={5}
                                >
                                    {TableRow}
                                </FixedSizeList>
                            );
                        }

                        // Altrimenti usa la vista a griglia
                        const columnCount = getColumnCount(width);
                        const rowCount = getRowCount(columnCount);

                        return (
                            <FixedSizeGrid
                                className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
                                columnCount={columnCount}
                                columnWidth={BASE_CARD_WIDTH + GRID_GAP}
                                height={height}
                                rowCount={rowCount}
                                rowHeight={BASE_CARD_HEIGHT + GRID_GAP}
                                width={width}
                                itemData={{ cards, columnCount, dimensions: { cardWidth: BASE_CARD_WIDTH, cardHeight: BASE_CARD_HEIGHT } }}
                                overscanRowCount={2}
                                style={{ padding: `${GRID_GAP / 2}px` }}
                            >
                                {GridCell}
                            </FixedSizeGrid>
                        );
                    }}
                </AutoSizer>
            </div>

            <ImageModal 
                card={selectedCard} 
                onClose={() => setSelectedCard(null)} 
            />
        </>
    );
}; 