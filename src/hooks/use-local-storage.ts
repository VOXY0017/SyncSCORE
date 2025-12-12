"use client"

import { useState, useEffect, useCallback } from 'react';

// Hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });

  // useEffect to update local storage when the state changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        typeof storedValue === 'function'
          ? storedValue(storedValue)
          : storedValue;
      // Save state to local storage
      const currentValue = window.localStorage.getItem(key);
      if (JSON.stringify(valueToStore) !== currentValue) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // We are broadcasting the change to other tabs
        window.dispatchEvent(new StorageEvent('storage', { key }));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  }, [key, storedValue]);
  
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
    } catch (error) {
      console.log(error);
    }
  };

  const handleStorageChange = useCallback((event: StorageEvent) => {
    // only update if the event is for our key and the value has actually changed
    if (event.key === key) {
         if (typeof window === 'undefined') {
            return;
        }
        try {
            const item = window.localStorage.getItem(key);
            const newValue = item ? JSON.parse(item) : initialValue;
            if(JSON.stringify(newValue) !== JSON.stringify(storedValue)) {
                setStoredValue(newValue);
            }
        } catch (error) {
            console.log(error);
            setStoredValue(initialValue);
        }
    }
  }, [key, initialValue, storedValue]);

  // Listen for changes in other tabs
  useEffect(() => {
    if (typeof window === 'undefined') {
        return;
    }
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleStorageChange]);


  return [storedValue, setValue] as const;
}
