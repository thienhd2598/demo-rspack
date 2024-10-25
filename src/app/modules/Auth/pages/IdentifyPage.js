import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { LayoutSplashScreen } from "../../../../_metronic/layout";
import getCustomToken from "../../../../utils/getCustomToken";

const IdentifyPage = () => {
    const user = useSelector((state) => state.auth.user);
    const jwtToken = localStorage.getItem('jwt');
    const refreshToken = localStorage.getItem('refresh_token') || '';
    
    useEffect(() => {
        if (jwtToken) {
            getCustomToken(token => {
                if (!!token) {                    
                  window.location.replace(`${process.env.REACT_APP_CHAT_ENDPOINT}/verify-token?uid=${user?.id}&token=${jwtToken}&isSubUser=${!!user?.is_subuser}&refreshToken=${refreshToken}&customToken=${token}`);
                } else {
                  window.location.replace(`${process.env.REACT_APP_CHAT_ENDPOINT}/verify-token?uid=${user?.id}&token=${jwtToken}&refreshToken=${refreshToken}&isSubUser=${!!user?.is_subuser}`);
                }
              });            
        }
    }, [jwtToken, user, refreshToken]);

    return <LayoutSplashScreen />
};

export default IdentifyPage;
