import clsx from 'clsx';
import React, { memo, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button, ButtonToolbar, Overlay, OverlayTrigger, Popover } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import * as Yup from "yup";
import { useFormik } from "formik";
import NumberFormat from 'react-number-format';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';

const EditableVertical = ({
    text,
    type,
    onConfirm,
    id
    // onChange
}) => {
    const { formatMessage } = useIntl();
    const [show, setShow] = useState(false);
    const [valueRatio, setValueRatio] = useState(text || '');
    const [error, setError] = useState(null);
    const target = useRef(null);

    const yupSchema = useMemo(() => {
        let schema = {};
        if (type == 'name') {
            schema = {
                name: Yup.string()
                    .max(35, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 35, name: formatMessage({ defaultMessage: "Tên khách hàng" }) }))
                    .test(
                        'chua-ky-tu-space-o-dau-cuoi',
                        formatMessage({ defaultMessage: 'Tên khách hàng không được chứa dấu cách ở đầu và cuối' }),
                        (value, context) => {
                            if (!!value) {
                                return value.length == value.trim().length;
                            }
                            return false;
                        },
                    )
                    .test(
                        'chua-ky-tu-2space',
                        formatMessage({ defaultMessage: 'Tên khách hàng không được chứa 2 dấu cách liên tiếp' }),
                        (value, context) => {
                            if (!!value) {
                                return !(/\s\s+/g.test(value))
                            }
                            return false;
                        },
                    )
            }
        }

        if (type == 'email') {
            schema = {
                email: Yup.string()
                .nullable()
                .email(formatMessage({ defaultMessage: "Email khách hàng không hợp lệ" })),
            }
        }

        if (type == 'phone') {
            schema = {
                phone: Yup.string()
                    .length(10, formatMessage({ defaultMessage: "Độ dài số điện thoại khách hàng phải {number} số" }, { number: 10 }))
                    .test(
                        'sai-dinh-dang-phone',
                        'Số điện thoại khách hàng không hợp lệ',
                        (value, context) => {
                            if (!!value) {
                                return (/^0[0-9]\d{8}$/g.test(value))
                            }
                            return true;
                        },
                    ),
            }
        }

        return Yup.object().shape(schema)
    }, [type]);

    const resetValue = useCallback(() => {
        setValueRatio(text);
        setError(null);
        setShow(prev => !prev);
    }, [text]);

    return (
        <div className="d-flex justify-content-start align-items-center">
            <span>
                {text || '--'}
            </span>
            <AuthorizationWrapper keys={['customer_service_customer_info_update']}>
                <ButtonToolbar>
                    <i
                        ref={target}
                        role="button"
                        className="ml-2 text-dark far fa-edit"
                        onClick={resetValue}
                    />
                    <Overlay
                        rootClose
                        onHide={resetValue}
                        show={show}
                        target={target.current}
                        placement="right"
                    >
                        <Popover>
                            <Popover.Title className="p-3" as="h6">{formatMessage({ defaultMessage: "Cập nhật thông tin" })}
                            </Popover.Title>
                            <Popover.Content>
                                <div className="d-flex justify-content-between" style={{ height: '30px' }}>
                                    {type != 'phone' && (
                                        <input
                                            type="text"
                                            pattern="[0-9]*"
                                            style={{ height: '30px' }}
                                            {...(type == 'name' ? { maxLength: 35 } : {})}
                                            className={clsx(`form-control mr-2`, { ['border border-danger']: !!error })}
                                            value={valueRatio}
                                            onBlur={() => {
                                                yupSchema.validate({
                                                    [type]: valueRatio
                                                }).then(value => {
                                                    setError(null);
                                                }).catch(error => {
                                                    setError(error?.message);
                                                })
                                            }}
                                            onChange={(event) => {
                                                const newValue = event.target.value;

                                                setError(null);
                                                setValueRatio(newValue)
                                            }}
                                        />
                                    )}
                                    {type == 'phone' && (
                                        <NumberFormat
                                            className={clsx(`form-control mr-2`, { ['border border-danger']: !!error })}
                                            style={{ height: '30px' }}
                                            placeholder=""
                                            thousandSeparator={false}
                                            allowLeadingZeros={true}
                                            value={valueRatio}
                                            onBlur={() => {                                            
                                                yupSchema.validate({
                                                    [type]: (valueRatio)
                                                }).then(value => {
                                                    setError(null);
                                                }).catch(error => {
                                                    setError(error?.message);
                                                })
                                            }}
                                            onValueChange={value => {                                             
                                                setError(null);
                                                setValueRatio(value?.value);
                                            }}
                                        />
                                    )}
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        disabled={valueRatio?.length == 0 || !valueRatio}
                                        onClick={() => {
                                            yupSchema.validate({
                                                [type]: valueRatio
                                            }).then(value => {
                                                !!onConfirm && onConfirm({
                                                    [type]: valueRatio,
                                                    id
                                                }, () => {
                                                    resetValue();
                                                }, type)
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
                                {!!error && (
                                    <span className='text-danger mt-2 d-block' style={{ maxWidth: '75%' }}>{error}</span>
                                )}
                            </Popover.Content>
                        </Popover>
                    </Overlay>
                </ButtonToolbar>
            </AuthorizationWrapper>
        </div>
    )
};

export default memo(EditableVertical);