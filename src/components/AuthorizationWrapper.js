import React, { Fragment, memo, useMemo } from "react";
import { useSelector } from "react-redux";

const AuthorizationWrapper = ({ keys, children, isMenu = false, className = '' }) => {    
    const user = useSelector((state) => state.auth.user);   

    const isHasPermission = useMemo(() => {
        return !user?.is_subuser || keys?.some(key => user?.permissions?.includes(key))
    }, [keys, user]);

    if (isMenu) {
        return (
            <li className={className} style={{ display: isHasPermission ? 'block' : 'none' }}>
                {children}
            </li>
        )
    }

    return (
        isHasPermission && <Fragment>
            {children}
        </Fragment>
    )
}

export default memo(AuthorizationWrapper);