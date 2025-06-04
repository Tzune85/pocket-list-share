import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export const Auth = ({ auth, setCurrentPage, showMessage, onRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        try {
            if (isRegistering) {
                if (!nickname.trim()) {
                    showMessage('Il nickname è obbligatorio per la registrazione', 'error');
                    return;
                }
                await createUserWithEmailAndPassword(auth, email, password);
                onRegister(nickname); // Pass the nickname to the parent component
                showMessage('Registrazione riuscita! Benvenuto!', 'success');
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                showMessage('Accesso riuscito!', 'success');
            }
            setCurrentPage('collection'); // Navigate to collection after successful auth
        } catch (error) {
            console.error("Errore di autenticazione:", error);
            showMessage(`Errore di autenticazione: ${error.message}`, 'error');
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white bg-opacity-90 p-6 rounded-lg shadow-xl mt-10">
            <h2 className="text-3xl font-bold text-center text-red-600 mb-6">
                {isRegistering ? 'Registrati' : 'Accedi'}
            </h2>
            <form onSubmit={handleAuthAction} className="space-y-4">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                        Email:
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-red-400"
                        required
                    />
                </div>
                {isRegistering && (
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nickname">
                            Nickname:
                        </label>
                        <input
                            type="text"
                            id="nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-red-400"
                            required
                        />
                    </div>
                )}
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Password:
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-red-400"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 shadow-md"
                >
                    {isRegistering ? 'Registrati' : 'Accedi'}
                </button>
            </form>
            <p className="text-center text-gray-600 text-sm mt-4">
                {isRegistering ? 'Hai già un account?' : 'Non hai un account?'}{' '}
                <button
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setNickname(''); // Reset nickname when switching modes
                    }}
                    className="text-blue-500 hover:text-blue-700 font-semibold"
                >
                    {isRegistering ? 'Accedi qui' : 'Registrati qui'}
                </button>
            </p>
        </div>
    );
}; 