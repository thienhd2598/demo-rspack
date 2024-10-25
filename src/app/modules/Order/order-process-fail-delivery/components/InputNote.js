import React, { useMemo, useRef, useState, useEffect, memo } from "react";
import { OverlayTrigger } from "react-bootstrap";
import { Tooltip } from "react-bootstrap";
import { useFormikContext } from "formik";
import * as Yup from "yup";
import { useIntl } from "react-intl";
import _ from 'lodash';
import { FieldFeedbackLabel } from "../../../../../_metronic/_partials/controls";

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

const InputNote = memo(({
    field, // { name, value, onChange, onBlur }
    form: { touched, errors, submitCount, values }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
    prefix = "",
    isFieldStock = false,
    label,
    nameTxt = "",
    withFeedbackLabel = true,
    customFeedbackLabel,
    required = false,
    isNotChange = false,
    isInput = false,
    addOnRight = "",
    hasReceiverId = false,
    tooltip = "",
    onChanged,
    type = "text",
    countChar = false,
    maxChar,
    absolute = false,
    onBlurChange,
    decimalScale = 0,
    ...props
}) => {
    console.log('isInput', isInput)
    const { setFieldValue, setFieldError } = useFormikContext();
    console.log('errors', errors)
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
                marginBottom: !!(touched[field.name] || submitCount != _refSubmitCount.current) && !!errors[field.name] ? '1rem' : '0rem',
                flex: 1
            }}
        >
            {label && <label className="col-form-label">
                {label}{!!required && <span className='text-danger' > *</span>} {_renderTooltip()}</label>}
            <div className={`input-group mb-2 d-flex`} style={{ position: 'relative',...((hasReceiverId && !visible) ? {background: '#D9D9D9', padding: '6px 12px', borderRadius: '4px'} : {})}} >
                {
                    visible && !isNotChange ? (
                        <>
                            <div className='w-100' style={{ position: 'relative' }} ref={_refInput}>
                                {isInput ? (
                                    <input
                                    type={type}
                                    className={"form-control"}
                                    {...field}
                                    {...props}
                                    value={field.value || ''}
                                    style={{ background: '#F7F7FA', border: 'none', color: props.disabled ? '#00000073' : undefined }}
                                    onBlur={(e) => {
                                        field.onBlur(e)
                                        field.onChange(e)
                                        !values['__changed__'] && setFieldValue('__changed__', true)
                                        !!onBlurChange && onBlurChange(e.target.value)
                                    }}
                                    onChange={e => {
                                        !!onChanged && onChanged()
                                        field.onChange(e)
                                    }}
                                    {...placeholders}
                                />
                                ): (
                                <textarea
                                    type={type}
                                    className={"form-control"}
                                    {...field}
                                    {...props}
                                    value={field.value || ''}
                                    style={{ background: '#F7F7FA', border: 'none', color: props.disabled ? '#00000073' : undefined }}
                                    onBlur={(e) => {
                                        field.onBlur(e)
                                        field.onChange(e)
                                        !values['__changed__'] && setFieldValue('__changed__', true)
                                        !!onBlurChange && onBlurChange(e.target.value)
                                    }}
                                    onChange={e => {
                                        
                                        field.onChange(e)
                                    }}
                                    {...placeholders}
                                 />
                                )}
                                
                                {countChar && <span className="" style={{ position: 'absolute', right: 0, bottom: -22, color: 'rgba(0,0,0, 0.45)' }} >{`${(field.value || '').length}/${maxChar}`}</span>}
                            </div>
                        </>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                ...(isInput ? {justifyContent: 'space-between', width: '100%'} : {}),
                                marginBottom: '0rem',
                                alignItems: 'baseline',
                                fontSize: 14,
                                color: !!(touched[field.name] || submitCount != _refSubmitCount.current) && !!errors[field.name] ? 'red' : '#000000'
                            }}
                            onClick={() => {
                                if(isInput) return
                                if (isNotChange) return;
                                setVisible(true)
                            }}
                        >
                            {!!field.value ? (
                                <span className="mr-2 text-truncate-order-process" style={{ wordBreak: 'break-word' }}>
                                    {(!!field.value || field.value === 0) ? `${!!prefix ? `${prefix}: ` : ''} ${field.value} ${addOnRight}` : nameTxt}
                                </span>
                            ) : (
                                <span className="mr-2">--</span>
                            )}
                            {!isNotChange && <i
                                  onClick={() => {
                                    if(isInput) {
                                        if (isNotChange) return;
                                        setVisible(true)
                                    }
                                }}
                                className="far fa-edit cursor-pointer"
                                style={{ color: !!(touched[field.name] || submitCount != _refSubmitCount.current) && !!errors[field.name] ? 'red' : 'black', fontSize: 14 }}
                            ></i>
                            }
                        </div>
                    )
                }
            </div>
            {visible && isInput && (
                <div className="invalid-feedback " style={absolute ? {
                position: 'absolute', top: 36, textOverflow: 'ellipsis',
                whiteSpace: 'wrap', overflow: 'hidden', display: 'block',
                fontSize: 10
            } : { display: 'block' }} >
                {formatMessage({defaultMessage: 'Sửa địa chỉ sẽ tạo bản ghi mới trên CRM'})}
            </div>
            )}
            
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

export { InputNote };