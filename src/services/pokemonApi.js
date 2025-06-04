import config from '../config';

const BASE_URL = config.api.pokemonBaseUrl;
let cardsCache = new Map();
let setsCache = null;

export const pokemonApi = {
    async getSets() {
        if (setsCache) {
            return setsCache;
        }

        try {
            const response = await fetch(`${BASE_URL}/series/tcgp`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setsCache = data.sets || [];
            return setsCache;
        } catch (error) {
            console.error('Error fetching sets:', error);
            throw error;
        }
    },

    async getSetCards(setId) {
        const cacheKey = `set_${setId}`;
        if (cardsCache.has(cacheKey)) {
            return cardsCache.get(cacheKey);
        }

        try {
            const response = await fetch(`${BASE_URL}/sets/${setId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            const cards = data.cards?.map(card => ({
                id: card.id,
                cardName: card.name,
                image: card.image,
                localId: card.localId,
                setName: data.name,
                setId: data.id
            })) || [];

            cardsCache.set(cacheKey, cards);
            return cards;
        } catch (error) {
            console.error(`Error fetching set cards for ${setId}:`, error);
            throw error;
        }
    },

    async getAllCards() {
        const cacheKey = 'all_cards';
        if (cardsCache.has(cacheKey)) {
            return cardsCache.get(cacheKey);
        }

        try {
            const sets = await this.getSets();
            const allCards = [];

            for (const set of sets) {
                try {
                    const cards = await this.getSetCards(set.id);
                    const cardsWithSetInfo = cards.map(card => ({
                        ...card,
                        setName: set.name,
                        setId: set.id
                    }));
                    allCards.push(...cardsWithSetInfo);
                } catch (error) {
                    console.error(`Error fetching cards for set ${set.id}:`, error);
                }
            }

            cardsCache.set(cacheKey, allCards);
            return allCards;
        } catch (error) {
            console.error('Error fetching all cards:', error);
            throw error;
        }
    },

    clearCache() {
        cardsCache.clear();
        setsCache = null;
    }
}; 