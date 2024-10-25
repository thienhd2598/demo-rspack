/*
 * Created by duydatpham@gmail.com on 09/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useFormikContext } from 'formik';
import React, { memo, useRef } from 'react'
import { FieldFeedbackLabel, InputVertical } from '../../../../../_metronic/_partials/controls';
import { useProductsUIContext } from '../../ProductsUIContext';
import Select from 'react-select'
export default memo(({ value, index, attribute_id, options = [], onChange, hasProductChannel }) => {
    const {
        removeValueToAttributeSelected,
        updateValueToAttributeSelected
    } = useProductsUIContext();
    const { setFieldValue, errors, touched, values, submitCount, setFieldTouched } = useFormikContext();

    const _refsubmitCount = useRef(submitCount)
    let name = `att-${attribute_id}-${value.code}`
    let editing = `att-${attribute_id}-${value.code}-editing`

    return <div className="input-group mb-4">
        <Select options={options}
            value={options.find(_op => _op.value == values[name])}
            onChange={v => {
                console.log('value', v.value)
                setFieldValue(name, v.value)
                updateValueToAttributeSelected(attribute_id, v.value, value.code)
                !!onChange && onChange()
                setFieldValue('__changed__', true)
            }}
            styles={{
                container: (styles) => ({
                    ...styles,
                    flex: 1
                }),
                control: (styles) => ({
                    ...styles,
                    ...(errors[name] && (touched[name] || _refsubmitCount.current != submitCount) ? { borderColor: '#f14336' } : { border: 'none' }),
                    backgroundColor: '#F7F7FA'
                })
            }}
            onBlur={() => setFieldTouched(name, true)}
            autoFocus
            // isDisabled={hasProductChannel && !!values[editing]}
        />
        {/* <div className="input-group-append">
            <button className="btn btn-light-success" type="button"><i className="fas fa-sort-amount-up-alt"></i></button>
        </div> */}
        {
            (!hasProductChannel || !values[editing]) && <div className="input-group-append" style={{ zIndex: 1 }} >
                <button className="btn btn-light-danger" type="button"
                    onClick={e => {
                        e.preventDefault();
                        removeValueToAttributeSelected(attribute_id, value.code)
                        setFieldValue('__changed__', true)
                    }}
                ><i className="far fa-trash-alt"></i></button>
            </div>
        }
        <FieldFeedbackLabel
            error={errors[name]}
            touched={touched[name] || _refsubmitCount.current != submitCount}
            label={false}
            type={'text'}
            customFeedbackLabel={''}
        />
    </div>
})