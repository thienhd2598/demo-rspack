/*
 * Created by duydatpham@gmail.com on 24/02/2022
 * Copyright (c) 2022 duydatpham@gmail.com
 */
import React, { memo, useCallback, useMemo, useState, useEffect } from "react";
import CategorySelect from "../../../../components/CategorySelect";
import {
    Card,
    CardBody
} from "../../../../_metronic/_partials/controls";
import { useCreateMultiContext } from "./CreateMultiContext";
import * as Yup from "yup";
import { Field, Form, Formik } from "formik";
import { useQuery } from "@apollo/client";
import op_sale_channel_categories from "../../../../graphql/op_sale_channel_categories";
import { useHistory } from "react-router-dom";
import _ from "lodash";
import { ReSelectBranch } from "../../../../components/ReSelectBranch";
import SuggestStep1 from "./components/SuggestStep1";
import ProductAttributeStep2 from "./components/ProductAttributeStep2";
import { useIntl } from "react-intl";
import { ATTRIBUTE_VALUE_TYPE } from "../../../../constants";
import dayjs from "dayjs";
import PopupAlert from "./dialog/PopupAlert";
import SuggestStep2 from "./components/SuggestStep2";
import SetCache from "./components/SetCache";
import { RouterPrompt } from '../../../../components/RouterPrompt';
import { validateOriginVideo } from "../../../../utils";
import PopupConfirm from "./dialog/PopupConfirm";
import InfoProduct from "../../../../components/InfoProduct";

