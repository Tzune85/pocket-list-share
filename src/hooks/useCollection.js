import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export const useCollection = (db, userId) => {
    const [userCollection, setUserCollection] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId || !db) {
            setUserCollection({});
            setLoading(false);
            return;
        }

        const collectionRef = doc(db, 'collections', userId);
        const unsubscribe = onSnapshot(collectionRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserCollection(docSnap.data() || {});
            } else {
                setUserCollection({});
            }
            setLoading(false);
        }, (err) => {
            console.error("Errore nel recupero della collezione:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, db]);

    const updateCardQuantity = async (cardId, quantity) => {
        if (!userId) return;

        const newQuantity = Math.max(0, parseInt(quantity, 10) || 0);
        const collectionRef = doc(db, 'collections', userId);

        try {
            await setDoc(collectionRef, { [cardId]: newQuantity }, { merge: true });
            return { success: true };
        } catch (err) {
            console.error("Errore nell'aggiornamento della quantità:", err);
            return { success: false, error: err };
        }
    };

    return {
        userCollection,
        loading,
        error,
        updateCardQuantity
    };
}; 