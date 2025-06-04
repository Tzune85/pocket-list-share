import React, { useState, useEffect } from 'react';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from './firebase-config';
import { Collection } from './components/Collection';
import { Friends } from './components/Friends';

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
        if (!userId) return;

        const userProfileRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(userProfileRef, (docSnap) => {
            if (docSnap.exists()) {
                setCurrentUserProfile(docSnap.data());
            }
        });

        return () => unsubscribe();
    }, [userId]);

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
                    <img src="/favicon.svg" alt="Pokeball" className="w-10 h-10 mr-4" />
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

            <main className="container mx-auto p-6">
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
                        showMessage={showMessage}
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
                await createUserWithEmailAndPassword(auth, email, password);
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
        <div className="max-w-md mx-auto bg-white bg-opacity-90 p-6 rounded-lg shadow-xl mt-10">
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

// Share Component
function Share({ userId, db }) {
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
