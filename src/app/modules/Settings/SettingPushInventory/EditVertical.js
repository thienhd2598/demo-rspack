import clsx from 'clsx';
import React, { memo, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button, ButtonToolbar, Overlay, OverlayTrigger, Popover } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import * as Yup from "yup";
import NumberFormat from 'react-number-format';
import { useFormikContext } from 'formik';


const EditVertical = ({ children, type, title, field, onConfirm }) => {
    const { formatMessage } = useIntl();
    const [show, setShow] = useState(false);
    const {values} = useFormikContext()
    const [valueRatio, setValueRatio] = useState(0);
    const [error, setError] = useState(null);
    const [valueField, setValueField] = useState(values[field]);
    const target = useRef(null);
    let yupSchema = {}
    if(type == 'push') {
        yupSchema = Yup.object().shape({type: Yup.number()
                    .typeError(formatMessage({ defaultMessage: "Vui lòng nhập tỷ lệ đẩy" }))
                    .max(100, formatMessage({ defaultMessage: "{field} tối đa 100 %" }, { field: formatMessage({ defaultMessage: "Tỷ lệ đẩy" }) }))})
                    .nullable()
        
    }
    if(type == 'protection') {
        yupSchema = Yup.object().shape({type: Yup.number()
            .typeError(formatMessage({ defaultMessage: "Ngưỡng bảo vệ từ 0 đến 999.999" }))
            .min(0, formatMessage({ defaultMessage: "Ngưỡng bảo vệ từ 0 đến 999.999" }))
            .max(999999, formatMessage({ defaultMessage: "Ngưỡng bảo vệ từ 0 đến 999.999" }))})
            .nullable()
    }


    useMemo(() => {
        setValueField(values[field])
    },[values[field]])

    const resetValue = () => {
        setValueField(values[field])
        setValueRatio(0);
        setError(null);
        setShow(prev => !prev);
    }

    return (
        <div className="d-flex justify-content-start align-items-center">
            <ButtonToolbar>
                <div className='cursor-pointer' onClick={resetValue} ref={target}>
                    {children}
                    {!children && <i role="button" className="ml-2 far fa-edit" />}
                </div>
                
                <Overlay rootClose onHide={resetValue} show={show} target={target.current} placement="right">
                    <Popover>
                        <Popover.Title className="p-3" as="h6">{title}</Popover.Title>
                        <Popover.Content>
                            <div className="d-flex justify-content-between" style={{ height: '30px' }}>
                                <NumberFormat
                                    className={clsx(`form-control mr-2`, { ['border border-danger']: !!error })}
                                    style={{ height: '30px' }}
                                    placeholder=""
                                    thousandSeparator={false}
                                    allowLeadingZeros={false}
                                    value={valueField ? valueField : valueRatio}
                                    onBlur={() => {                                            
                                        yupSchema.validate({
                                            type: valueRatio
                                        }).then(value => {
                                            setError(null);
                                        }).catch(error => {
                                            setError(error?.message);
                                        })
                                    }}
                                    onValueChange={value => {     
                                        setError(null);
                                        setValueField(0)
                                        if(value?.value === '') {
                                            setValueRatio(null);
                                            return
                                        }
                                        setValueRatio(+value?.value);
                                    }}
                                />
                                <Button
                                    variant="primary"
                                    size="sm"
                                    disabled={error || valueRatio?.length == 0 || (!valueRatio && valueRatio !== 0)}
                                    onClick={() => {
                                        yupSchema.validate({type: valueRatio}).then(value => {
                                            onConfirm(value?.type || valueField)
                                            resetValue()
                                        }).catch(error => {
                                            setError(error?.message);
                                        })
                                    }}
                                    className="mr-2 d-flex justify-content-center align-items-center">
                                    <i className="fas fa-check p-0 icon-nm" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={resetValue}
                                    size="sm"
                                    className="d-flex justify-content-center align-items-center">
                                    <i className="fas fa-times p-0 icon-nm" />
                                </Button>
                            </div>
                            {!!error && ( <span className='text-danger mt-2 d-block' style={{ maxWidth: '75%' }}>{error}</span> )}
                        </Popover.Content>
                    </Popover>
                </Overlay>
            </ButtonToolbar>
        </div>
    )
};

export default memo(EditVertical);