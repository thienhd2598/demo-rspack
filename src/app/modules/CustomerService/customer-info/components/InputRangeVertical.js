import clsx from 'clsx';
import React, { useState, memo, useMemo } from 'react';
import { useIntl } from 'react-intl';

import NumberFormat from 'react-number-format';

const InputRangeVertical = ({
    title,
    key,
    rangeUrl,
    onComplete,
    min,
    max
}) => {
    const { formatMessage } = useIntl();
    const [error, setError] = useState(null);
    const [range, setRange] = useState({
        from: null,
        to: null
    });

    console.log(`RANGE: `, range);

    useMemo(() => {
        const {from, to} = rangeUrl
        if(!from || !to) return
        setRange(prev => ({
            ...prev,
            from: rangeUrl?.from,
            to: rangeUrl?.to,
        }))
    }, [rangeUrl]);

    return (
        <div className='d-flex align-items-center'>
            <span className="mr-4" style={{ minWidth: 'fit-content' }}>
                {title}
            </span>
            <div className="btn-range-input input-group" style={{ position: 'relative', width: '100%' }} >
                <div className={clsx(`input-group`, { [`border-is-invalid`]: !!error })}>
                    <div className='form-control d-flex align-items-center justify-content-between'>
                        <NumberFormat
                            className={""}
                            placeholder="Từ"
                            thousandSeparator={true}
                            value={range.from}
                            isAllowed={(values) => {                                
                                const { floatValue } = values;
                                if (!floatValue) return true;

                                return floatValue >= min && floatValue <= max;
                            }}
                            onValueChange={value => {
                                setError(null);
                                if (!value.floatValue)
                                    setRange(prev => ({ ...prev, from: value.floatValue }))
                                else
                                    setRange(prev => ({ ...prev, from: Math.floor(value.floatValue) }))
                            }}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mx-2 bi bi-arrow-right-short" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8" />
                        </svg>
                        <NumberFormat
                            className={""}
                            placeholder="Đến"
                            thousandSeparator={true}
                            value={range.to}
                            isAllowed={(values) => {                                
                                const { floatValue } = values;
                                if (!floatValue) return true;

                                return floatValue >= min && floatValue <= max;
                            }}
                            onValueChange={value => {
                                setError(null);
                                if (!value.floatValue)
                                    setRange(prev => ({ ...prev, to: value.floatValue }))
                                else
                                    setRange(prev => ({ ...prev, to: Math.floor(value.floatValue) }))
                            }}
                        />
                        <span
                            className='box-search ml-1'
                            onClick={() => {
                                if (typeof range.to == 'number' && typeof range.from == 'number' && range.to <= range.from) {
                                    setError('Vui lòng điền khoảng phù hợp');
                                    return;
                                }

                                setError(null);
                                !!onComplete && onComplete([range.from, range.to])
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-search" viewBox="0 0 14 14">
                                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                            </svg>
                        </span>
                    </div>
                </div>
                {!!error && <div className="invalid-error">{error}</div>}
            </div>
        </div>
    )
};

export default memo(InputRangeVertical);

