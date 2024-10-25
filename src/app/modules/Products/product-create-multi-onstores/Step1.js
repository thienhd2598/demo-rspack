/*
 * Created by duydatpham@gmail.com on 24/02/2022
 * Copyright (c) 2022 duydatpham@gmail.com
 */
import React, { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react";
import CategorySelect from "../../../../components/CategorySelect";
import {
    Card,
    CardBody
} from "../../../../_metronic/_partials/controls";
import { useCreateMultiContext } from "./CreateMultiContext";
import * as Yup from "yup";
import { Field, Form, Formik } from "formik";
import { useQuery, useLazyQuery } from "@apollo/client";
import { useHistory } from "react-router-dom";
import _, { result } from "lodash";
import { ReSelectBranch } from "../../../../components/ReSelectBranch";
import SuggestStep1 from "./components/SuggestStep1";
import PopupAlert from "./dialog/PopupAlert";
import SetCache from "./components/SetCache";
import { RouterPrompt } from '../../../../components/RouterPrompt';
import { createApolloClientSSR } from '../../../../apollo';
import op_sale_channel_categories from "../../../../graphql/op_sale_channel_categories";
import query_scGetAttributeByCategory from "../../../../graphql/query_scGetAttributeByCategory";
import { useIntl } from "react-intl";
import { ATTRIBUTE_VALUE_TYPE } from '../../ProductsStore/ProductsUIHelpers';
import { ReSelect } from '../../../../_metronic/_partials/controls/forms/ReSelect';
import { ReSelectVertical } from '../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import { InputVertical } from '../../../../_metronic/_partials/controls';
import { Element, Link, animateScroll, scroller } from 'react-scroll';
import { randomString } from "../../../../utils";
import slugify from "react-slugify";
import PopupConfirm from "./dialog/PopupConfirm";
import InfoProduct from "../../../../components/InfoProduct";
import { useToasts } from "react-toast-notifications";
const regex = new RegExp("[^\u0000-\u007F]+")

export default memo(() => {
    const client = createApolloClientSSR();
    const { formatMessage } = useIntl();
    const { products, setProducts, setStep, setStepPassed, cacheStep1, setCacheStep1 } = useCreateMultiContext()
    const { addToast } = useToasts();
    const history = useHistory()
    const { channels } = history?.location?.state || {};
    const [categories, setCategories] = useState({})
    const [showPopupAlert, setShowPopupAlert] = useState(false);
    const [loadingMappingAttribute, setLoadingMappingAttribute] = useState(null);
    const [errorMessage, setErrorMessage] = useState([]);
    const [indexPopupConfirm, setIndexPopupConfirm] = useState(-1);
    const [productRemoveIndex, setProductRemoveIndex] = useState([]);

    const [connector_channel_code, connector_channel_name] = useMemo(() => {
        return [channels?.length > 0 ? channels[0].connector_channel_code : '', channels?.length > 0 ? channels[0].connector_channel_name : '']
    }, [channels])

    const { data, loading } = useQuery(op_sale_channel_categories, {
        variables: {
            connector_channel_code: connector_channel_code,
        },
        skip: !connector_channel_code
    });

    useMemo(() => {
        let _categories = _.groupBy(data?.sc_sale_channel_categories, _cate => _cate.parent_id || 'root');
        setCategories(_categories)
    }, [data]);

    const initialValues = useMemo(
        () => {
            let values = cacheStep1;

            let checkCacheAttribute = Object.keys(cacheStep1).some(_key => _key.startsWith('attribute'));
            if (!!checkCacheAttribute) return values;

            products.forEach((product, _index) => {
                // let isLzdOrTiktok = product?.channel?.connector_channel_code === 'tiktok' || product?.channel?.connector_channel_code === 'lazada';

                // let attributes = product?.attributesSelected?.length === 0 && isLzdOrTiktok ? {
                //     [`attribute-1-${_index}`]: undefined
                // } : 
                let attributes = product?.attributesSelected?.reduce(
                    (result, value) => {
                        // if (product?.channel?.connector_channel_code === 'tiktok') {
                        //     result[`attribute-${value?.id}-${_index}`] = undefined;
                        // } else {
                        // }
                        result[`attribute-${value?.id}-${_index}`] = {
                            label: value?.display_name || '',
                            value: value?.display_name || '',
                            __isNew__: true
                        }

                        return result
                    }, {});

                values = {
                    ...values,
                    ...attributes
                }
            });

            return values;
        }, [products, cacheStep1]
    );

    const validationSchema = useMemo(() => {
        let schema = {};
        products.forEach((product, _index) => {
            const isShopee = product?.channel?.connector_channel_code === 'shopee';
            let isLzdOrTiktok = product?.channel?.connector_channel_code === 'tiktok' || product?.channel?.connector_channel_code === 'lazada';
            const MAX_LENGTH_NAME = isShopee ? 14 : 15;

            // let schemaAttribute = product?.attributesSelected?.length === 0 && product?.channel?.connector_channel_code === 'tiktok' ? {
            //     [`attribute-1-${_index}`]: Yup.object().required(formatMessage({ defaultMessage: "Vui lòng chọn nhóm phân loại" }))
            // } :
            let schemaAttribute = product?.attributesSelected?.reduce(
                (result, value) => {
                    result[`attribute-${value?.id}-${_index}`] = Yup.string()
                        .ensure()
                        .required(formatMessage({ defaultMessage: "Vui lòng chọn nhóm phân loại" }))

                    return result
                }, {}
            );

            schema = {
                ...schema,
                [`category-${_index}`]: Yup.array().required(formatMessage({ defaultMessage: 'Vui lòng chọn ngành hàng' })),
                [`brand-${_index}`]: Yup.object().required(formatMessage({ defaultMessage: 'Vui lòng chọn thương hiệu' })),
                ...schemaAttribute
            }
        })

        return Yup.object().shape(schema)
    }, [products]);

    const _buildAttributeProductStore = useCallback(
        (attribute, channelCode, customAttributes, index, idsExist = [], setFieldValue) => {
            const optionsAttribute = customAttributes
                ?.filter(_pro => !idsExist?.some(id => `${_pro?.id}-${index}` == id))
                ?.map(_pro => {
                    return {
                        label: _pro.display_name,
                        value: String(_pro.id),
                    }
                });

            switch (channelCode) {
                case "shopee": 
                case "tiktok":
                    return <Field
                        name={`attribute-${attribute?.id}-${index}`}
                        component={ReSelectVertical}
                        isCreatable={true}
                        placeholder={formatMessage({
                            defaultMessage: 'Tên nhóm phân loại',
                        })}
                        hideBottom
                        customFeedbackLabel={' '}
                        onChanged={value => { }}
                        onCreateOption={value => {
                            if (value?.trim()?.length > 14) {
                                addToast(formatMessage({ defaultMessage: 'Tên nhóm phân loại không được vượt quá 14 ký tự' }), { appearance: 'error' });
                                return;
                            } else {
                                setFieldValue(`attribute-${attribute?.id}-${index}`, {
                                    value: value,
                                    label: value,
                                    __isNew__: true
                                });
                            }
                        }}
                        options={optionsAttribute}
                        cols={['col-0', 'col-12']}
                    />
                case "lazada":
                    return <Field
                        name={`attribute-${attribute?.id}-${index}`}
                        component={ReSelectVertical}
                        isCreatable={true}
                        placeholder={formatMessage({
                            defaultMessage: 'Tên nhóm phân loại',
                        })}
                        hideBottom
                        customFeedbackLabel={' '}
                        onChanged={value => {
                            console.log({ value });
                        }}
                        onCreateOption={value => {
                            if (value?.trim()?.length > 15) {
                                addToast(formatMessage({ defaultMessage: 'Tên nhóm phân loại không được vượt quá 15 ký tự' }), { appearance: 'error' });
                                return;
                            } else {
                                setFieldValue(`attribute-${attribute?.id}-${index}`, {
                                    value: value,
                                    label: value,
                                    __isNew__: true
                                })
                            }
                        }}
                        options={optionsAttribute}
                        cols={['col-0', 'col-12']}
                    />
                default:
                    return null;
            }
        }, []
    );

    const _selectedCategory = useCallback(async (index, category, connector_channel_code, attributesSelected = [], setFieldValue, brand, noChanged) => {
        console.log({ index, category, connector_channel_code, attributesSelected })
        setLoadingMappingAttribute(index);
        setTimeout(
            () => {
                setLoadingMappingAttribute(null);
            }, 1000
        )

        const { data } = await client.query({
            query: query_scGetAttributeByCategory,
            variables: {
                category_id: category?.id,
                sc_store_id: channels[0].value
            }
        })

        if (data?.scGetAttributeByCategory?.length > 0) {
            let _attributes = (data?.scGetAttributeByCategory || [])
                .filter(_op => _op.attribute_type == 1 && (connector_channel_code === 'lazada' ? _op.is_sale_prop == 1 : true))
                .map(_op => {
                    let options = _op.attribute_options;
                    let unit_options = _op.unit_options;
                    if (_op.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT ||
                        _op.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT) {
                        unit_options = [];
                    }
                    const groups = _op?.attribute_groups?.map(group => {
                        const groupOptions = options?.filter(op => op?.sc_attribute_group_id == group?.id);
                        return {
                            ...group,
                            options: groupOptions
                        }
                    }) || [];

                    return { ..._op, options, unit_options, groups }
                });

            setProducts(prev => {
                return prev.map((_pp, _idx) => {
                    if (_idx == index) {
                        return {
                            ..._pp,
                            productCustomAttributes: _attributes
                        }
                    }
                    return _pp
                })
            })
        }

        // if (!!attributesSelected && attributesSelected?.length === 0 && connector_channel_code == 'tiktok') {
        //     setFieldValue(`attribute-1-${index}`, undefined);
        // }

        // let attributes = attributesSelected?.length === 0 && connector_channel_code == 'tiktok' ? {
        //     [`attribute-1-${index}`]: undefined
        // } : 
        let attributes = attributesSelected?.reduce(
            (result, value) => {
                // if (connector_channel_code === 'tiktok') {
                //     result[`attribute-${value?.id}-${index}`] = undefined;
                //     setFieldValue(`attribute-${value?.id}-${index}`, undefined)
                // } else {
                // }
                result[`attribute-${value?.id}-${index}`] = {
                    label: value?.display_name || '',
                    value: value?.display_name || '',
                    __isNew__: true
                }
                setFieldValue(`attribute-${value?.id}-${index}`, {
                    label: value?.display_name || '',
                    value: value?.display_name || '',
                    __isNew__: true
                })

                return result
            }, {});


        // if (!!attributesSelected && attributesSelected?.length === 0 && connector_channel_code === 'tiktok') {
        //     setFieldValue(`isDefault-${index}`, true)
        // }
        setStepPassed({ step0: true })
        if (!noChanged) {
            setFieldValue('__changed__', true)
            setFieldValue(`${index}::changed`, `category-${Date.now()}`)
        }
        setFieldValue(`brand-${index}`, brand)
        setProducts(prev => {
            return prev.map((_pp, _idx) => {
                if (_idx == index) {
                    return {
                        ..._pp,
                        category,
                        productAttributes: null
                    }
                }
                return _pp
            })
        })
    }, [])

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            enableReinitialize
        >
            {({
                handleSubmit,
                values,
                validateForm,
                setFieldValue,
                ...rest
            }) => {
                console.log({ values, initialValues });
                const changed = values['__changed__'];

                return (
                    <>
                        <RouterPrompt
                            // when={changed}
                            when={true}
                            title={formatMessage({ defaultMessage: "Bạn đang tạo sản phẩm. Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?" })}
                            cancelText={formatMessage({ defaultMessage: "KHÔNG" })}
                            okText={formatMessage({ defaultMessage: "CÓ, THOÁT" })}
                            onOK={() => true}
                            onCancel={() => false}
                        />
                        <PopupConfirm
                            show={indexPopupConfirm >= 0}
                            onHide={() => setIndexPopupConfirm(-1)}
                            onConfirm={e => {
                                e.preventDefault();

                                if (productRemoveIndex?.length == products?.length - 1) {
                                    return history.push(`/products/list`);
                                }

                                setProductRemoveIndex(prev => [...prev, indexPopupConfirm]);
                                setIndexPopupConfirm(-1);
                            }}
                        />
                        <Form>
                            <Card>
                                <CardBody>
                                    <div style={{
                                        boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                                        // height: "calc(100vh - 340px)",
                                        borderRadius: 6,
                                        marginTop: 20,
                                        width: '100%',
                                        // overflowY: 'scroll'
                                    }} >
                                        <table className="table table-borderless product-list fixed" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', position: 'relative' }}>
                                            <thead style={{ background: '#f3f8fa' }}>
                                                <tr>
                                                    <th style={{
                                                        border: '1px solid #D9D9D9', borderRight: 'none',
                                                        width: "35%", padding: 16,
                                                        fontSize: '14px'
                                                    }}>
                                                        {formatMessage({ defaultMessage: 'Sản phẩm' })}
                                                    </th>
                                                    <th style={{
                                                        border: '1px solid #D9D9D9', borderLeft: 'none',
                                                        padding: 16, width: '55%', borderRight: 'none',
                                                        fontSize: '14px'
                                                    }}>
                                                        {formatMessage({ defaultMessage: 'Thông tin' })}
                                                    </th>
                                                    <th className="text-center" style={{
                                                        border: '1px solid #D9D9D9', borderLeft: 'none',
                                                        padding: 16, width: '10%',
                                                        fontSize: '14px'
                                                    }}>
                                                        {formatMessage({ defaultMessage: 'Thao tác' })}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody >
                                                {
                                                    products.map((_product, index) => {
                                                        // let attributeMapping = ((!!values[`isDefault-${index}`] || _product?.attributesSelected?.length == 0) && _product?.channel?.connector_channel_code === 'tiktok') ? [{
                                                        //     id: 1,
                                                        //     display_name: formatMessage({ defaultMessage: 'Mặc định' })
                                                        // }] :
                                                        let attributeMapping = (_product?.attributesSelectedSave || _product?.attributesSelected);

                                                        let idsExist = Object?.keys(values)
                                                            ?.filter(_key => _key.startsWith('attribute'))
                                                            ?.reduce(
                                                                (result, val) => {
                                                                    if (!!values[val] && Number(val.split('-')[2]) == index) {
                                                                        result.push(`${values[val]?.value}-${index}`)
                                                                    }
                                                                    return result
                                                                }, [])

                                                        let existProductRemove = productRemoveIndex.some(_index => _index === index);
                                                        if (existProductRemove) return null;

                                                        return <Fragment>
                                                            <Element id={`product-${index}`} />
                                                            {errorMessage?.some(_err => _err === index) && (
                                                                <tr>
                                                                    <td colSpan={2}>
                                                                        <div className='bg-danger text-white py-4 px-4  rounded-sm' >
                                                                            {`[${_product?.raw?.name?.length > 50 ? `${_product?.raw?.name?.slice(0, 50)}...` : _product?.raw?.name}]: ${formatMessage({ defaultMessage: 'Tên nhóm phân loại không được trùng nhau' })}`}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            <tr key={`product-row-${index}`} className="pb-8" style={{ borderBottom: '1px solid #D9D9D9', position: 'relative' }}>
                                                                <td style={{ padding: 16 }} >
                                                                    <div style={{
                                                                        verticalAlign: 'top', display: 'flex',
                                                                        flexDirection: 'row', marginBottom: 16,
                                                                        marginTop: 8
                                                                    }}>
                                                                        <div style={{
                                                                            backgroundColor: '#F7F7FA',
                                                                            width: 80, height: 80,
                                                                            borderRadius: 8,
                                                                            overflow: 'hidden',
                                                                            minWidth: 80
                                                                        }} className='mr-6' >
                                                                            <img src={_product.productFiles[0]?.source} style={{ width: 80, height: 80, objectFit: 'contain' }} />
                                                                        </div>
                                                                        <div className="w-100">
                                                                            <InfoProduct
                                                                                name={_product.raw?.name_seo}
                                                                                sku={''}
                                                                                url={`/products/edit/${_product.raw?.id}`}
                                                                            />
                                                                            <p className="d-flex" ><img style={{ width: 20, height: 20 }} src={_product.channel?.logo} className="mr-2" /><span >{_product.channel?.label}</span></p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: 16, paddingBottom: 48 }} >
                                                                    <CategorySelect categories={categories}
                                                                        key={`category-${index}`}
                                                                        name={`category-${index}`}
                                                                        selected={_product.category}
                                                                        disablePaddingTop={true}
                                                                        onSelect={async category => {
                                                                            await _selectedCategory(index, category, _product?.channel?.connector_channel_code, _product?.attributesSelected, setFieldValue)
                                                                        }}
                                                                    />
                                                                    {
                                                                        (!!_product.category || connector_channel_code != 'shopee') && (
                                                                            <Field
                                                                                name={`brand-${index}`}
                                                                                component={ReSelectBranch}
                                                                                placeholder={formatMessage({ defaultMessage: 'Chọn thương hiệu' })}
                                                                                label={formatMessage({ defaultMessage: 'Thương hiệu' })}
                                                                                customFeedbackLabel={' '}
                                                                                required
                                                                                connector_channel_code={connector_channel_code}
                                                                                sc_category_id={connector_channel_code == 'shopee' ? _product.category.id : null}
                                                                                cols={['col-12', 'col-12']}
                                                                                onChange={vv => {
                                                                                    setFieldValue(`${index}::changed`, `brand-${Date.now()}`)
                                                                                }}
                                                                            />
                                                                        )
                                                                    }
                                                                    {typeof loadingMappingAttribute === 'number' && loadingMappingAttribute === index && !!_product?.category && <div className='text-center mt-4 mb-10' style={{ position: 'absolute' }} >
                                                                        <span className="ml-3 spinner spinner-primary"></span>
                                                                    </div>}
                                                                    {(typeof loadingMappingAttribute != 'number' || loadingMappingAttribute != index) && !!_product?.category && attributeMapping?.length > 0 && (
                                                                        <div className='d-flex flex-column mt-8'>
                                                                            <p className='mb-4'>{formatMessage({ defaultMessage: 'Chọn nhóm phân loại tương ứng giữa kho và sàn' })}</p>
                                                                            <div
                                                                                style={{
                                                                                    boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                                                                                    borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6, borderTopLeftRadius: 6
                                                                                }}
                                                                            >
                                                                                <table className="table table-borderless table-vertical-center fixed mb-0">
                                                                                    <thead style={{
                                                                                        borderBottom: '1px solid #F0F0F0'
                                                                                    }}>
                                                                                        <th width="40%">
                                                                                            {formatMessage({ defaultMessage: 'Nhóm phân loại kho' })}
                                                                                        </th>
                                                                                        <th></th>
                                                                                        <th width="40%">
                                                                                            {formatMessage({ defaultMessage: 'Nhóm phân loại trên sàn' })}
                                                                                        </th>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {attributeMapping?.map(
                                                                                            (_attr, _index) => (
                                                                                                <tr className='py-6' style={_index === attributeMapping?.length - 1 ? {} : { borderBottom: '1px solid #F0F0F0' }}>
                                                                                                    <td width="40%">{_attr?.display_name}</td>
                                                                                                    <td width="20%">
                                                                                                        <div className="icon-arrow-product"></div>
                                                                                                    </td>
                                                                                                    <td width="40%">
                                                                                                        {_buildAttributeProductStore(_attr, _product?.channel?.connector_channel_code, _product?.productCustomAttributes, index, idsExist, setFieldValue)}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            )
                                                                                        )}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="text-center" style={{ padding: 16 }}>
                                                                    <p
                                                                        className="text-primary mt-4"
                                                                        style={{ cursor: 'pointer' }}
                                                                        onClick={() => setIndexPopupConfirm(index)}
                                                                    >
                                                                        {formatMessage({ defaultMessage: 'Xóa' })}
                                                                    </p>
                                                                </td>
                                                                <SuggestStep1
                                                                    channel_name={connector_channel_name}
                                                                    index={index}
                                                                    productId={_product.raw.id}
                                                                    selectedCategory={async (index, category, attributesSelected, brand) => {
                                                                        await _selectedCategory(index, category, _product?.channel?.connector_channel_code, attributesSelected, setFieldValue, brand, true)
                                                                    }}
                                                                    disabled={products?.length == 1}
                                                                />
                                                            </tr>
                                                        </Fragment>
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className='d-flex justify-content-end' >
                                        <button className="btn btn-secondary mr-2" style={{ width: 150 }} onClick={e => {
                                            e.preventDefault()
                                            history.push('/products/list')
                                        }} >{formatMessage({ defaultMessage: 'HỦY' })}</button>
                                        <button className="btn btn-primary mr-2" style={{ width: 150 }} onClick={async (e) => {
                                            e.preventDefault();
                                            let errMess = [];
                                            let error = await validateForm(values)

                                            let filterAttributes = Object.keys(values)
                                                ?.filter(_key => _key.startsWith('attribute'))
                                                ?.map(_attr => {
                                                    let [_key, id, index] = _attr?.split('-');
                                                    return {
                                                        id: Number(id),
                                                        index: Number(index)
                                                    }
                                                });
                                            console.log("filterAttributes", JSON.parse(JSON.stringify(filterAttributes)))
                                            console.log("values", JSON.parse(JSON.stringify(values)))

                                            const formatCheckValues = Object.keys(values)
                                                ?.filter(_key => _key.startsWith('attribute'))
                                                ?.map(_attr => {
                                                    let [_key, _id, index] = _attr?.split('-');

                                                    return {
                                                        index: Number(index),
                                                        value: values[_attr]
                                                    }
                                                })
                                                ?.reduce((result, val) => {
                                                    let checkedExist = !!result[val.index];
                                                    if (checkedExist) {
                                                        result[val.index].push(val.value)
                                                    } else {
                                                        result[val.index] = [val.value]
                                                    }

                                                    return result;
                                                }, {})

                                            Object.keys(formatCheckValues).forEach(
                                                _key => {
                                                    const parseVals = formatCheckValues[_key].map(_val => products[0]?.channel?.connector_channel_code != 'tiktok' ? _val?.label : _val)
                                                    const uniqVals = Array.from(new Set(parseVals));

                                                    if (
                                                        !(products[0]?.channel?.connector_channel_code === 'tiktok')
                                                        && uniqVals?.length < parseVals?.length
                                                    ) {
                                                        errMess.push(Number(_key));
                                                    }
                                                }
                                            )

                                            setErrorMessage(errMess);
                                            if (errMess?.length > 0) {
                                                scroller.scrollTo(`product-${errMess[0]}`, {
                                                    smooth: true,
                                                    duration: 1000,
                                                    offset: -100
                                                });
                                                return
                                            };

                                            const errorMapping = Object.keys(error).reduce(
                                                (resultError, currentKeyError) => {
                                                    const splitErrorKey = currentKeyError.split('-');
                                                    const indexErrorKey = splitErrorKey[splitErrorKey.length - 1];

                                                    const existProductRemove = productRemoveIndex.some(_index => indexErrorKey == _index);
                                                    if (existProductRemove) delete resultError[currentKeyError];

                                                    return resultError;
                                                }, { ...error }
                                            );

                                            if (Object.values(errorMapping).length == 0) {
                                                try {
                                                    setProducts(prev => {
                                                        return prev.map((product, _idx) => {
                                                            let isTiktok = product?.channel?.connector_channel_code === 'tiktok';
                                                            let isLazada = product?.channel?.connector_channel_code === 'lazada';

                                                            let newAttributeSelected;
                                                            const parseValues = filterAttributes?.map(_attr => {
                                                                let _keyAttr = ['attribute', _attr?.id, _attr.index]?.join('-');
                                                                return {
                                                                    id: _attr?.id,
                                                                    name: values[_keyAttr]?.label,
                                                                    sc_attribute_id: !values[_keyAttr]?.__isNew__ ? parseInt(values[_keyAttr]?.value) : null,
                                                                    groups: values[_keyAttr]?.groups || []
                                                                }
                                                            });

                                                            // if (product?.attributesSelected?.length === 0 && isTiktok) {
                                                            //     //Test
                                                            //     if (!parseValues[0]?.sc_attribute_id || parseValues[0]?.sc_attribute_id == null) {
                                                            //         setShowPopupAlert(true);
                                                            //     }
                                                            //     newAttributeSelected = [{
                                                            //         id: 1,
                                                            //         attribute_type: 1,
                                                            //         isCustom: true,
                                                            //         values: [{ v: formatMessage({ defaultMessage: 'Mặc định' }), code: 1 }],
                                                            //         display_name: parseValues[0]?.name,
                                                            //         name: slugify(parseValues[0]?.name),
                                                            //         sc_attribute_id: parseValues[0]?.sc_attribute_id,
                                                            //         groups: []
                                                            //     }]
                                                            // } else {
                                                            // }
                                                            newAttributeSelected = [...product?.attributesSelected]?.map(
                                                                _attr => {
                                                                    let findedAtrribute = parseValues?.find(_value => _value?.id == _attr?.id);

                                                                    if (findedAtrribute) {
                                                                        return {
                                                                            ..._attr,
                                                                            display_name: findedAtrribute?.name,
                                                                            name: slugify(findedAtrribute?.name),
                                                                            sc_attribute_id: findedAtrribute.sc_attribute_id,
                                                                            groups: findedAtrribute?.groups || []
                                                                        }
                                                                    }
                                                                    return _attr
                                                                }
                                                            )

                                                            return {
                                                                ...product,
                                                                category: values[`category-${_idx}`],
                                                                brand: values[`brand-${_idx}`],
                                                                attributesSelectedSave: product.attributesSelectedSave || product.attributesSelected,
                                                                attributesSelected: newAttributeSelected,
                                                            }
                                                        }).filter((_product, indexFilter) => !productRemoveIndex?.some(_idxProduct => _idxProduct === indexFilter))
                                                    })
                                                } catch (error) {

                                                }

                                                setStepPassed(prev => ({ ...prev, step0: true, step1: true }))
                                                setStep(1)
                                            } else {
                                                setShowPopupAlert(true);
                                                handleSubmit()
                                            }
                                        }}>{formatMessage({ defaultMessage: 'TIẾP TỤC' })}</button>
                                    </div>
                                    <SetCache set={setCacheStep1} />
                                </CardBody>
                            </Card>
                            <PopupAlert
                                show={showPopupAlert}
                                onHide={() => setShowPopupAlert(false)}
                            />
                        </Form>
                    </>
                )
            }}
        </Formik>
    )
})