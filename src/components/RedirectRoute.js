import React, { memo } from "react";
export default memo(({ children }) => {
    const accessToken = localStorage.getItem('accessToken');
    console.log('route', accessToken)
    return children
})