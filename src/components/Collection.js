import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { VirtualizedCardGrid } from './VirtualizedCardGrid';
import { useCollection } from '../hooks/useCollection';
import { usePokemonCards } from '../hooks/usePokemonCards';
import { useSearch } from '../hooks/useSearch';
import { doc, onSnapshot } from 'firebase/firestore';

export const Collection = ({ userId, db }) => {
    const { userCollection, loading: collectionLoading, error: collectionError, updateCardQuantity } = useCollection(db, userId);
    const { pokemonCards, loading: cardsLoading, error: cardsError, currentSet, setCurrentSet, sets } = usePokemonCards();
    const { searchTerm, setSearchTerm, showOnlyOwned, setShowOnlyOwned, filteredItems: filteredCards } = useSearch(pokemonCards, userCollection);

    useEffect(() => {
        if (!userId || !db) return;

        const collectionRef = doc(db, 'collections', userId);
        const unsubscribe = onSnapshot(collectionRef, (docSnap) => {
            if (docSnap.exists()) {
                // Group cards by set
                const cardsBySet = pokemonCards.reduce((acc, card) => {
                    if (!acc[card.setId]) {
                        acc[card.setId] = {
                            name: card.setName,
                            cards: []
                        };
                    }
                    acc[card.setId].cards.push(card);
                    return acc;
                }, {});

                // Calculate stats for each set
                Object.entries(cardsBySet).forEach(([setId, setData]) => {
                    // Removed unused variables calculation
                });
            }
        });

        return () => unsubscribe();
    }, [userId, db, pokemonCards]);

    if (cardsLoading || collectionLoading) {
        return <div className="text-center text-white text-xl mt-10">Caricamento carte Pokémon...</div>;
    }

    if (cardsError || collectionError) {
        return <div className="text-center text-red-500 mt-10">{cardsError || collectionError}</div>;
    }

    return (
        <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-xl">
            <h2 className="hidden sm:block text-3xl font-bold text-red-600 mb-8 text-center">
                La Mia Collezione di Carte Pokémon
            </h2>
            
            <div className="space-y-6 mb-8">
                {/* Set selector */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-3">
                        Seleziona Set:
                    </label>
                    <select
                        value={currentSet}
                        onChange={(e) => setCurrentSet(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                        <option value="all">Tutte le carte</option>
                        {sets.map((set) => (
                            <option key={set.id} value={set.id}>
                                {set.name} ({set.cardCount?.official || 0} carte)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search bar */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-3">
                        Cerca per Nome:
                    </label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cerca una carta..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                </div>

                {/* Toggle for owned cards */}
                <div className="flex items-center space-x-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showOnlyOwned}
                            onChange={(e) => setShowOnlyOwned(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                    <span className="text-sm font-medium text-gray-700">
                        Mostra solo le carte che possiedo
                    </span>
                </div>
            </div>

            {filteredCards.length === 0 ? (
                <p className="text-center text-gray-600">
                    Nessuna carta corrisponde alla ricerca.
                </p>
            ) : (
                <VirtualizedCardGrid
                    cards={filteredCards}
                    userCollection={userCollection}
                    onQuantityChange={updateCardQuantity}
                />
            )}
        </div>
    );
};

Collection.propTypes = {
    userId: PropTypes.string.isRequired,
    db: PropTypes.object.isRequired
}; 