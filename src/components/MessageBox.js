import React, { useState, useEffect } from 'react';

export const MessageBox = ({ message, type = 'info', duration = 3000 }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    if (!visible || !message) return null;

    const bgColor = {
        error: 'bg-red-500',
        success: 'bg-green-500',
        info: 'bg-blue-500'
    }[type] || 'bg-blue-500';

    return (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white z-50 ${bgColor}`}>
            {message}
        </div>
    );
};

export const useMessage = () => {
    const [messageState, setMessageState] = useState({ message: '', type: 'info' });

    const showMessage = (message, type = 'info') => {
        setMessageState({ message, type });
    };

    return {
        MessageComponent: () => <MessageBox {...messageState} />,
        showMessage
    };
}; 