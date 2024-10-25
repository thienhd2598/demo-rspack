/*
 * Created by duydatpham@gmail.com on 15/11/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */

import { useQuery } from "@apollo/client";
import { useFormikContext } from "formik";
import React, { memo, useEffect } from "react";
import { useProductsUIContext } from "../ProductsUIContext";
import scGetCategorySuggestion from '../../../../graphql/query_scGetCategorySuggestion'
import { useIntl } from 'react-intl';

const findRoot = (id, lst) => {
    let res = []
    let end = lst.find(_cate => _cate.id == id)

    while (!!end) {
        res = [end, ...res]
        end = lst.find(_cate => _cate.id == end.parent_id)
    }
    return res
}

export default memo(({ categoryList, isEdit }) => {
    const { formatMessage } = useIntl();
    const { currentChannel, setCategorySelected, productEditing } = useProductsUIContext();
    const { setFieldValue, values } = useFormikContext()

    const { data, loading, error } = useQuery(scGetCategorySuggestion, {
        variables: {
            product_name: values['name'],
            store_id: currentChannel?.value
        },
        skip: !currentChannel?.value
    })

    useEffect(() => {
        if (!!productEditing) {            
            let path = findRoot(productEditing.sc_category_id, categoryList);
            if (path.length > 0) {                                               
                setCategorySelected(path[path.length - 1])
                setFieldValue('category', path, true)
            }
        }
    }, [productEditing, categoryList])

    if (isEdit) return null;

    return <div className='mb-8'>
        <p>{formatMessage({ defaultMessage: 'Gợi ý ngành hàng' })}</p>
        {loading && <span className="spinner spinner-primary" style={{ marginTop: 20 }} ></span>}
        {
            data?.scGetCategorySuggestion?.map((_suggest, _index) => {
                return <p key={`--index-${_index}`} >
                    <a href={'#'}
                        onClick={e => {
                            e.preventDefault()
                            let path = findRoot(_suggest.sc_category_id, categoryList);
                            if (path.length > 0) {
                                setCategorySelected(path[path.length - 1])
                                setFieldValue('category', path, true)
                            }
                        }}
                    >• {_suggest.category_path}</a>
                </p>
            })
        }
    </div>
})