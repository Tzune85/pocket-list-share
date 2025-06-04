import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';
import { BuggyCounter } from '../BuggyCounter';

// Sopprimiamo i console.error durante i test
const originalError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalError;
});

describe('ErrorBoundary', () => {
    it('renderizza i children quando non ci sono errori', () => {
        render(
            <ErrorBoundary>
                <div>Contenuto test</div>
            </ErrorBoundary>
        );

        expect(screen.getByText('Contenuto test')).toBeInTheDocument();
    });

    it('mostra UI di fallback quando si verifica un errore', () => {
        render(
            <ErrorBoundary>
                <BuggyCounter />
            </ErrorBoundary>
        );

        // Clicca il pulsante fino a quando non si verifica l'errore
        const button = screen.getByText('Incrementa Contatore');
        fireEvent.click(button); // 1
        fireEvent.click(button); // 2
        fireEvent.click(button); // 3
        fireEvent.click(button); // 4
        fireEvent.click(button); // 5 - Questo causerà l'errore

        // Verifica che l'UI di fallback sia visualizzata
        expect(screen.getByText('Qualcosa è andato storto')).toBeInTheDocument();
        expect(screen.getByText(/Ci scusiamo per l'inconveniente/)).toBeInTheDocument();
        expect(screen.getByText('Ricarica la pagina')).toBeInTheDocument();
    });

    it('mostra i dettagli tecnici in modalità development', () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        render(
            <ErrorBoundary>
                <BuggyCounter />
            </ErrorBoundary>
        );

        // Causa l'errore
        const button = screen.getByText('Incrementa Contatore');
        for (let i = 0; i < 5; i++) {
            fireEvent.click(button);
        }

        // Verifica che i dettagli tecnici siano visibili
        expect(screen.getByText('Dettagli tecnici')).toBeInTheDocument();

        // Ripristina l'ambiente
        process.env.NODE_ENV = originalNodeEnv;
    });

    it('non mostra i dettagli tecnici in modalità production', () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        render(
            <ErrorBoundary>
                <BuggyCounter />
            </ErrorBoundary>
        );

        // Causa l'errore
        const button = screen.getByText('Incrementa Contatore');
        for (let i = 0; i < 5; i++) {
            fireEvent.click(button);
        }

        // Verifica che i dettagli tecnici non siano visibili
        expect(screen.queryByText('Dettagli tecnici')).not.toBeInTheDocument();

        // Ripristina l'ambiente
        process.env.NODE_ENV = originalNodeEnv;
    });
}); 