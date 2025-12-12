"use client"

import { useState, useEffect, useCallback } from 'react';

function useBroadcastChannel(channelName: string, onMessage: (message: any) => void) {
    const [channel, setChannel] = useState<BroadcastChannel | null>(null);

    useEffect(() => {
        const bc = new BroadcastChannel(channelName);
        bc.onmessage = (event) => {
            onMessage(event.data);
        };
        setChannel(bc);

        return () => {
            bc.close();
        };
    }, [channelName, onMessage]);

    return channel;
}


export function useSyncedState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  const onMessage = useCallback((data: any) => {
    if (data.key === key) {
      setValue(data.value);
    }
  }, [key]);

  const channel = useBroadcastChannel('local-state-sync', onMessage);


  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(error);
    }
    setIsLoaded(true);
  }, [key]);


  const setSyncedValue = (newValue: T | ((val: T) => T)) => {
    const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
    setValue(valueToStore);

    try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        channel?.postMessage({ key, value: valueToStore });
    } catch (error) {
        console.error(error);
    }
  };

  if (!isLoaded) {
      return [undefined, () => {}] as const;
  }

  return [value, setSyncedValue] as const;
}
