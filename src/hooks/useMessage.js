import { useState, useCallback } from 'react';

export const useMessage = () => {
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    const showMessage = useCallback((text, type = 'info') => {
        setMessage(text);
        setMessageType(type);
        setIsVisible(true);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            setIsVisible(false);
        }, 5000);
    }, []);

    const hideMessage = useCallback(() => {
        setIsVisible(false);
    }, []);

    return {
        message,
        messageType,
        isVisible,
        showMessage,
        hideMessage
    };
}; 