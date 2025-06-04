import { useState, useEffect } from 'react';
import { pokemonApi } from '../services/pokemonApi';

export const usePokemonCards = (initialSet = 'all') => {
    const [pokemonCards, setPokemonCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentSet, setCurrentSet] = useState(initialSet);
    const [sets, setSets] = useState([]);

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
                setError(null);
            } catch (err) {
                console.error("Errore nel recupero delle carte:", err);
                setError("Impossibile caricare le carte. Riprova più tardi.");
            } finally {
                setLoading(false);
            }
        };
        fetchCards();
    }, [currentSet]);

    return {
        pokemonCards,
        loading,
        error,
        currentSet,
        setCurrentSet,
        sets
    };
}; 