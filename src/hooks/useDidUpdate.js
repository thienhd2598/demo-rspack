import { useEffect, useRef } from 'react';

export function useDidUpdate(fn, dependencies) {
    const mounted = useRef(false);

    useEffect(() => () => {
       mounted.current = false;
    },[]);

    useEffect(() => {
    if (mounted.current) {
      return fn();
    }
    
    mounted.current = true;
    return undefined;
    }, dependencies);

}