export default memo(() => {
    const { products, setProducts, setStep, setStepPassed, cacheStep2, setCacheStep2 } = useCreateMultiContext()
    const history = useHistory()
    const { channels } = history?.location?.state || {};
    const { formatMessage } = useIntl();
    const [showPopupAlert, setShowPopupAlert] = useState(false);
    const [indexPopupConfirm, setIndexPopupConfirm] = useState(-1);
    const [productRemoveIndex, setProductRemoveIndex] = useState([]);
    const [connector_channel_code, connector_channel_name] = useMemo(() => {
        return [channels?.length > 0 ? channels[0].connector_channel_code : '', channels?.length > 0 ? channels[0].connector_channel_name : '']
    }, [channels])

    console.log('90x', products)

    const _updateAttribute = useCallback((index, values) => {
        setProducts(prev => {
            return prev.map((_pro, _index) => {
                if (_index == index) {
                    return {
                        ..._pro,
                        ...values
                    }
                }
                return _pro
            })
        })
    }, [])


    const validationSchema = useMemo(() => {
        let schema = {};
        products.forEach((_product, _index) => {
            (_product.productAttributes || []).forEach(_property => {
                if (_property.unit_options?.length > 0 &&
                    _property.input_type != ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT_CUSTOM_VALUE &&
                    _property.input_type != ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT_CUSTOM_VALUE
                ) {
                    schema[`${_index}-property-${_property.id}-unit`] = Yup.string().notRequired()
                        .when(`${_index}-property-${_property.id}`, {
                            is: values => {
                                return !!values || values === 0 || values === '0' || (values || '').length > 0;
                            },
                            then: Yup.string().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'đơn vị' }))
                        })
                }
                if (_property.is_mandatory) {
                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.TEXT)
                        schema[`${_index}-property-${_property.id}`] = Yup.string().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() }))
                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC || _property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_INT || _property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_FLOAT)
                        schema[`${_index}-property-${_property.id}`] = Yup.number().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() }))
                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT || _property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT_CUSTOM_VALUE)
                        schema[`${_index}-property-${_property.id}`] = Yup.object().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() }))
                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT || _property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT_CUSTOM_VALUE)
                        schema[`${_index}-property-${_property.id}`] = Yup.array().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() }))
                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.DATE || _property.input_type == ATTRIBUTE_VALUE_TYPE.DATE_MONTH || _property.input_type == ATTRIBUTE_VALUE_TYPE.TIMESTAMP)
                        schema[`${_index}-property-${_property.id}`] = Yup.string().required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: (_property.display_name || '').toLowerCase() }))
                } else {
                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.TEXT)
                        schema[`${_index}-property-${_property.id}`] = Yup.string().notRequired()
                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC || _property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_INT || _property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_FLOAT)
                        schema[`${_index}-property-${_property.id}`] = Yup.number().notRequired()
                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT)
                        schema[`${_index}-property-${_property.id}`] = Yup.object().notRequired()
                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT)
                        schema[`${_index}-property-${_property.id}`] = Yup.array().notRequired()
                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.DATE || _property.input_type == ATTRIBUTE_VALUE_TYPE.DATE_MONTH || _property.input_type == ATTRIBUTE_VALUE_TYPE.TIMESTAMP)
                        schema[`${_index}-property-${_property.id}`] = Yup.string().notRequired()
                }
            });
        })

        return Yup.object().shape(schema)
    }, [products])

    const initialValues = useMemo(
        () => {
            let codOpen = products?.reduce(
                (result, product, index) => {
                    result[`is_cod_open_${index}`] = product?.form?.is_cod_open
                    return result;
                }, {}
            );

            return {
                ...cacheStep2,
                ...codOpen
            }
        }, [products, cacheStep2]
    );

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

                                if (productRemoveIndex.length == products.length - 1) {
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
                                        <table className="table table-borderless product-list  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', position: 'relative' }}>
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
                                                        {formatMessage({ defaultMessage: 'Thông tin thuộc tính' })}
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
                                                        let existProductRemove = productRemoveIndex.some(_index => _index === index);
                                                        if (existProductRemove) return null;

                                                        return <tr key={`product-row-${index}`} className="pb-8"
                                                            style={{ borderBottom: '1px solid #D9D9D9', position: 'relative' }}>
                                                            <td style={{ padding: 16 }} >
                                                                <div style={{
                                                                    verticalAlign: 'top', display: 'flex',
                                                                    flexDirection: 'row', marginBottom: 42,
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
                                                                    <div>
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
                                                                <ProductAttributeStep2
                                                                    category={_product.category[_product.category.length - 1]}
                                                                    index={index}
                                                                    storeId={channels[0].value}
                                                                    connectorChannelCode={connector_channel_code}
                                                                    updateAttribute={_updateAttribute}
                                                                />
                                                            </td>
                                                            <td style={{ width: 150, verticalAlign: 'initial' }}>
                                                                <div className="text-center">
                                                                    <p
                                                                        className="text-primary"
                                                                        style={{ cursor: 'pointer' }}
                                                                        onClick={() => setIndexPopupConfirm(index)}
                                                                    >
                                                                        {formatMessage({ defaultMessage: 'Xoá' })}
                                                                    </p>
                                                                </div>
                                                            </td>
                                                            <SuggestStep2
                                                                index={index}
                                                                productId={_product.raw.id}
                                                                categoryId={_product.category[_product.category.length - 1].id}
                                                                disabled={!products.some(_pro => _pro.raw.id != _product.raw.id && _pro.category[_pro.category.length - 1].id == _product.category[_product.category.length - 1].id)}
                                                            />
                                                        </tr>
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
                                        <button className="btn btn-primary mr-2"
                                            disabled={products.some(__ => !__.productAttributes)}
                                            style={{ width: 150 }} onClick={async (e) => {
                                                e.preventDefault();
                                                let error = await validateForm(values)

                                                const errorMapping = Object.keys(error).reduce(
                                                    (resultError, currentKeyError) => {
                                                        const splitErrorKey = currentKeyError.split('-');
                                                        const indexErrorKey = splitErrorKey[splitErrorKey.length - 1];

                                                        const existProductRemove = productRemoveIndex?.some(_index => indexErrorKey == _index);
                                                        if (existProductRemove) delete resultError[currentKeyError];

                                                        return resultError;
                                                    }, { ...error }
                                                );

                                                if (Object.values(errorMapping).length == 0) {
                                                    setProducts(prev => {
                                                        return prev.map((_pp, _idx) => {
                                                            let product_attributes = [];
                                                            (_pp.productAttributes || []).forEach(_property => {
                                                                let _value = values[`${_idx}-property-${_property.id}`];
                                                                let unit = values[`${_idx}-property-${_property.id}-unit`];

                                                                if (_value != undefined && _value != null) {
                                                                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.TEXT || _property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC || _property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_FLOAT || _property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_INT) {
                                                                        product_attributes.push({ attribute_id: _property.id, attribute_value: String(_value), unit: unit?.value || null })
                                                                    }
                                                                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT) {
                                                                        product_attributes.push({ attribute_id: _property.id, attribute_value: String(_value.value), unit: unit?.value || null })
                                                                    }
                                                                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT_CUSTOM_VALUE) {
                                                                        if (_value?.__isNew__) {
                                                                            product_attributes.push({
                                                                                attribute_id: _property.id,
                                                                                attribute_value: "",
                                                                                custom_attribute_values: [{ value: String(!!_value.raw_u ? _value.raw_v : _value.value), unit: _value.raw_u || null }],
                                                                                unit: _value.raw_u || null
                                                                            })
                                                                        } else {
                                                                            product_attributes.push({
                                                                                attribute_id: _property.id,
                                                                                attribute_value: !_value?.__isNew__ ? String(_value.value) : "",
                                                                                custom_attribute_values: _value?.__isNew__ ? [{ value: String(_value.value) }] : [],
                                                                                unit: unit?.value || null
                                                                            })
                                                                        }
                                                                    }
                                                                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.DATE || _property.input_type == ATTRIBUTE_VALUE_TYPE.DATE_MONTH || _property.input_type == ATTRIBUTE_VALUE_TYPE.TIMESTAMP) {
                                                                        product_attributes.push({ attribute_id: _property.id, attribute_value: String(dayjs(_value).unix()), unit: unit?.value || null })
                                                                    }
                                                                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT && !!_value && _value.length > 0) {
                                                                        product_attributes.push({ attribute_id: _property.id, attribute_value: _value.map(_v => _v.value).join(','), unit: unit?.value || null })
                                                                    }

                                                                    if (_property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT_CUSTOM_VALUE && !!_value && _value.length > 0) {
                                                                        product_attributes.push({
                                                                            attribute_id: _property.id,
                                                                            attribute_value: _value.filter(_v => !_v.__isNew__).map(_v => _v.value).join(','),
                                                                            custom_attribute_values: _value.filter(_v => _v.__isNew__).map(_v => ({ value: _v.value })),
                                                                            unit: unit?.value || null
                                                                        })
                                                                    }
                                                                }
                                                            });

                                                            return {
                                                                ..._pp,
                                                                form: {
                                                                    ..._pp.form,
                                                                    is_cod_open: values[`is_cod_open_${_idx}`]
                                                                },
                                                                productAttributesSelected: product_attributes
                                                            }
                                                        })
                                                    })

                                                    // Validate upload video
                                                    // products.forEach(
                                                    //     (item, index) => {
                                                    //         setProducts(prev => prev.map((_prod, _index) => {
                                                    //             if (_index == index) {
                                                    //                 return {
                                                    //                     ..._prod,
                                                    //                     productVideFiles: item.productVideFiles.map(_ff => {
                                                    //                         if (_ff.id != item.productVideFiles?.[0]?.id) {
                                                    //                             return _ff
                                                    //                         }
                                                    //                         return {
                                                    //                             ..._ff,
                                                    //                             isUploading: true
                                                    //                         }
                                                    //                     }),
                                                    //                 }
                                                    //             }
                                                    //             return _prod
                                                    //         }).filter((_product, indexFilter) => !productRemoveIndex.some(_idxProduct => _idxProduct === indexFilter)))
                                                    //         validateOriginVideo(item.productVideFiles?.[0]?.source, item.channel?.connector_channel_code)
                                                    //             .then(res => {
                                                    //                 console.log({ res });
                                                    //                 if (!!res.error) {
                                                    //                     setProducts(prev => prev.map((_prod, _index) => {
                                                    //                         if (_index == index) {
                                                    //                             return {
                                                    //                                 ..._prod,
                                                    //                                 productVideFiles: item.productVideFiles.map(_ff => {
                                                    //                                     if (_ff.id != item.productVideFiles?.[0]?.id) {
                                                    //                                         return _ff
                                                    //                                     }
                                                    //                                     return {
                                                    //                                         ..._ff,
                                                    //                                         isUploadError: true
                                                    //                                     }
                                                    //                                 }),
                                                    //                             }
                                                    //                         }
                                                    //                         return _prod
                                                    //                     }).filter((_product, indexFilter) => !productRemoveIndex.some(_idxProduct => _idxProduct === indexFilter)))
                                                    //                 } else {
                                                    //                     setProducts(prev => prev.map((_prod, _index) => {
                                                    //                         if (_index == index) {
                                                    //                             return {
                                                    //                                 ..._prod,
                                                    //                                 productVideFiles: item.productVideFiles.map(_ff => {
                                                    //                                     if (_ff.id != item.productVideFiles?.[0]?.id) {
                                                    //                                         return _ff
                                                    //                                     }
                                                    //                                     return {
                                                    //                                         ..._ff,
                                                    //                                         isUploading: false
                                                    //                                     }
                                                    //                                 }),
                                                    //                             }
                                                    //                         }
                                                    //                         return _prod
                                                    //                     }).filter((_product, indexFilter) => !productRemoveIndex.some(_idxProduct => _idxProduct === indexFilter)))
                                                    //                 }
                                                    //             })
                                                    //     }
                                                    // );

                                                    setStepPassed(prev => ({ ...prev, step2: true }))
                                                    setStep(2)
                                                } else {
                                                    setShowPopupAlert(true);
                                                    handleSubmit()
                                                }
                                            }}>{formatMessage({ defaultMessage: 'TIẾP TỤC' })}</button>
                                    </div>
                                    <SetCache set={setCacheStep2} />
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