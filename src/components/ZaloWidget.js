import React, { useEffect, useState } from 'react';

const ZaloChatWidget = () => {
    const [isScriptLoaded, setScriptLoaded] = useState(false);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        const scriptId = 'zalo-sdk-script';

        const loadScript = () => {
            const zaloSDKScript = document.createElement('script');
            zaloSDKScript.id = scriptId;
            zaloSDKScript.src = 'https://sp.zalo.me/plugins/sdk.js';
            zaloSDKScript.onload = () => {
                setScriptLoaded(true);
            };
            zaloSDKScript.onerror = () => {
                setLoadError(true);
            };
            document.body.appendChild(zaloSDKScript);
        };

        if (!document.getElementById(scriptId)) {
            loadScript();
        } else {
            // If script already exists, check if it is loaded
            setScriptLoaded(true);
        }

        return () => {
            const script = document.getElementById(scriptId);
            if (script) {
                script.remove();
            }
        };
    }, []);

    useEffect(() => {
        if (isScriptLoaded) {
            // Re-initialize the widget if necessary
            window.ZaloSocialSDK && window.ZaloSocialSDK.reload();
        }
    }, [isScriptLoaded]);

    if (loadError) {
        return <div>Error loading Zalo Chat Widget. Please try again later.</div>;
    }

    return (
        <div >
            <div
                style={{right: '0 !important', bottom: 200, position: 'fixed', cursor: 'pointer', zIndex: 99}}
                className='zalo-chat-widget zalo-chat-widget-click'
                role="complementary"
                aria-live="polite"
                data-oaid="447516950641612964"
                data-welcome-message="Rất vui khi được hỗ trợ bạn!"
                data-autopopup="0"
                data-width=""
                data-height=""
            />
        </div>
    );
};

export default ZaloChatWidget;
