import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

export function useAutoRefresh(fetchFunction: () => void, intervalMs: number = 5000) {
    const fetchRef = useRef(fetchFunction);

    // Keep the ref up-to-date with the latest closure
    fetchRef.current = fetchFunction;

    useFocusEffect(
        useCallback(() => {
            const intervalId = setInterval(() => {
                if (fetchRef.current) {
                    fetchRef.current();
                }
            }, intervalMs);

            return () => {
                clearInterval(intervalId);
            };
        }, [intervalMs])
    );
}
