import React, { useState, useEffect, useMemo } from 'react';
import { VirtualizedCardGrid } from './VirtualizedCardGrid';
import { useCollection } from '../hooks/useCollection';
import { pokemonApi } from '../services/pokemonApi';

export const Collection = ({ userId, db }) => {
    const { userCollection, loading: collectionLoading, error: collectionError, updateCardQuantity } = useCollection(db, userId);
    const [pokemonCards, setPokemonCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentSet, setCurrentSet] = useState('all');
    const [sets, setSets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyOwned, setShowOnlyOwned] = useState(false);

    // Fetch sets
    useEffect(() => {
        const fetchSets = async () => {
            try {
                const setsData = await pokemonApi.getSets();
                setSets(setsData);
            } catch (err) {
                console.error("Errore nel recupero dei set:", err);
                setError("Impossibile caricare i set. Riprova più tardi.");
            }
        };
        fetchSets();
    }, []);

    // Fetch cards based on selected set
    useEffect(() => {
        const fetchCards = async () => {
            setLoading(true);
            try {
                let cards;
                if (currentSet === 'all') {
                    cards = await pokemonApi.getAllCards();
                } else {
                    cards = await pokemonApi.getSetCards(currentSet);
                }
                setPokemonCards(cards);
            } catch (err) {
                console.error("Errore nel recupero delle carte:", err);
                setError("Impossibile caricare le carte. Riprova più tardi.");
            } finally {
                setLoading(false);
            }
        };
        fetchCards();
    }, [currentSet]);

    // Filter cards based on search term and owned status
    const filteredCards = useMemo(() => {
        return pokemonCards.filter(card => {
            const matchesSearch = !searchTerm || card.cardName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesOwned = !showOnlyOwned || (userCollection[card.id] || 0) > 0;
            return matchesSearch && matchesOwned;
        });
    }, [pokemonCards, searchTerm, showOnlyOwned, userCollection]);

    if (loading || collectionLoading) {
        return <div className="text-center text-white text-xl mt-10">Caricamento carte Pokémon...</div>;
    }

    if (error || collectionError) {
        return <div className="text-center text-red-500 mt-10">{error || collectionError}</div>;
    }

    return (
        <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold text-red-600 mb-8 text-center">
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