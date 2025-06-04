const config = {
    firebase: {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID
    },
    api: {
        pokemonBaseUrl: process.env.REACT_APP_POKEMON_API_BASE_URL || 'https://api.tcgdex.net/v2/it'
    },
    app: {
        defaultLanguage: process.env.REACT_APP_DEFAULT_LANGUAGE || 'it',
        messageTimeout: parseInt(process.env.REACT_APP_MESSAGE_TIMEOUT, 10) || 5000
    }
};

// Validate required configuration
const validateConfig = () => {
    const requiredFirebaseConfig = [
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId'
    ];

    const missingConfig = requiredFirebaseConfig.filter(
        key => !config.firebase[key]
    );

    if (missingConfig.length > 0) {
        throw new Error(
            `Missing required Firebase configuration: ${missingConfig.join(', ')}`
        );
    }
};

// Validate config in development
if (process.env.NODE_ENV === 'development') {
    validateConfig();
}

export default config; 