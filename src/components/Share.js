import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { doc, onSnapshot } from 'firebase/firestore';

export const Share = ({ userId, db, showMessage }) => {
    const [userCollection, setUserCollection] = useState({});
    const [pokemonCards, setPokemonCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expansionStats, setExpansionStats] = useState({});

    // Fetch all Pokémon cards once
    useEffect(() => {
        const fetchPokemonCards = async () => {
            try {
                const response = await fetch('https://api.tcgdex.net/v2/it/series/tcgp');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                const sets = data.sets || [];
                const allCards = [];
                
                for (const set of sets) {
                    const setResponse = await fetch(`https://api.tcgdex.net/v2/it/sets/${set.id}`);
                    if (setResponse.ok) {
                        const setData = await setResponse.json();
                        if (setData.cards) {
                            const cardsWithSetInfo = setData.cards.map(card => ({
                                ...card,
                                setName: set.name,
                                setId: set.id
                            }));
                            allCards.push(...cardsWithSetInfo);
                        }
                    }
                }
                
                setPokemonCards(allCards);
            } catch (err) {
                console.error("Errore nel recupero delle carte Pokémon:", err);
                showMessage("Errore nel caricamento delle carte Pokémon per il riepilogo. Riprova più tardi.", 'error');
                setPokemonCards([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPokemonCards();
    }, [showMessage]);

    // Listen for user's collection changes and calculate expansion stats
    useEffect(() => {
        if (!userId || !db) return;

        const collectionRef = doc(db, 'collections', userId);
        const unsubscribe = onSnapshot(collectionRef, (docSnap) => {
            if (docSnap.exists()) {
                const collection = docSnap.data() || {};
                setUserCollection(collection);
                
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
                const stats = {};
                Object.entries(cardsBySet).forEach(([setId, setData]) => {
                    const totalCardsInSet = setData.cards.length;
                    let uniqueCollected = 0;
                    let totalCollected = 0;

                    setData.cards.forEach(card => {
                        const quantity = collection[card.id] || 0;
                        if (quantity > 0) {
                            uniqueCollected++;
                            totalCollected += quantity;
                        }
                    });

                    stats[setId] = {
                        name: setData.name,
                        totalCards: totalCardsInSet,
                        uniqueCollected: uniqueCollected,
                        totalCollected: totalCollected
                    };
                });
                
                setExpansionStats(stats);
            } else {
                setUserCollection({});
                setExpansionStats({});
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, db, pokemonCards]);

    const totalCards = Object.values(userCollection).reduce((sum, qty) => sum + qty, 0);

    if (loading) {
        return <div className="text-center text-white text-xl mt-10">Caricamento riepilogo collezione...</div>;
    }

    return (
        <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold text-red-600 mb-6 text-center">Riepilogo della Mia Collezione</h2>

            <div className="grid grid-cols-1 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-xl font-semibold text-blue-700 mb-2">Carte Totali</h3>
                    <p className="text-5xl font-extrabold text-blue-900">{totalCards}</p>
                </div>
            </div>

            <h3 className="text-2xl font-semibold text-blue-700 mb-4 border-b-2 border-blue-300 pb-2">
                Dettagli per Espansione
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(expansionStats).map(([setId, stats]) => (
                    <div key={setId} className="bg-gray-50 p-4 rounded-lg shadow-md">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">{stats.name}</h4>
                        <div className="space-y-2 text-sm">
                            <p className="text-gray-600">
                                Carte Totali: <span className="font-medium text-blue-600">{stats.uniqueCollected}/{stats.totalCards}</span>
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(stats.uniqueCollected / stats.totalCards) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

Share.propTypes = {
    userId: PropTypes.string.isRequired,
    db: PropTypes.object.isRequired,
    showMessage: PropTypes.func.isRequired
}; 