import React, { Fragment, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

export default function InputScan({
    setSearch, placeholder
}) {

    const [inputValueOrder, setInputValueOrder] = useState('');
    const [lastInputTime, setLastInputTime] = useState(0);
    const timeoutRef = useRef(null);
    const {formatMessage} = useIntl() 
    const handleInputChange = (event) => {
        const value = event.target.value;
        setInputValueOrder(value);

        const currentTime = Date.now();
        const inputDelay = currentTime - lastInputTime;
        setLastInputTime(currentTime);
        if (inputDelay < 10) {
            clearTimeout(timeoutRef.current);
            setSearch(value)
            console.log('Dữ liệu từ máy quét mã vạch:', event.target.value);
        } else {
            // Dữ liệu nhập từ bàn phím
            console.log('Dữ liệu từ bàn phím:', event.target.value);
        }


    };

    return (
        <Fragment>
            <input
                type="text"
                className="form-control"
                placeholder={placeholder}
                style={{ height: 38, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                onBlur={(e) => {
                    setSearch(e.target.value)
                }}
                onChange={handleInputChange}
                // defaultValue={params.q || ''}
                onKeyDown={e => {
                    if (e.keyCode == 13) {
                        setSearch(e.target.value)
                    }
                }}
            />
        </Fragment>
    )
};