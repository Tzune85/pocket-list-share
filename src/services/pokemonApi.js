const API_BASE_URL = 'https://api.tcgdex.net/v2/it';
let cardsCache = new Map();
let setsCache = null;

export const pokemonApi = {
    async getSets() {
        if (setsCache) {
            return setsCache;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/series/tcgp`);
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
            const response = await fetch(`${API_BASE_URL}/sets/${setId}`);
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
                    allCards.push(...cards);
                } catch (error) {
                    console.error(`Failed to fetch cards for set ${set.name} (${set.id}):`, error);
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