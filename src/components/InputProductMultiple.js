import React, { useMemo, useRef, useState, useEffect, memo } from "react";
import { OverlayTrigger } from "react-bootstrap";
import { Tooltip } from "react-bootstrap";
import { FieldFeedbackLabel } from "../_metronic/_partials/controls/forms/FieldFeedbackLabel";
import NumberFormat from 'react-number-format';
import { useFormikContext } from "formik";
import { formatNumberToCurrency } from '../utils/index';
import * as Yup from "yup";
import { useIntl } from "react-intl";
import _ from 'lodash';

const getFieldCSSClasses = (touched, errors) => {
    const classes = [];
    if (touched && errors) {
        classes.push("border-is-invalid");
    }

    if (touched && !errors) {
        classes.push("is-valid");
    }

    return classes.join(" ");
};

const InputVertical = memo(({
    field, // { name, value, onChange, onBlur }
    form: { touched, errors, submitCount, values }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
    prefix = "",
    isFieldStock = false,
    label,
    nameTxt = "",
    withFeedbackLabel = true,
    customFeedbackLabel,
    type = "text",
    required = false,
    isNotChange = false,
    addOnRight = "",
    tooltip = "",
    countChar = false,
    maxChar,
    absolute = false,
    onBlurChange,
    decimalScale = 0,
    ...props
}) => {
    const { setFieldValue } = useFormikContext();
    const [innerValue, setInnerValue] = useState('');
    const [visible, setVisible] = useState(false);
    const _refSubmitCount = useRef(submitCount)
    const _refInput = useRef();
    const { formatMessage } = useIntl()
    useEffect(() => {
        const checkIfClickedOutside = (e) => {
            if (visible && _refInput.current && !_refInput.current.contains(e.target)) {
                setTimeout(() => {
                    setVisible(false);
                }, 50);
            }
        };

        document.addEventListener("mousedown", checkIfClickedOutside)

        return () => {
            document.removeEventListener("mousedown", checkIfClickedOutside)
        }
    }, [visible]);

    useEffect(() => {
        if (type === 'number') return;
        if (field.value) {
            setInnerValue(field.value);
        } else {
            setInnerValue('');
        }
    }, [field.value]);

    const _renderTooltip = () => {
        if (!tooltip) {
            return null
        }
        return (
            <OverlayTrigger
                overlay={
                    <Tooltip>
                        {tooltip}
                    </Tooltip>
                }
            >
                <i className="fas fa-info-circle"></i>
            </OverlayTrigger>
        )
    }
    let placeholders = useMemo(() => {
        if (!!label) {
            if (type == 'number' || type == 'text' || type == 'password') {
                let lll = label.toLowerCase();
                return {
                    placeholder: lll.startsWith('nhập') ? label : `${formatMessage({ defaultMessage: 'Nhập' })} ${label.toLowerCase()}`
                }
            } else {
                return {
                    placeholder: `${formatMessage({ defaultMessage: 'Chọn' })} ${label.toLowerCase()}`
                }
            }
        }
        return {}
    }, [label]);

    return (
        <div
            style={{
                marginBottom: !!(touched[field.name] || submitCount != _refSubmitCount.current) && !!errors[field.name] ? '1rem' : '0rem'
            }}
        >
            {label && <label className="col-form-label">
                {label}{!!required && <span className='text-danger' > *</span>} {_renderTooltip()}</label>}
            <div className={`input-group mb-2 d-flex ${['name', 'width', 'length', 'height', 'weight'].some(__ => __ == field?.name?.split('_')[0]) ? '' : 'justify-content-center'}`} style={{ position: 'relative' }} >
                {
                    visible && !isNotChange ? (
                        <>
                            <div style={{ top: -10 }} className={`input-group ${getFieldCSSClasses(touched[field.name] || submitCount != _refSubmitCount.current, errors[field.name])}`} ref={_refInput}>
                                {
                                    type == 'number' ? (
                                        <NumberFormat
                                            className={"form-control"}
                                            thousandSeparator={true}
                                            {...field}
                                            {...props}
                                            value={field.value}
                                            onChange={e => {
                                                // field.onChange(e)
                                            }}
                                            onValueChange={value => {                                                
                                                if (decimalScale == 0) {
                                                    if (!value.floatValue)
                                                        setFieldValue(field.name, typeof value.floatValue == 'number' ? value.floatValue : (isFieldStock ? 0 : undefined))
                                                    else
                                                        setFieldValue(field.name, typeof value.floatValue == 'number' ? Math.floor(value.floatValue) : (isFieldStock ? 0 : undefined))
                                                } else {
                                                    setFieldValue(field.name, typeof value.floatValue == 'number' ? value.floatValue : (isFieldStock ? 0 : undefined))
                                                }
                                                setFieldValue('__changed__', true)
                                            }}
                                            style={{ background: '#F7F7FA', border: 'none' }}
                                            {...placeholders}
                                            decimalScale={decimalScale}
                                            allowNegative={false}
                                        />
                                    ) : (
                                        <input
                                            type={type}
                                            className={"form-control"}
                                            {...field}
                                            {...props}
                                            value={innerValue}
                                            style={{ background: '#F7F7FA', border: 'none', color: props.disabled ? '#00000073' : undefined }}
                                            onBlur={(e) => {
                                                field.onBlur(e)
                                                field.onChange(e)
                                                !values['__changed__'] && setFieldValue('__changed__', true)
                                                !!onBlurChange && onBlurChange(e.target.value)
                                            }}
                                            onChange={e => {
                                                setInnerValue(e.target.value);
                                            }}
                                            {...placeholders}
                                        />
                                    )
                                }
                                {!!addOnRight && <div className="input-group-append" style={{ background: '#F7F7FA', border: 'none', borderTopRightRadius: 6, borderBottomRightRadius: 6 }}><span className="input-group-text" style={{ background: '#F7F7FA', border: 'none' }}>{addOnRight}</span></div>}
                                {countChar && <div className="input-group-append" style={{ background: '#F7F7FA', border: 'none', borderTopRightRadius: 6, borderBottomRightRadius: 6 }}><span className="input-group-text" style={{ background: '#F7F7FA', border: 'none' }}>{`${(field.value || '').length}/${maxChar}`}</span></div>}
                            </div>
                        </>
                    ) : (
                        <p
                            className={`d-flex`}
                            style={{
                                marginBottom: '0rem',
                                alignItems: 'baseline',
                                fontSize: 14,
                                color: !!(touched[field.name] || submitCount != _refSubmitCount.current) && !!errors[field.name] ? 'red' : ''
                            }}
                            onClick={() => {
                                if (isNotChange) return;
                                setVisible(true)
                            }}
                        >
                            <span className="mr-2 text-truncate-create-onstore">
                                {(!!field.value || field.value == 0) ? `${!!prefix ? `${prefix}: ` : ''} ${type == 'number' ? formatNumberToCurrency(field.value) : field.value} ${addOnRight}` : nameTxt}
                            </span> {!isNotChange && <i
                                className="far fa-edit cursor-pointer"
                                style={{ color: !!(touched[field.name] || submitCount != _refSubmitCount.current) && !!errors[field.name] ? 'red' : 'black', fontSize: 14 }}
                            ></i>
                            }
                        </p>
                    )
                }
            </div>
            {withFeedbackLabel && (
                <FieldFeedbackLabel
                    error={errors[field.name]}
                    touched={touched[field.name] || submitCount != _refSubmitCount.current}
                    label={label}
                    type={type}
                    customFeedbackLabel={customFeedbackLabel}
                    absolute={absolute}
                />
            )}
        </div>
    );
});

export { InputVertical };