/*
 * Created by duydatpham@gmail.com on 01/03/2022
 * Copyright (c) 2022 duydatpham@gmail.com
 */
import { useFormikContext } from "formik";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { useCreateMultiContext } from "../CreateMultiContext";
import { useIntl } from "react-intl";


export default memo(({ productId, index, disabled, categoryId }) => {
    const { products } = useCreateMultiContext()
    const [show, setShow] = useState('')
    const { values, setFieldValue } = useFormikContext()
    const _refIndex = useRef()
    const {formatMessage} = useIntl()
    useEffect(() => {
        if (values[`${categoryId}::changed`]) {
            _refIndex.current = values[`${categoryId}::changed`].split('::')[0]
            if (_refIndex.current == index)
                setShow(true)
            else
                setShow(false)
        }
    }, [values[`${categoryId}::changed`], index])

    if (!show || disabled) {
        return null
    }
    return <div style={{
        backgroundColor: 'rgba(254, 86, 41, 0.51)',
        position: 'absolute', left: 0, right: 0, bottom: 0,
        paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16,
        display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
    }} >
        <span>{formatMessage({defaultMessage: `Bạn có muốn nhập thông tin tương tự cho các sản phẩm khác cũng thuộc ngành hàng này không ?`})}</span>
        <div>
            <button
                type="button"
                onClick={() => setShow(false)}
                className="btn  btn-light btn-elevate"
                style={{ width: 100, marginRight: 16 }}
            >
                {formatMessage({defaultMessage:'HỦY'})}
            </button>
            <button
                type="button"
                onClick={() => {
                    products.forEach((_pro, _index) => {
                        // console.log('_index != _refIndex.current', _index, _refIndex.current, _pro.category[_pro.category.length - 1].id, categoryId)
                        if (_index != _refIndex.current && _pro.category[_pro.category.length - 1].id == categoryId) {
                            (_pro.productAttributes || []).forEach(_property => {
                                // console.log(_index, _property.id, values[`${_refIndex.current}-property-${_property.id}`])
                                setFieldValue(`${_index}-property-${_property.id}`, values[`${_refIndex.current}-property-${_property.id}`])
                                setFieldValue(`${_index}-property-${_property.id}-unit`, values[`${_refIndex.current}-property-${_property.id}-unit`]);
                            });
                            // requestAnimationFrame(() => {
                            // })

                        }
                    })
                    setShow(false)
                }}
                className="btn btn-primary btn-elevate"
                style={{ width: 100 }}
            >
                {formatMessage({defaultMessage:'ĐỒNG Ý'})}
            </button>
        </div>
    </div>
})