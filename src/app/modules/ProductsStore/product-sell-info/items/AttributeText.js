/*
 * Created by duydatpham@gmail.com on 09/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useFormikContext, Field } from 'formik';
import React, { memo, useRef } from 'react'
import { useIntl } from "react-intl";
import { FieldFeedbackLabel, InputVertical } from '../../../../../_metronic/_partials/controls';
import { useProductsUIContext } from '../../ProductsUIContext';
import { ReSelectVertical } from "../../../../../_metronic/_partials/controls/forms/ReSelectVertical";

const getFieldCSSClasses = (touched, errors) => {
    const classes = ["form-control"];
    // if (touched && errors) {
    //     // classes.push("is-invalid");
    // }

    // if (touched && !errors) {
    //     classes.push("is-valid");
    // }

    return classes.join(" ");
};

export default memo(({ value, first, last, attribute_id, onChange, hasProductChannel, isCreating }) => {
    const {
        removeValueToAttributeSelected,
        updateValueToAttributeSelected,
        setAttributesSelected,
        customAttributes,
        productEditing,
        currentChannel
    } = useProductsUIContext();
    const { formatMessage } = useIntl()
    const { setFieldValue, errors, touched, values, setFieldTouched, submitCount, setFieldError } = useFormikContext();
    const isLazada = currentChannel?.connector_channel_code === 'lazada';
    const _refsubmitCount = useRef(submitCount)

    let name = `att-${attribute_id}-${value.code}`
    let editing = `att-${attribute_id}-${value.code}-editing`


    return <div className={`input-group`}>
        <input type="text" name={name} className={getFieldCSSClasses(touched[name] || submitCount != _refsubmitCount.current, errors[name])} placeholder=""
            value={values[name] || ''}
            onChange={(e) => {
                let _value = e.target.value
                setFieldValue(name, _value)
                setFieldValue('__changed__', true)
            }}
            onBlur={e => {
                updateValueToAttributeSelected(attribute_id, e.target.value, value.code)
                setFieldTouched(name, true)
                !!onChange && onChange()
            }}
            style={{
                background: '#F7F7FA', borderRadius: 6,
                border: (touched[name] || submitCount != _refsubmitCount.current) && errors[name] ? '1px solid #f14336' : 'none',
                marginRight: 8,
                padding: '5px',
                marginLeft: 8
            }}
        // autoFocus
        // disabled={!!values[`disable-att-value-${attribute_id}-${value.code}`]}
        />
        {
            (!values[`disable-edit-attribute`] || !values[`disable-att-value-${attribute_id}-${value.code}`] || productEditing?.status == 2) && <div className="input-group-append" style={{ zIndex: 1 }} >
                <button className="btn btn-icon btn-light-danger" type="button"
                    onClick={e => {
                        e.preventDefault();
                        removeValueToAttributeSelected(attribute_id, value.code)
                        setFieldValue('__changed__', true)
                    }}
                ><i className="far fa-trash-alt"></i></button>
            </div>
        }
        {/* <div className="input-group-append">
            <button className="btn btn-icon btn-light-info" disabled={first} style={{ padding: 4 }}
                onClick={(e) => {
                    setAttributesSelected(prev => {
                        return prev.map(_att => {
                            if (_att.id == attribute_id) {
                                let currentIndex = -1;
                                let values = (_att.values || []).map((_vv, _i) => {
                                    if (_vv.code == value.code) {
                                        currentIndex = _i;
                                        return {
                                            ..._vv,
                                            order: _i - 1
                                        }
                                    }
                                    return _vv
                                })

                                values[currentIndex - 1] = { ...values[currentIndex - 1], order: currentIndex }
                                values.sort((_v1, _v2) => _v1.order - _v2.order)
                                return {
                                    ..._att,
                                    values
                                }
                            }
                            return _att
                        })
                    })
                }}
            ><i className="fas fa-sort-amount-up-alt"></i></button>
        </div> */}
        {/* <div className="input-group-append">
            <button className="btn btn-icon btn-light-info"
                disabled={last} style={{ padding: 4 }}
                onClick={(e) => {
                    setAttributesSelected(prev => {
                        return prev.map(_att => {
                            if (_att.id == attribute_id) {
                                let currentIndex = -1;
                                let values = (_att.values || []).map((_vv, _i) => {
                                    if (_vv.code == value.code) {
                                        currentIndex = _i;
                                        return {
                                            ..._vv,
                                            order: _i + 1
                                        }
                                    }
                                    return _vv
                                })

                                values[currentIndex + 1] = { ...values[currentIndex + 1], order: currentIndex }
                                values.sort((_v1, _v2) => _v1.order - _v2.order)
                                return {
                                    ..._att,
                                    values
                                }
                            }
                            return _att
                        })
                    })
                }}
            ><i className="fas fa-sort-amount-down-alt"></i></button>
        </div> */}
        {/* {
            (!isCreating || !values[`disable-att-value-${attribute_id}-${value.code}`]) && <div className="input-group-append" style={{ zIndex: 1 }} >
                <button className="btn btn-icon btn-light-danger" type="button"
                    onClick={e => {
                        e.preventDefault();
                        removeValueToAttributeSelected(attribute_id, value.code)
                        setFieldValue('__changed__', true)
                    }}
                ><i className="far fa-trash-alt"></i></button>
            </div>
        } */}
        <FieldFeedbackLabel
            error={errors[name]}
            touched={touched[name] || submitCount != _refsubmitCount.current}
            label={false}
            type={'text'}
            customFeedbackLabel={''}
        />
    </div>
})