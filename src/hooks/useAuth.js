import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const useAuth = (db) => {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const auth = getAuth();

    useEffect(() => {
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
                            displayName: `Utente-${currentUser.uid.substring(0, 8)}`,
                            email: currentUser.email,
                            friends: []
                        });
                    }

                    // Create empty collection if it doesn't exist
                    if (!collectionSnap.exists()) {
                        await setDoc(collectionRef, {});
                    }
                    
                } catch (error) {
                    console.error('Errore nella creazione del profilo o della collezione:', error);
                }
            } else {
                setUser(null);
                setUserId(null);
                setCurrentUserProfile(null);
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, [db]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error("Errore durante la disconnessione:", error);
            return { success: false, error };
        }
    };

    return {
        user,
        userId,
        isAuthReady,
        currentUserProfile,
        handleSignOut
    };
}; 