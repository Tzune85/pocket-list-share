import { useState, useMemo } from 'react';

export const useSearch = (items, userCollection) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyOwned, setShowOnlyOwned] = useState(false);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = !searchTerm || 
                item.cardName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesOwned = !showOnlyOwned || 
                (userCollection[item.id] || 0) > 0;
            return matchesSearch && matchesOwned;
        });
    }, [items, searchTerm, showOnlyOwned, userCollection]);

    return {
        searchTerm,
        setSearchTerm,
        showOnlyOwned,
        setShowOnlyOwned,
        filteredItems
    };
};
