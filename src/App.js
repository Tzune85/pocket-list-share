import React, { useState, useEffect } from 'react';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, enableIndexedDbPersistence, onSnapshot } from 'firebase/firestore';
import firebaseConfig from './firebase-config';
import { Collection } from './components/Collection';
import { Friends } from './components/Friends';
import { Auth } from './components/Auth';
import { Share } from './components/Share';

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

// Utility function for displaying messages
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
            setCurrentPage('auth');
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
                        showMessage={showMessage}
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

export default App;
