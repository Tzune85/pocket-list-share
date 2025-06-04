import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

describe('useNetworkStatus', () => {
    const originalNavigator = { ...window.navigator };
    
    beforeEach(() => {
        Object.defineProperty(window, 'navigator', {
            value: {
                onLine: true
            },
            writable: true
        });
    });

    afterEach(() => {
        Object.defineProperty(window, 'navigator', {
            value: originalNavigator,
            writable: true
        });
    });

    it('should return initial online status', () => {
        const { result } = renderHook(() => useNetworkStatus());
        expect(result.current).toBe(true);
    });

    it('should update status when going offline', () => {
        const { result } = renderHook(() => useNetworkStatus());
        
        act(() => {
            window.dispatchEvent(new Event('offline'));
        });
        
        expect(result.current).toBe(false);
    });

    it('should update status when going online', () => {
        const { result } = renderHook(() => useNetworkStatus());
        
        act(() => {
            window.dispatchEvent(new Event('offline'));
        });
        expect(result.current).toBe(false);
        
        act(() => {
            window.dispatchEvent(new Event('online'));
        });
        expect(result.current).toBe(true);
    });
}); 