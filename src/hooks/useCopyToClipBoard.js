import React, { useState, useCallback } from 'react';

export function useCopyToClipBoard() {
    const [copied, setCopied] = useState(false);

    const copyTextToClipBoard = useCallback(
        async () => {
            await navigator.clipboard.writeText()
        }, []
    );

}