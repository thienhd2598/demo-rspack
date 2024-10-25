import clsx from 'clsx';
import React, { memo, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button, ButtonToolbar, Overlay, OverlayTrigger, Popover } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import * as Yup from "yup";
import coUpdateReturnOrderShippingTracking from "../../../../graphql/mutate_coUpdateReturnOrderShippingTrackingNumber";
import { useMutation } from '@apollo/client';
import { useToasts } from 'react-toast-notifications';


const EditVertical = ({ title, varibles }) => {
    const { formatMessage } = useIntl();
    const [show, setShow] = useState(false);
    const [error, setError] = useState(null);
    const [valueInput, setValueInput] = useState(varibles?.shipping_tracking_number);
    const target = useRef(null);
    const { addToast } = useToasts();
    const [updateReturnOrderShippingTracking] = useMutation(coUpdateReturnOrderShippingTracking, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetReturnOrders']
      });

    let yupSchema = Yup.object().shape({
        type: Yup
        .string().max(20, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, 
            { length: 20, name: formatMessage({ defaultMessage: "Độ dài" })
        })).nullable() 
    })


    const resetValue = () => {
        setError(null);
        setShow(prev => !prev);
        setValueInput(varibles?.shipping_tracking_number)
    }

    return (
        <div className="d-flex justify-content-start align-items-center">
            <ButtonToolbar>
                <div className='cursor-pointer' onClick={resetValue} ref={target}>
                    <i role="button" className="ml-2 far fa-edit" />
                </div>
                
                <Overlay rootClose onHide={resetValue} show={show} target={target.current} placement="right">
                    <Popover>
                        <Popover.Title className="p-3" as="h6">{title}</Popover.Title>
                        <Popover.Content>
                            <div className="d-flex justify-content-between" style={{ height: '30px' }}>
                                <input
                                    className={clsx(`form-control mr-2`, { ['border border-danger']: !!error })}
                                    style={{ height: '30px' }}
                                    placeholder=""
                                    value={valueInput}
                                    onBlur={() => {                                            
                                        yupSchema.validate({
                                            type: valueInput
                                        }).then(value => {
                                            setError(null);
                                        }).catch(error => {
                                            setError(error?.message);
                                        })
                                    }}
                                    onChange={e => { 
                                        setError(null);
                                        setValueInput(e.target.value);
                                    }}
                                />
                                <Button
                                    variant="primary"
                                    size="sm"
                                    disabled={error}
                                    onClick={async () => {
                                        yupSchema.validate({
                                            type: valueInput
                                        }).then(async () => {
                                            setError(null);
                                            const {data} = await updateReturnOrderShippingTracking({
                                                variables: {
                                                    return_order_id: varibles?.id,
                                                    shipping_tracking_number: valueInput
                                                }
                                            })
                                            resetValue()
                                            if(data?.coUpdateReturnOrderShippingTrackingNumber?.success) {
                                                addToast(data?.coUpdateReturnOrderShippingTrackingNumber?.message || 'Thành công', {appearance: 'success'})
                                                return
                                            }
                                            addToast(data?.coUpdateReturnOrderShippingTrackingNumber?.message || 'Thất bại', {appearance: 'error'})
                                        }).catch(error => {
                                            console.log('error', error)
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