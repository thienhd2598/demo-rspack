/*
 * Created by duydatpham@gmail.com on 01/03/2022
 * Copyright (c) 2022 duydatpham@gmail.com
 */
import { useFormikContext } from "formik";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { useCreateMultiContext } from "../CreateMultiContext";
import { useIntl } from "react-intl";


export default memo(({ channel_name, productId, index, disabled, selectedCategory }) => {
    const { products } = useCreateMultiContext()
    const [show, setShow] = useState('')
    const { values, setFieldValue } = useFormikContext()
    const _refCurrentProduct = useRef(products)
    const _refCurrentCategory = useRef(values[`category-${index}`])
    const {formatMessage} = useIntl()
    useEffect(() => {
        if (values[`${index}::changed`]) {
            let type = values[`${index}::changed`].split('-')[0]
            if (type == 'category')
                setShow(type)
            else {
                if (products.some((_pro, _index) => {
                    return _index != index && !!_refCurrentCategory.current && _refCurrentCategory.current.length > 0 && _refCurrentCategory.current[_refCurrentCategory.current.length - 1].id == _pro.category?.id
                })) {
                    setShow(type)
                }
            }
        }
    }, [values[`${index}::changed`], index, channel_name])

    useMemo(() => {
        _refCurrentProduct.current = products
    }, [products])
    useMemo(() => {
        _refCurrentCategory.current = values[`category-${index}`]
    }, [values[`category-${index}`]])

    if (show.length == 0 || disabled) {
        return null
    }
    return <div style={{
        backgroundColor: 'rgba(254, 86, 41, 0.51)',
        position: 'absolute', left: 0, right: 0, bottom: 0,
        paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16,
        display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
    }} >
        <span>{show == 'category' ? formatMessage({defaultMessage: `Bạn có muốn chọn ngành hàng tương tự cho các sản phẩm còn lại không?`}) : formatMessage({defaultMessage:`Bạn có muốn chọn thương hiệu tương tự cho các sản phẩm cùng ngành hàng còn lại không?`})}</span>
        <div>
            <button
                type="button"
                onClick={() => setShow('')}
                className="btn  btn-light btn-elevate"
                style={{ width: 100, marginRight: 16 }}
            >
                {formatMessage({defaultMessage:'HỦY'})}
            </button>
            <button
                type="button"
                onClick={() => {
                    let category = values[`category-${index}`];
                    let brand = values[`brand-${index}`];
                    products.forEach((_pro, _index) => {
                        if (_index != index) {
                            // if (_index != index && _pro.raw.id == productId) {
                            if (show == 'category') {
                                setFieldValue(`category-${_index}`, category)
                                selectedCategory(_index, category[category.length - 1], _pro.attributesSelected, brand, true)

                                // if (_pro?.channel?.connector_channel_code != 'tiktok') return;
                                // if (_pro.attributesSelected.length == 0) {
                                //     setFieldValue(`attribute-1-${_index}`, undefined);
                                // } else {
                                //     _pro.attributesSelected.forEach(_attr => {
                                //         setFieldValue(`attribute-${_attr?.id}-${_index}`, undefined);
                                //     })
                                // }
                            }
                            if (show == 'brand' && category[category.length - 1].id == _pro.category?.id) {
                                setFieldValue(`brand-${_index}`, brand)
                            }
                        }
                    })
                    setShow('')
                }}
                className="btn btn-primary btn-elevate"
                style={{ width: 100 }}
            >
                {formatMessage({defaultMessage:'ĐỒNG Ý'})}
            </button>
        </div>
    </div>
})