import React, { useState, useEffect } from 'react';
import { VirtualizedCardGrid } from './VirtualizedCardGrid';
import { pokemonApi } from '../services/pokemonApi';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';

export const Friends = ({ userId, user, db, showMessage }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [friendIdInput, setFriendIdInput] = useState('');
    const [viewingFriendCollection, setViewingFriendCollection] = useState(null);
    const [friendCollectionData, setFriendCollectionData] = useState({});
    const [viewingFriendProfile, setViewingFriendProfile] = useState(null);
    const [showDetailedCollection, setShowDetailedCollection] = useState(false);
    const [pokemonCards, setPokemonCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sets, setSets] = useState([]);
    const [currentSet, setCurrentSet] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [expansionStats, setExpansionStats] = useState({});
    const [showOnlyOwned, setShowOnlyOwned] = useState(false);

    // Listen for current user's profile (friends list)
    useEffect(() => {
        if (!userId || !db) return;

        const userProfileRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(userProfileRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserProfile(docSnap.data());
            } else {
                setUserProfile({ displayName: `Utente-${userId.substring(0, 8)}`, friends: [] });
            }
        });

        return () => unsubscribe();
    }, [userId, db]);

    // Listen for friend's collection when viewingFriendCollection changes
    useEffect(() => {
        if (!viewingFriendCollection || !db) {
            setFriendCollectionData({});
            return;
        }

        const friendCollectionRef = doc(db, 'collections', viewingFriendCollection);
        const unsubscribe = onSnapshot(friendCollectionRef, (docSnap) => {
            if (docSnap.exists()) {
                setFriendCollectionData(docSnap.data() || {});
            } else {
                setFriendCollectionData({});
            }
        });

        return () => unsubscribe();
    }, [viewingFriendCollection, db]);

    // Fetch Pokemon cards when viewing friend's collection
    useEffect(() => {
        const fetchPokemonCards = async () => {
            if (!viewingFriendCollection) return;
            
            setLoading(true);
            try {
                const setsData = await pokemonApi.getSets();
                setSets(setsData);

                // Fetch all cards first
                const allCards = await pokemonApi.getAllCards();
                
                // Then filter based on current set if needed
                const displayCards = currentSet === 'all' 
                    ? allCards 
                    : allCards.filter(card => card.setId === currentSet);
                
                setPokemonCards(displayCards);

                // Calculate statistics using all cards
                const cardsBySet = allCards.reduce((acc, card) => {
                    if (!acc[card.setId]) {
                        acc[card.setId] = {
                            name: card.setName,
                            cards: []
                        };
                    }
                    acc[card.setId].cards.push(card);
                    return acc;
                }, {});

                const stats = {};
                Object.entries(cardsBySet).forEach(([setId, setData]) => {
                    const totalCardsInSet = setData.cards.length;
                    let uniqueCards = 0;

                    setData.cards.forEach(card => {
                        const quantity = friendCollectionData[card.id] || 0;
                        if (quantity > 0) uniqueCards++;
                    });

                    stats[setId] = {
                        name: setData.name,
                        totalCards: totalCardsInSet,
                        uniqueCards: uniqueCards
                    };
                });

                setExpansionStats(stats);
            } catch (err) {
                console.error("Errore nel recupero delle carte:", err);
                setError("Impossibile caricare le carte.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchPokemonCards();
    }, [viewingFriendCollection, currentSet, friendCollectionData]);

    // Add new effect to fetch viewing friend's profile
    useEffect(() => {
        if (!viewingFriendCollection || !db) {
            setViewingFriendProfile(null);
            return;
        }

        const friendProfileRef = doc(db, 'users', viewingFriendCollection);
        const unsubscribe = onSnapshot(friendProfileRef, (docSnap) => {
            if (docSnap.exists()) {
                setViewingFriendProfile(docSnap.data());
            } else {
                setViewingFriendProfile({ displayName: 'Utente Sconosciuto' });
            }
        });

        return () => unsubscribe();
    }, [viewingFriendCollection, db]);

    const handleAddFriend = async () => {
        if (!friendIdInput || friendIdInput === userId) {
            showMessage("Inserisci un ID amico valido e diverso dal tuo.", 'error');
            return;
        }

        try {
            const friendProfileRef = doc(db, 'users', friendIdInput);
            const friendProfileSnap = await getDoc(friendProfileRef);

            if (!friendProfileSnap.exists()) {
                showMessage("L'ID amico non esiste.", 'error');
                return;
            }

            const currentUserProfileRef = doc(db, 'users', userId);
            await updateDoc(currentUserProfileRef, {
                friends: arrayUnion(friendIdInput)
            });

            showMessage(`${friendProfileSnap.data().displayName || 'Utente'} aggiunto come amico!`, 'success');
            setFriendIdInput('');
        } catch (err) {
            console.error("Errore nell'aggiunta dell'amico:", err);
            showMessage(`Errore nell'aggiunta dell'amico: ${err.message}`, 'error');
        }
    };

    const handleRemoveFriend = async (friendToRemoveId) => {
        try {
            const currentUserProfileRef = doc(db, 'users', userId);
            await updateDoc(currentUserProfileRef, {
                friends: arrayRemove(friendToRemoveId)
            });
            showMessage('Amico rimosso.', 'success');
            if (viewingFriendCollection === friendToRemoveId) {
                setViewingFriendCollection(null);
            }
        } catch (err) {
            console.error("Errore nella rimozione dell'amico:", err);
            showMessage(`Errore nella rimozione dell'amico: ${err.message}`, 'error');
        }
    };

    const handleViewCollection = (friendId) => {
        if (viewingFriendCollection === friendId) {
            setViewingFriendCollection(null);
            setShowDetailedCollection(false);
        } else {
            setViewingFriendCollection(friendId);
            setShowDetailedCollection(false);
        }
    };

    const handleViewDetailedCollection = () => {
        setShowDetailedCollection(true);
    };

    return (
        <div className="bg-white bg-opacity-90 p-4 sm:p-6 rounded-lg shadow-xl">
            {!showDetailedCollection ? (
                <>
                    <h2 className="text-2xl sm:text-3xl font-bold text-red-600 mb-4 sm:mb-6 text-center">I Miei Amici</h2>

                    <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-blue-50 rounded-lg shadow-inner">
                        <h3 className="text-xl sm:text-2xl font-semibold text-blue-700 mb-3 sm:mb-4">Il Tuo ID</h3>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-white rounded-lg shadow-sm">
                            <code className="p-2 sm:p-3 bg-gray-100 rounded font-mono text-xs sm:text-sm break-all">{userId}</code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(userId);
                                    showMessage('ID copiato negli appunti!', 'success');
                                }}
                                className="px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-all duration-300 whitespace-nowrap"
                            >
                                Copia ID
                            </button>
                        </div>
                        <p className="mt-2 text-xs sm:text-sm text-gray-600">Condividi questo ID con i tuoi amici per permettere loro di aggiungerti!</p>
                    </div>

                    <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-blue-50 rounded-lg shadow-inner">
                        <h3 className="text-xl sm:text-2xl font-semibold text-blue-700 mb-3 sm:mb-4">Aggiungi un Amico</h3>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <input
                                type="text"
                                placeholder="Inserisci l'ID dell'amico"
                                value={friendIdInput}
                                onChange={(e) => setFriendIdInput(e.target.value)}
                                className="flex-grow p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                            />
                            <button
                                onClick={handleAddFriend}
                                className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-all duration-300 whitespace-nowrap"
                            >
                                Aggiungi
                            </button>
                        </div>
                    </div>

                    <div className="mb-6 sm:mb-8">
                        <h3 className="text-xl sm:text-2xl font-semibold text-blue-700 mb-3 sm:mb-4 border-b-2 border-blue-300 pb-2">
                            Lista Amici ({userProfile?.friends?.length || 0})
                        </h3>
                        {userProfile?.friends && userProfile.friends.length > 0 ? (
                            <ul className="space-y-3 sm:space-y-4">
                                {userProfile.friends.map((friendId) => (
                                    <FriendItem
                                        key={friendId}
                                        friendId={friendId}
                                        db={db}
                                        onRemove={handleRemoveFriend}
                                        onViewCollection={handleViewCollection}
                                        isViewing={viewingFriendCollection === friendId}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm sm:text-base text-gray-600">Non hai ancora amici. Aggiungine alcuni usando l'ID utente!</p>
                        )}
                    </div>

                    {viewingFriendCollection && (
                        <div className="mt-10 p-6 bg-green-50 rounded-lg shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-1xl font-bold text-green-700">
                                    Collezione di {viewingFriendProfile?.displayName || 'Caricamento...'}
                                </h3>
                                <button
                                    onClick={handleViewDetailedCollection}
                                    className="px-1 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-md transition-all duration-300"
                                >
                                    Visualizza Collezione Completa
                                </button>
                            </div>

                            <h3 className="text-1.5xl font-semibold text-green-700 mb-4 border-b-2 border-green-300 pb-2">
                                Dettagli per Espansione
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(expansionStats).map(([setId, stats]) => (
                                    <div key={setId} className="bg-white p-4 rounded-lg shadow-md">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-2">{stats.name}</h4>
                                        <div className="space-y-2 text-sm">
                                            <p className="text-gray-600">
                                                Carte Totali: <span className="font-medium text-green-600">{stats.uniqueCards}/{stats.totalCards}</span>
                                            </p>
                                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                <div 
                                                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${(stats.uniqueCards / stats.totalCards) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-red-600">
                            Collezione di {viewingFriendProfile?.displayName || 'Caricamento...'}
                        </h2>
                        <button
                            onClick={() => setShowDetailedCollection(false)}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-all duration-300"
                        >
                            Torna alla Lista Amici
                        </button>
                    </div>

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
                                Mostra solo le carte che possiede
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-10">
                            <p className="text-xl text-gray-600">Caricamento collezione...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10">
                            <p className="text-xl text-red-600">{error}</p>
                        </div>
                    ) : pokemonCards.length === 0 ? (
                        <p className="text-center text-gray-600">
                            Nessuna carta trovata.
                        </p>
                    ) : (
                        <VirtualizedCardGrid
                            cards={pokemonCards.filter(card => {
                                const matchesSearch = !searchTerm || card.cardName.toLowerCase().includes(searchTerm.toLowerCase());
                                const matchesOwned = !showOnlyOwned || (friendCollectionData[card.id] || 0) > 0;
                                return matchesSearch && matchesOwned;
                            })}
                            userCollection={friendCollectionData}
                            onQuantityChange={() => {}}
                            isEditable={false}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

// Friend Item Component
const FriendItem = ({ friendId, db, onRemove, onViewCollection, isViewing }) => {
    const [friendProfile, setFriendProfile] = useState(null);

    useEffect(() => {
        const friendProfileRef = doc(db, 'users', friendId);
        const unsubscribe = onSnapshot(friendProfileRef, (docSnap) => {
            if (docSnap.exists()) {
                setFriendProfile(docSnap.data());
            } else {
                setFriendProfile({ displayName: `Utente Sconosciuto` });
            }
        });
        return () => unsubscribe();
    }, [friendId, db]);

    const shortId = friendId.substring(0, 8) + "...";

    return (
        <li className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 space-y-3 sm:space-y-0">
            <span className="text-lg font-medium text-gray-800 break-all">
                {friendProfile?.displayName} <span className="text-sm text-gray-500 font-mono block sm:inline">({shortId})</span>
            </span>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                    onClick={() => onViewCollection(isViewing ? null : friendId)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                        isViewing ? 'bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                    } shadow-md w-full sm:w-auto`}
                >
                    {isViewing ? 'Nascondi Collezione' : 'Vedi Collezione'}
                </button>
                <button
                    onClick={() => onRemove(friendId)}
                    className="px-4 py-2 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white shadow-md transition-all duration-300 w-full sm:w-auto"
                >
                    Rimuovi
                </button>
            </div>
        </li>
    );
}; 