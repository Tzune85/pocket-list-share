import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Auth } from '../Auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => {
    return {
        createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({})),
        signInWithEmailAndPassword: jest.fn(() => Promise.resolve({}))
    };
});

describe('Auth Component', () => {
    const mockAuth = {};
    const mockSetCurrentPage = jest.fn();
    const mockShowMessage = jest.fn();
    const mockOnRegister = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders login form by default', () => {
        render(
            <Auth
                auth={mockAuth}
                setCurrentPage={mockSetCurrentPage}
                showMessage={mockShowMessage}
                onRegister={mockOnRegister}
            />
        );

        expect(screen.getByRole('heading', { name: 'Accedi' })).toBeInTheDocument();
        expect(screen.getByLabelText('Email:')).toBeInTheDocument();
        expect(screen.getByLabelText('Password:')).toBeInTheDocument();
        expect(screen.queryByLabelText('Nickname:')).not.toBeInTheDocument();
    });

    it('switches to registration form when clicking register link', () => {
        render(
            <Auth
                auth={mockAuth}
                setCurrentPage={mockSetCurrentPage}
                showMessage={mockShowMessage}
                onRegister={mockOnRegister}
            />
        );

        fireEvent.click(screen.getByText('Registrati qui'));
        expect(screen.getByRole('heading', { name: 'Registrati' })).toBeInTheDocument();
        expect(screen.getByLabelText('Nickname:')).toBeInTheDocument();
    });

    it('shows error message for empty nickname during registration', async () => {
        render(
            <Auth
                auth={mockAuth}
                setCurrentPage={mockSetCurrentPage}
                showMessage={mockShowMessage}
                onRegister={mockOnRegister}
            />
        );

        // Switch to registration mode
        fireEvent.click(screen.getByText('Registrati qui'));

        // Fill in email and password but leave nickname empty
        fireEvent.change(screen.getByLabelText('Email:'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText('Password:'), { target: { value: 'password123' } });

        // Submit the form
        await act(async () => {
            fireEvent.submit(screen.getByRole('button', { name: 'Registrati' }));
        });

        expect(mockShowMessage).toHaveBeenCalledWith('Il nickname è obbligatorio per la registrazione', 'error');
    });

    it('handles successful registration', async () => {
        // Setup the mock to resolve after a small delay
        createUserWithEmailAndPassword.mockImplementation(() => new Promise((resolve) => {
            setTimeout(() => resolve({}), 10);
        }));

        render(
            <Auth
                auth={mockAuth}
                setCurrentPage={mockSetCurrentPage}
                showMessage={mockShowMessage}
                onRegister={mockOnRegister}
            />
        );

        // Switch to registration mode
        fireEvent.click(screen.getByText('Registrati qui'));

        // Fill in all fields
        fireEvent.change(screen.getByLabelText('Email:'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText('Password:'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('Nickname:'), { target: { value: 'TestUser' } });

        // Submit the form and wait for all promises to resolve
        await act(async () => {
            fireEvent.submit(screen.getByRole('button', { name: 'Registrati' }));
            // Wait for all promises to resolve
            await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Verify the actions occurred in the correct order
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password123');
        expect(mockOnRegister).toHaveBeenCalledWith('TestUser');
        expect(mockShowMessage).toHaveBeenCalledWith('Registrazione riuscita! Benvenuto!', 'success');
        expect(mockSetCurrentPage).toHaveBeenCalledWith('collection');
    });

    it('handles successful login', async () => {
        // Setup the mock to resolve after a small delay
        signInWithEmailAndPassword.mockImplementation(() => new Promise((resolve) => {
            setTimeout(() => resolve({}), 10);
        }));

        render(
            <Auth
                auth={mockAuth}
                setCurrentPage={mockSetCurrentPage}
                showMessage={mockShowMessage}
                onRegister={mockOnRegister}
            />
        );

        // Fill in login fields
        fireEvent.change(screen.getByLabelText('Email:'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText('Password:'), { target: { value: 'password123' } });

        // Submit the form and wait for all promises to resolve
        await act(async () => {
            fireEvent.submit(screen.getByRole('button', { name: 'Accedi' }));
            // Wait for all promises to resolve
            await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Verify the actions occurred in the correct order
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password123');
        expect(mockShowMessage).toHaveBeenCalledWith('Accesso riuscito!', 'success');
        expect(mockSetCurrentPage).toHaveBeenCalledWith('collection');
    });
}); 