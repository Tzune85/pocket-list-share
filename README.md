# Pokémon TCG Pocket Card Share

A web application that allows Pokémon TCG Pocket players to share and showcase their card collections.

## Features

- Add cards from your Pokémon TCG Pocket collection
- Share your collection with other players
- View and browse other players' collections
- Search and filter cards by various criteria

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pocket-list-share.git
cd pocket-list-share
```

2. Install dependencies:
```bash
npm install
```

3. Environment Setup:
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration values:
     - Get these values from your Firebase project settings
     - Never commit the `.env` file
     - Keep your API keys private

4. Start the development server:
```bash
npm start
```

### Environment Variables

The following environment variables are required:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=           # Your Firebase API Key
REACT_APP_FIREBASE_AUTH_DOMAIN=       # Your Firebase Auth Domain
REACT_APP_FIREBASE_PROJECT_ID=        # Your Firebase Project ID
REACT_APP_FIREBASE_STORAGE_BUCKET=    # Your Firebase Storage Bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID= # Your Firebase Messaging Sender ID
REACT_APP_FIREBASE_APP_ID=            # Your Firebase App ID

# API Configuration
REACT_APP_POKEMON_API_BASE_URL=https://api.tcgdex.net/v2/it

# App Configuration
REACT_APP_DEFAULT_LANGUAGE=it
REACT_APP_MESSAGE_TIMEOUT=5000
```

### Deployment

The application is deployed to Firebase Hosting. To deploy:

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Deploy:
```bash
npm run build
firebase deploy
```

### Live Version

Visit the live version at https://pokepocketlistshare.web.app

## License

© 2024 The Pokémon Company. Pokémon and Pokémon character names are trademarks of Nintendo. All rights reserved.

Made by Tzune https://github.com/Tzune85


