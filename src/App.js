import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, query, where, updateDoc, arrayUnion, arrayRemove, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from './firebase-config';

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Errore nell'inizializzazione di Firebase:", error);
  if (error.code === 'app/duplicate-app') {
    app = getApp(); // Get the existing app if it was already initialized
  } else {
    throw error; // Re-throw other errors
  }
}

const db = getFirestore(app);
const auth = getAuth(app);

// Enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.error('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.error('The current browser does not support offline persistence');
    }
  });
} catch (err) {
  console.error('Error enabling offline persistence:', err);
}

// App constants
const appId = 'pokemon-tcg-pocket'; // ID predefinito per l'applicazione
const initialAuthToken = null; // Non usiamo più il token iniziale

// Connection status check
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Utility function for displaying messages (instead of alert)
const showMessage = (message, type = 'info') => {
    const messageBox = document.getElementById('message-box');
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white z-50 ${
            type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'
        }`;
        messageBox.style.display = 'block';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 3000);
    }
};

// Main App Component
function App() {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [currentPage, setCurrentPage] = useState('auth');
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [pendingNickname, setPendingNickname] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const isOnline = useNetworkStatus();

    useEffect(() => {
        if (!isOnline) {
            showMessage('Sei offline. Alcune funzionalità potrebbero non essere disponibili.', 'error');
        }
    }, [isOnline]);

    // Listen for current user's profile
    useEffect(() => {
        if (!userId || !db) return;

        const userProfileRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(userProfileRef, (docSnap) => {
            if (docSnap.exists()) {
                setCurrentUserProfile(docSnap.data());
            }
        });

        return () => unsubscribe();
    }, [userId, db]);

    useEffect(() => {
        // Firebase Authentication Listener
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setUserId(currentUser.uid);
                
                // Ensure user profile exists
                const userProfileRef = doc(db, 'users', currentUser.uid);
                const userProfileSnap = await getDoc(userProfileRef);
                
                // Check if collection exists
                const collectionRef = doc(db, 'collections', currentUser.uid);
                const collectionSnap = await getDoc(collectionRef);
                
                try {
                    // Create user profile if it doesn't exist
                    if (!userProfileSnap.exists()) {
                        await setDoc(userProfileRef, {
                            displayName: pendingNickname || `Utente-${currentUser.uid.substring(0, 8)}`,
                            email: currentUser.email,
                            friends: []
                        });
                        setPendingNickname(null); // Clear the pending nickname after use
                    }

                    // Create empty collection if it doesn't exist
                    if (!collectionSnap.exists()) {
                        await setDoc(collectionRef, {});
                        console.log('Created empty collection for existing user:', currentUser.uid);
                    }
                    
                } catch (error) {
                    console.error('Errore nella creazione del profilo o della collezione:', error);
                    showMessage('Errore nella creazione del profilo utente o della collezione', 'error');
                }
                
                setCurrentPage('collection');
            } else {
                setUser(null);
                setUserId(null);
                setCurrentUserProfile(null);
                setCurrentPage('auth');
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, [pendingNickname]);

    const handleRegister = (nickname) => {
        setPendingNickname(nickname);
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            showMessage('Disconnessione riuscita!', 'success');
            setCurrentPage('auth'); // Go back to auth page after sign out
        } catch (error) {
            console.error("Errore durante la disconnessione:", error);
            showMessage(`Errore di disconnessione: ${error.message}`, 'error');
        }
    };

    if (!isAuthReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 text-white">
                <div className="text-center">
                    <p className="mb-4">Caricamento autenticazione...</p>
                    {!isOnline && (
                        <p className="text-yellow-300">
                            Sei offline. Verifica la tua connessione internet.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 font-inter text-gray-800">
            <div id="message-box" className="hidden"></div>
            {!isOnline && (
                <div className="bg-yellow-500 text-white px-4 py-2 text-center">
                    ⚠️ Sei offline. Alcune funzionalità potrebbero non essere disponibili.
                </div>
            )}
            <nav className="bg-white bg-opacity-90 shadow-lg p-6 flex justify-between items-center flex-wrap">
                <h1 className="text-3xl font-bold text-red-600 flex items-center mb-4 md:mb-0">
                    <img src="https://placehold.co/40x40/FFD700/000000?text=P" alt="Pokemon Icon" className="mr-4 rounded-full" />
                    Collezione Pokémon Pocket
                </h1>
                <div className="flex flex-wrap gap-4 justify-center">
                    {user ? (
                        <>
                            <button
                                onClick={() => setCurrentPage('collection')}
                                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                                    currentPage === 'collection' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                                }`}
                            >
                                La Mia Collezione
                            </button>
                            <button
                                onClick={() => setCurrentPage('friends')}
                                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                                    currentPage === 'friends' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                                }`}
                            >
                                Amici
                            </button>
                            <button
                                onClick={() => setCurrentPage('share')}
                                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                                    currentPage === 'share' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                                }`}
                            >
                                Sommario
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="px-6 py-2 rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 shadow-md"
                            >
                                Disconnetti ({currentUserProfile?.displayName || 'Caricamento...'})
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setCurrentPage('auth')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                                currentPage === 'auth' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                            }`}
                        >
                            Accedi / Registrati
                        </button>
                    )}
                </div>
            </nav>

            <main className="container mx-auto p-8">
                {currentPage === 'collection' && user && (
                    <Collection 
                        userId={userId} 
                        db={db} 
                    />
                )}
                {currentPage === 'friends' && user && (
                    <Friends 
                        userId={userId}
                        user={user}
                        db={db} 
                    />
                )}
                {currentPage === 'share' && user && (
                    <Share 
                        userId={userId} 
                        db={db} 
                    />
                )}
                {currentPage === 'auth' && !user && (
                    <Auth 
                        auth={auth} 
                        setCurrentPage={setCurrentPage} 
                        showMessage={showMessage}
                        onRegister={handleRegister}
                    />
                )}
            </main>
        </div>
    );
}

// Auth Component
function Auth({ auth, setCurrentPage, showMessage, onRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        try {
            if (isRegistering) {
                if (!nickname.trim()) {
                    showMessage('Il nickname è obbligatorio per la registrazione', 'error');
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                onRegister(nickname); // Pass the nickname to the parent component
                showMessage('Registrazione riuscita! Benvenuto!', 'success');
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                showMessage('Accesso riuscito!', 'success');
            }
            setCurrentPage('collection'); // Navigate to collection after successful auth
        } catch (error) {
            console.error("Errore di autenticazione:", error);
            showMessage(`Errore di autenticazione: ${error.message}`, 'error');
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white bg-opacity-90 p-8 rounded-lg shadow-xl mt-10">
            <h2 className="text-3xl font-bold text-center text-red-600 mb-6">
                {isRegistering ? 'Registrati' : 'Accedi'}
            </h2>
            <form onSubmit={handleAuthAction} className="space-y-4">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                        Email:
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-red-400"
                        required
                    />
                </div>
                {isRegistering && (
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nickname">
                            Nickname:
                        </label>
                        <input
                            type="text"
                            id="nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-red-400"
                            required
                        />
                    </div>
                )}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Password:
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-red-400"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 shadow-md"
                >
                    {isRegistering ? 'Registrati' : 'Accedi'}
                </button>
            </form>
            <p className="text-center text-gray-600 text-sm mt-4">
                {isRegistering ? 'Hai già un account?' : 'Non hai un account?'}{' '}
                <button
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setNickname(''); // Reset nickname when switching modes
                    }}
                    className="text-blue-500 hover:text-blue-700 font-semibold"
                >
                    {isRegistering ? 'Accedi qui' : 'Registrati qui'}
                </button>
            </p>
        </div>
    );
}

// Collection Component
function Collection({ userId, db }) {
    const [pokemonCards, setPokemonCards] = useState([]);
    const [userCollection, setUserCollection] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentSet, setCurrentSet] = useState('A1');
    const [sets, setSets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [allCards, setAllCards] = useState(null); // Cache per tutte le carte

    // Fetch dei set disponibili
    useEffect(() => {
        const fetchSets = async () => {
            try {
                console.log('Fetching sets...');
                const response = await fetch('https://api.tcgdex.net/v2/it/series/tcgp');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log('Sets received:', data);
                setSets(data.sets || []);
            } catch (err) {
                console.error("Errore nel recupero dei set:", err);
                setError("Impossibile caricare i set. Riprova più tardi.");
                showMessage("Errore nel caricamento dei set. Riprova più tardi.", 'error');
            }
        };
        fetchSets();
    }, []);

    // Fetch delle carte del set selezionato o tutte le carte
    useEffect(() => {
        const fetchPokemonCards = async () => {
            if (!currentSet) return;
            
            // Se abbiamo già tutte le carte in cache e stiamo selezionando 'all'
            if (currentSet === 'all' && allCards) {
                setPokemonCards(allCards);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                if (currentSet === 'all') {
                    // Fetch di tutte le carte da tutti i set
                    const allCardsArray = [];
                    for (const set of sets) {
                        const setResponse = await fetch(`https://api.tcgdex.net/v2/it/sets/${set.id}`);
                        if (setResponse.ok) {
                            const setData = await setResponse.json();
                            if (setData.cards) {
                                const cardsWithSetInfo = setData.cards.map(card => ({
                                    cardId: card.id,
                                    cardName: card.name,
                                    image: card.image,
                                    localId: card.localId,
                                    setName: set.name
                                }));
                                allCardsArray.push(...cardsWithSetInfo);
                            }
                        }
                    }
                    setAllCards(allCardsArray); // Salva in cache
                    setPokemonCards(allCardsArray);
                } else {
                    // Fetch delle carte di un singolo set
                    const response = await fetch(`https://api.tcgdex.net/v2/it/sets/${currentSet}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    if (!data.cards) {
                        throw new Error('Nessuna carta trovata nel set');
                    }

                    const cards = data.cards.map(card => ({
                        cardId: card.id,
                        cardName: card.name,
                        image: card.image,
                        localId: card.localId,
                        setName: sets.find(s => s.id === currentSet)?.name || 'Set Sconosciuto'
                    }));
                    
                    setPokemonCards(cards);
                }
            } catch (err) {
                console.error("Errore nel recupero delle carte Pokémon:", err);
                setError("Impossibile caricare le carte Pokémon. Riprova più tardi.");
                showMessage("Errore nel caricamento delle carte Pokémon. Riprova più tardi.", 'error');
                setPokemonCards([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchPokemonCards();
    }, [currentSet, sets, allCards]);

    // Listen for user's collection changes
    useEffect(() => {
        if (!userId) return;

        const collectionRef = doc(db, 'collections', userId);
        const unsubscribe = onSnapshot(collectionRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserCollection(docSnap.data() || {});
            } else {
                setUserCollection({});
            }
        }, (err) => {
            console.error("Errore nel recupero della collezione:", err);
            showMessage(`Errore nel recupero della collezione: ${err.message}`, 'error');
        });

        return () => unsubscribe();
    }, [userId, db]);

    // Handle quantity change
    const handleQuantityChange = useCallback(async (cardId, quantity) => {
        if (!userId) return;

        const newQuantity = Math.max(0, parseInt(quantity, 10) || 0);
        const collectionRef = doc(db, 'collections', userId);

        try {
            await setDoc(collectionRef, { [cardId]: newQuantity }, { merge: true });
            showMessage('Quantità aggiornata!', 'success');
        } catch (err) {
            console.error("Errore nell'aggiornamento della quantità:", err);
            showMessage(`Errore nell'aggiornamento: ${err.message}`, 'error');
        }
    }, [userId, db]);

    // Filter cards based on search term
    const filteredCards = useMemo(() => {
        console.log('Filtering cards. Current cards:', pokemonCards, 'Search term:', searchTerm);
        if (!Array.isArray(pokemonCards)) {
            console.log('pokemonCards is not an array');
            return [];
        }
        if (!searchTerm) {
            console.log('No search term, returning all cards');
            return pokemonCards;
        }
        
        const filtered = pokemonCards.filter(card => 
            card?.cardName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        console.log('Filtered cards:', filtered);
        return filtered;
    }, [pokemonCards, searchTerm]);

    if (loading && !filteredCards.length) {
        return <div className="text-center text-white text-xl mt-10">Caricamento carte Pokémon...</div>;
    }

    return (
        <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold text-red-600 mb-8 text-center">La Mia Collezione di Carte Pokémon</h2>
            
            <div className="space-y-6 mb-8">
                {/* Set selector */}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-3">
                        Seleziona Set:
                    </label>
                    <select
                        value={currentSet}
                        onChange={(e) => {
                            console.log('Selected set:', e.target.value);
                            setCurrentSet(e.target.value);
                        }}
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
                        onChange={(e) => {
                            console.log('Search term changed:', e.target.value);
                            setSearchTerm(e.target.value);
                        }}
                        placeholder="Cerca una carta..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                </div>
            </div>

            {error && <p className="text-center text-red-500 mb-6">{error}</p>}
            
            {filteredCards.length === 0 ? (
                <p className="text-center text-gray-600">
                    {loading ? (
                        <span>
                            {currentSet === 'all' 
                                ? "Caricamento di tutte le carte... Potrebbe richiedere qualche secondo."
                                : "Caricamento..."}
                        </span>
                    ) : (
                        "Nessuna carta corrisponde alla ricerca."
                    )}
                </p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredCards.map((card) => (
                        <div key={card.cardId} className="bg-gray-50 p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                            {card.image && (
                                <div className="mb-3 relative pt-[139.7%]">
                                    <img
                                        src={`${card.image}/high.png`}
                                        alt={card.cardName}
                                        className="absolute top-0 left-0 w-full h-full object-contain rounded-lg"
                                        loading="lazy"
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-800 truncate">
                                    {card.cardName}
                                    <span className="text-xs text-gray-500 ml-1">#{card.localId}</span>
                                </h3>
                                <p className="text-xs text-gray-600">{card.setName}</p>
                                <div className="flex items-center space-x-2">
                                    <label className="text-xs text-gray-600">Quantità:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={userCollection[card.cardId] || 0}
                                        onChange={(e) => handleQuantityChange(card.cardId, e.target.value)}
                                        className="w-16 p-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-center text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Friends Component
function Friends({ userId, user, db }) {
    const [userProfile, setUserProfile] = useState(null);
    const [friendIdInput, setFriendIdInput] = useState('');
    const [viewingFriendCollection, setViewingFriendCollection] = useState(null);
    const [friendCollectionData, setFriendCollectionData] = useState({});
    const [viewingFriendProfile, setViewingFriendProfile] = useState(null);
    const [showDetailedCollection, setShowDetailedCollection] = useState(false);
    const [friendPokemonCards, setFriendPokemonCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sets, setSets] = useState([]);
    const [currentSet, setCurrentSet] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [expansionStats, setExpansionStats] = useState({});

    // Fetch all Pokémon cards once for friend's collection display
    useEffect(() => {
        const fetchAllPokemonCards = async () => {
            try {
                // Using the TCGdex API for Pokemon Pocket series
                const response = await fetch('https://api.tcgdex.net/v2/en/cards?seriesId=tcgp');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (!Array.isArray(data)) {
                    throw new Error("Formato dati API non valido: la risposta non è un array.");
                }
                setFriendPokemonCards(data.map(card => ({
                    cardId: card.id,
                    cardName: card.name,
                    rarity: card.rarity || 'N/A',
                    expansion: card.set?.name || 'Sconosciuta'
                })) || []);
            } catch (err) {
                console.error("Errore nel recupero di tutte le carte Pokémon:", err);
                setError("Impossibile caricare le carte Pokémon per la visualizzazione degli amici.");
                showMessage("Errore nel caricamento delle carte Pokémon per gli amici. Riprova più tardi.", 'error');
                setFriendPokemonCards([]); // Ensure cards are empty on error
            }
        };
        fetchAllPokemonCards();
    }, []);

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
        }, (err) => {
            console.error("Errore nel recupero del profilo utente:", err);
            showMessage(`Errore nel recupero del profilo: ${err.message}`, 'error');
        });

        return () => unsubscribe();
    }, [userId, db]);

    // Fetch Pokemon cards when viewing friend's collection
    useEffect(() => {
        const fetchPokemonCards = async () => {
            if (!viewingFriendCollection) return;
            
            setLoading(true);
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
                
                setFriendPokemonCards(allCards);

                // Calcola immediatamente le statistiche
                if (allCards.length > 0) {
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
                            if (quantity > 0) {
                                uniqueCards++;
                            }
                        });

                        stats[setId] = {
                            name: setData.name,
                            totalCards: totalCardsInSet,
                            uniqueCards: uniqueCards
                        };
                    });

                    setExpansionStats(stats);
                }
            } catch (err) {
                console.error("Errore nel recupero delle carte Pokémon:", err);
                setError("Impossibile caricare le carte Pokémon.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchPokemonCards();
    }, [viewingFriendCollection, friendCollectionData]);

    // Listen for friend's collection when viewingFriendCollection changes
    useEffect(() => {
        if (!viewingFriendCollection || !db) {
            setFriendCollectionData({});
            return;
        }

        const friendCollectionRef = doc(db, 'collections', viewingFriendCollection);
        const unsubscribe = onSnapshot(friendCollectionRef, (docSnap) => {
            if (docSnap.exists()) {
                const collectionData = docSnap.data() || {};
                setFriendCollectionData(collectionData);
            } else {
                setFriendCollectionData({});
                showMessage("La collezione dell'amico non esiste o è vuota.", 'info');
            }
        }, (err) => {
            console.error("Errore nel recupero della collezione dell'amico:", err);
            showMessage(`Errore nel recupero della collezione dell'amico: ${err.message}`, 'error');
        });

        return () => unsubscribe();
    }, [viewingFriendCollection, db]);

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

    // Filtra le carte in base alla ricerca e al set selezionato
    const filteredCards = useMemo(() => {
        if (!friendPokemonCards.length) return [];
        
        return friendPokemonCards.filter(card => {
            const matchesSearch = !searchTerm || 
                card.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSet = currentSet === 'all' || card.setId === currentSet;
            return matchesSearch && matchesSet;
        });
    }, [friendPokemonCards, searchTerm, currentSet]);

    const handleAddFriend = async () => {
        if (!friendIdInput || friendIdInput === userId) {
            showMessage("Inserisci un ID amico valido e diverso dal tuo.", 'error');
            return;
        }

        try {
            // Check if friend exists in the users collection
            const friendProfileRef = doc(db, 'users', friendIdInput);
            const friendProfileSnap = await getDoc(friendProfileRef);

            if (!friendProfileSnap.exists()) {
                showMessage("L'ID amico non esiste.", 'error');
                return;
            }

            // Get current user's profile
            const currentUserProfileRef = doc(db, 'users', userId);
            const currentUserProfileSnap = await getDoc(currentUserProfileRef);

            if (!currentUserProfileSnap.exists()) {
                // If user profile doesn't exist, create it with the friend
                await setDoc(currentUserProfileRef, {
                    displayName: userProfile?.displayName || `Utente-${userId.substring(0, 8)}`,
                    email: user.email,
                    friends: [friendIdInput]
                });
            } else {
                // If profile exists, update the friends array
                const currentFriends = currentUserProfileSnap.data().friends || [];
                if (currentFriends.includes(friendIdInput)) {
                    showMessage("Questo utente è già tuo amico!", 'error');
                    return;
                }

                // Aggiorna l'array degli amici usando arrayUnion per evitare duplicati
                await updateDoc(currentUserProfileRef, {
                    friends: arrayUnion(friendIdInput)
                });
            }

            const friendDisplayName = friendProfileSnap.data().displayName || 'Utente sconosciuto';
            showMessage(`${friendDisplayName} aggiunto come amico!`, 'success');
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

    const getCardNameById = (cardId) => {
        const card = friendPokemonCards.find(c => c.cardId === cardId);
        return card ? card.cardName : `Carta Sconosciuta (${cardId})`;
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

    const totalCards = Object.values(friendCollectionData).reduce((sum, qty) => sum + qty, 0);

    return (
        <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-xl">
            {!showDetailedCollection ? (
                <>
                    <h2 className="text-3xl font-bold text-red-600 mb-6 text-center">I Miei Amici</h2>

                    <div className="mb-8 p-4 bg-blue-50 rounded-lg shadow-inner">
                        <h3 className="text-2xl font-semibold text-blue-700 mb-4">Il Tuo ID</h3>
                        <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
                            <code className="flex-grow p-3 bg-gray-100 rounded font-mono text-sm break-all">{userId}</code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(userId);
                                    showMessage('ID copiato negli appunti!', 'success');
                                }}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-all duration-300"
                            >
                                Copia ID
                            </button>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">Condividi questo ID con i tuoi amici per permettere loro di aggiungerti!</p>
                    </div>

                    <div className="mb-8 p-4 bg-blue-50 rounded-lg shadow-inner">
                        <h3 className="text-2xl font-semibold text-blue-700 mb-4">Aggiungi un Amico</h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="Inserisci l'ID dell'amico"
                                value={friendIdInput}
                                onChange={(e) => setFriendIdInput(e.target.value)}
                                className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <button
                                onClick={handleAddFriend}
                                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-all duration-300"
                            >
                                Aggiungi
                            </button>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-2xl font-semibold text-blue-700 mb-4 border-b-2 border-blue-300 pb-2">
                            Lista Amici ({userProfile?.friends?.length || 0})
                        </h3>
                        {userProfile?.friends && userProfile.friends.length > 0 ? (
                            <ul className="space-y-4">
                                {userProfile.friends.map((friendId) => (
                                    <FriendItem
                                        key={friendId}
                                        friendId={friendId}
                                        db={db}
                                        appId={appId}
                                        onRemove={handleRemoveFriend}
                                        onViewCollection={handleViewCollection}
                                        isViewing={viewingFriendCollection === friendId}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600">Non hai ancora amici. Aggiungine alcuni usando l'ID utente!</p>
                        )}
                    </div>

                    {viewingFriendCollection && (
                        <div className="mt-10 p-6 bg-green-50 rounded-lg shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-green-700">
                                    Collezione di {viewingFriendProfile?.displayName || 'Caricamento...'}
                                </h3>
                                <button
                                    onClick={handleViewDetailedCollection}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-md transition-all duration-300"
                                >
                                    Visualizza Collezione Completa
                                </button>
                            </div>

                            <h3 className="text-2xl font-semibold text-green-700 mb-4 border-b-2 border-green-300 pb-2">
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
                    </div>

                    {loading ? (
                        <div className="text-center py-10">
                            <p className="text-xl text-gray-600">Caricamento collezione...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10">
                            <p className="text-xl text-red-600">{error}</p>
                        </div>
                    ) : filteredCards.length === 0 ? (
                        <p className="text-center text-gray-600">
                            Nessuna carta corrisponde alla ricerca.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {filteredCards.map((card) => (
                                <div key={card.id} className="bg-gray-50 p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                                    {card.image && (
                                        <div className="mb-3 relative pt-[139.7%]">
                                            <img
                                                src={`${card.image}/high.png`}
                                                alt={card.name}
                                                className="absolute top-0 left-0 w-full h-full object-contain rounded-lg"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-gray-800 truncate">
                                            {card.name}
                                            <span className="text-xs text-gray-500 ml-1">#{card.localId}</span>
                                        </h3>
                                        <p className="text-xs text-gray-600">{card.setName}</p>
                                        <div className="flex items-center space-x-2">
                                            <label className="text-xs text-gray-600">Quantità:</label>
                                            <span className="text-sm font-medium text-gray-900">
                                                {friendCollectionData[card.id] || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Friend Item Component
function FriendItem({ friendId, db, appId, onRemove, onViewCollection, isViewing }) {
    const [friendProfile, setFriendProfile] = useState(null);

    useEffect(() => {
        const friendProfileRef = doc(db, 'users', friendId);
        const unsubscribe = onSnapshot(friendProfileRef, (docSnap) => {
            if (docSnap.exists()) {
                setFriendProfile(docSnap.data());
            } else {
                setFriendProfile({ displayName: `Utente Sconosciuto` });
            }
        }, (err) => {
            console.error("Errore nel recupero del profilo dell'amico:", err);
            setFriendProfile({ displayName: `Errore` });
        });
        return () => unsubscribe();
    }, [friendId, db]);

    // Crea una versione abbreviata dell'ID
    const shortId = friendId.substring(0, 8) + "...";

    return (
        <li className="flex items-center justify-between bg-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <span className="text-lg font-medium text-gray-800 break-all">
                {friendProfile?.displayName} <span className="text-sm text-gray-500 font-mono">({shortId})</span>
            </span>
            <div className="flex space-x-2">
                <button
                    onClick={() => onViewCollection(isViewing ? null : friendId)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                        isViewing ? 'bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                    } shadow-md`}
                >
                    {isViewing ? 'Nascondi Collezione' : 'Vedi Collezione'}
                </button>
                <button
                    onClick={() => onRemove(friendId)}
                    className="px-4 py-2 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white shadow-md transition-all duration-300"
                >
                    Rimuovi
                </button>
            </div>
        </li>
    );
}


// Share Component
function Share({ userId, db }) {
    const [userCollection, setUserCollection] = useState({});
    const [pokemonCards, setPokemonCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
                setError("Impossibile caricare le carte Pokémon per il riepilogo.");
                showMessage("Errore nel caricamento delle carte Pokémon per il riepilogo. Riprova più tardi.", 'error');
                setPokemonCards([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPokemonCards();
    }, []);

    // Listen for user's collection changes and calculate expansion stats
    useEffect(() => {
        if (!userId || !db) return;

        const collectionRef = doc(db, 'collections', userId);
        const unsubscribe = onSnapshot(collectionRef, (docSnap) => {
            if (docSnap.exists()) {
                const collection = docSnap.data() || {};
                setUserCollection(collection);
                
                // Raggruppa prima le carte per set
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

                // Calcola le statistiche per ogni set
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
        }, (err) => {
            console.error("Errore nel recupero della collezione utente per il riepilogo:", err);
            showMessage(`Errore nel recupero della collezione: ${err.message}`, 'error');
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
}

export default App;
