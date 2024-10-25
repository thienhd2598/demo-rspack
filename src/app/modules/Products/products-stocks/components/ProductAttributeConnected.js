import React, { useMemo, useCallback, memo } from 'react';
import { useIntl } from "react-intl";
const ProductAttributeConnected = () => {
    const {formatMessage} = useIntl()
    return (
        <span className='text-primary'>{formatMessage({defaultMessage:'3 liên kết'})}</span>
    );
};

export default memo(ProductAttributeConnected);