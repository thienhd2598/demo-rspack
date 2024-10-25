import React, { useState, useEffect } from 'react';

export function useShowToastAlert() {
    const [isActive, setIsActive] = useState(false);
    const [message, setMessage] = useState('');
    
    useEffect(() => {
        if (isActive === true) {
            setTimeout(() => {
                setIsActive(false);
            }, 2000);
        }
    }, [isActive]);

    const openToastAlert = (msg = '') => {
        setMessage(msg)
        setIsActive(true);
    }

    return { isActive, message, openToastAlert }
}