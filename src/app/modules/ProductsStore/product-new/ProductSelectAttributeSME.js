/*
 * Created by duydatpham@gmail.com on 10/11/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useQuery } from '@apollo/client';
import { Field, Form, Formik, useFormikContext } from "formik";
import * as _ from 'lodash';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useIntl } from "react-intl";
import { useHistory } from 'react-router';
import slugify from 'react-slugify';
import * as Yup from "yup";
import CategorySelect from "../../../../components/CategorySelect";
import op_sale_channel_categories from "../../../../graphql/op_sale_channel_categories";
import query_scGetAttributeByCategory from "../../../../graphql/query_scGetAttributeByCategory";
import { Card, CardBody, InputVertical } from '../../../../_metronic/_partials/controls';
import { ReSelect } from '../../../../_metronic/_partials/controls/forms/ReSelect';
import { ReSelectVertical } from '../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import SuggestCategory from '../product-basic-info/SuggestCategory';
import { useProductsUIContext } from '../ProductsUIContext';
import { ATTRIBUTE_VALUE_TYPE } from "../ProductsUIHelpers";
import PopupAlert from '../../Products/product-create-multi-onstores/dialog/PopupAlert';
import { randomString } from '../../../../utils';
import { useToasts } from 'react-toast-notifications';

const regex = new RegExp("[^\u0000-\u007F]+")
export default memo(({ setTouched }) => {
    const {
        smeProduct,
        currentChannel,
        categorySelected,
        setCategorySelected,
        attributesSelected,
        setAttributesSelected,
        setCheckMapAttribute,
        customAttributes,
        setCustomAttributes,
        productEditSchema
    } = useProductsUIContext()
    const { addToast, removeAllToasts } = useToasts();
    const { formatMessage } = useIntl();
    const { setFieldValue, values: valuesContext, errors } = useFormikContext();
    const history = useHistory();
    const [categories, setCategories] = useState({});
    const [showPopupAlert, setShowPopupAlert] = useState(false);
    const [loadingMappingAttribute, setLoadingMappingAttribute] = useState(false);
    const isTiktok = currentChannel?.connector_channel_code == 'tiktok';
    const isLazada = currentChannel?.connector_channel_code == 'lazada';
    const isShopee = currentChannel?.connector_channel_code == 'shopee';

    const { data, loading } = useQuery(op_sale_channel_categories, {
        variables: {
            connector_channel_code: currentChannel?.connector_channel_code
        },
    });

    const { data: dataAttributes, loading: loadingAttribute } = useQuery(query_scGetAttributeByCategory, {
        variables: {
            category_id: categorySelected?.id || -1,
            sc_store_id: currentChannel?.value,
            skip: !categorySelected,
        },
        onCompleted: data => {
            if (!!data && data?.scGetAttributeByCategory?.length > 0) {
                let _attributes = (data?.scGetAttributeByCategory || [])
                    .filter(_op => _op.attribute_type == 1 && (isLazada ? _op.is_sale_prop == 1 : true))
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

                setCustomAttributes(_attributes);
            } else {
                setCustomAttributes([])
            }
        }
    });

    useMemo(
        () => {
            let _categories = _.groupBy(data?.sc_sale_channel_categories, _cate => _cate.parent_id || 'root');
            setCategories(_categories);
        }, [data]
    );

    const initialValues = useMemo(
        () => {
            // if (isTiktok && attributesSelected?.length == 0) {
            //     return { [`attribute-1`]: undefined }
            // }

            let values = attributesSelected.reduce(
                (result, value) => {
                    // if (isTiktok) {
                    //     result[`attribute-${value?.id}`] = undefined;
                    // } else {
                    // }
                    result[`attribute-${value?.id}`] = {
                        label: value?.display_name || '',
                        value: value?.display_name || '',
                        __isNew__: true
                    }

                    return result;
                }, {}
            );

            return values;
        }, [attributesSelected, currentChannel, isLazada, isTiktok]
    );

    const validationSchema = useMemo(
        () => {
            // if (attributesSelected?.length === 0 && isTiktok) {
            //     return Yup.object().shape({
            //         ['attribute-1']: Yup.object().required(formatMessage({ defaultMessage: "Vui lòng chọn nhóm phân loại" }))
            //     })
            // }

            let schema = {};
            attributesSelected.forEach((_attribute) => {
                schema[`attribute-${_attribute?.id}`] = Yup.string()
                    .ensure()
                    .required(formatMessage({ defaultMessage: "Vui lòng chọn nhóm phân loại" }))
                    .max(15, formatMessage({ defaultMessage: "Tên nhóm phân loại tối đa 15 ký tự" }))
                return;
            });

            return Yup.object().shape(schema)
        }, [attributesSelected, currentChannel, isTiktok]
    );

    const _onSelect = useCallback((category) => {
        setCategorySelected(category)
        setFieldValue('brand', undefined, false);
    }, [currentChannel?.connector_channel_code])

    const _buildAttributeProductStore = useCallback(
        (attribute, idsExist) => {
            const optionsAttribute = customAttributes
                ?.filter(attribute => !idsExist?.some(id => attribute?.id == id))
                ?.map(attribute => {
                    return {
                        label: attribute?.display_name,
                        value: String(attribute?.id),
                    }
                });

            return <Field
                name={`attribute-${attribute?.id}`}
                component={ReSelectVertical}
                hideBottom
                isCreatable={true}
                placeholder={formatMessage({
                    defaultMessage: 'Tên nhóm phân loại',
                })}
                customFeedbackLabel={' '}
                onChanged={value => {
                    console.log({ value });
                }}
                options={optionsAttribute}
                cols={['col-0', 'col-12']}
            />
            // switch (currentChannel?.connector_channel_code) {
            //     case "shopee":
            //         return <Field
            //             name={`attribute-${attribute?.id}`}
            //             component={ReSelectVertical}
            //             hideBottom
            //             isCreatable={true}
            //             placeholder={formatMessage({
            //                 defaultMessage: 'Tên nhóm phân loại',
            //             })}
            //             customFeedbackLabel={' '}
            //             onChanged={value => {
            //                 console.log({ value });
            //             }}
            //             options={optionsAttribute}
            //             cols={['col-0', 'col-12']}
            //         />
            //     case "lazada":
            //         return <Field
            //             name={`attribute-${attribute?.id}`}
            //             component={ReSelectVertical}
            //             hideBottom
            //             isCreatable={true}
            //             placeholder={formatMessage({
            //                 defaultMessage: 'Tên nhóm phân loại',
            //             })}
            //             customFeedbackLabel={' '}
            //             onChanged={value => {
            //                 console.log({ value });
            //             }}
            //             options={optionsAttribute}
            //             cols={['col-0', 'col-12']}
            //         />
            //     case "tiktok":
            //         return <Field
            //             name={`attribute-${attribute?.id}`}
            //             component={ReSelect}
            //             hideBottom
            //             placeholder={formatMessage({
            //                 defaultMessage: 'Tên nhóm phân loại',
            //             })}
            //             customFeedbackLabel={' '}
            //             options={optionsAttribute}
            //             cols={['col-0', 'col-12']}
            //         />
            //     default:
            //         return null;
            // }
        }, [currentChannel, customAttributes]
    );

    return <>
        <PopupAlert
            show={showPopupAlert}
            onHide={() => setShowPopupAlert(false)}
        />
        <Card>
            <CardBody>
                <div className="col-lg-6">
                    <p className="mb-4 d-flex mb-1" ><span >{formatMessage({ defaultMessage: 'Gian hàng' })}</span>: <img style={{ width: 20, height: 20, marginLeft: 8 }} src={currentChannel?.logo} className="mr-2" /><span >{currentChannel?.label}</span></p>
                    <Field
                        name="name"
                        component={InputVertical}
                        placeholder=""
                        label={formatMessage({ defaultMessage: "Tên sản phẩm sàn" })}
                        required
                        customFeedbackLabel={' '}
                        countChar
                        maxChar={(isTiktok || isLazada) ? 255 : 120}
                    />
                    <CategorySelect categories={categories}
                        key={`category`}
                        name={`category`}
                        selected={categorySelected}
                        onSelect={(category) => {
                            _onSelect(category);
                            setLoadingMappingAttribute(true);
                            setTimeout(
                                () => {
                                    setLoadingMappingAttribute(false);
                                }, 1000
                            )
                        }}
                    />
                    {!categorySelected && <SuggestCategory categoryList={data?.sc_sale_channel_categories || []} />}
                    {loadingMappingAttribute && <div className='text-center w-100 mt-4 mb-10' style={{ position: 'absolute' }} >
                        <span className="ml-3 spinner spinner-primary"></span>
                    </div>}
                    {!loadingMappingAttribute && !!categorySelected && Object.keys(initialValues)?.length > 0 ? (
                        <Formik
                            initialValues={initialValues}
                            validationSchema={validationSchema}
                            onSubmit={(values) => {
                                let newAttributeSelected;
                                const parseValues = Object.keys(values)?.map(
                                    _value => ({
                                        id: _value?.split('-')?.[1],
                                        name: values[_value]?.label,
                                        __isNew__: values[_value].__isNew__,
                                        sc_attribute_id: !values[_value].__isNew__ ? parseInt(values[_value]?.value) : null,
                                        groups: values[_value]?.groups || []

                                    })
                                )
                                // if (attributesSelected?.length == 0 && isTiktok) {
                                //     newAttributeSelected = attributesSelected.concat([{
                                //         ...parseValues[0],
                                //         id: randomString(),
                                //         attribute_type: 1,
                                //         isCustom: true,
                                //         values: [{ v: '', code: randomString(8) }],
                                //         display_name: parseValues[0]?.name,
                                //         name: slugify(parseValues[0]?.name),
                                //         sc_attribute_id: parseValues[0].sc_attribute_id,
                                //         groups: []
                                //     }])
                                // } else {
                                // }
                                newAttributeSelected = attributesSelected?.map(
                                    prev => {
                                        let findedAtrribute = parseValues?.find(_value => _value?.id == prev?.id);

                                        if (findedAtrribute) {
                                            return {
                                                ...prev,
                                                display_name: findedAtrribute?.name,
                                                name: slugify(findedAtrribute?.name),
                                                sc_attribute_id: findedAtrribute.sc_attribute_id,
                                                groups: findedAtrribute?.groups || []
                                            }
                                        }
                                        return prev
                                    }
                                );
                                setAttributesSelected(newAttributeSelected)
                                setCheckMapAttribute(true);
                            }}
                        >
                            {({
                                handleSubmit,
                                values,
                                validateForm,
                                setFieldValue,
                                setFieldError,
                                submitForm,
                            }) => {
                                // let attributeMapping = (attributesSelected?.length == 0 && isTiktok) ? [{
                                //     id: 1,
                                //     display_name: formatMessage({ defaultMessage: 'Mặc định' })
                                // }] : attributesSelected;
                                let attributeMapping = attributesSelected;

                                let idsExist = Object.keys(values).reduce(
                                    (result, val) => {
                                        if (!!values[val]) {
                                            result.push(Number(values[val]?.value))
                                        }
                                        return result
                                    }, []);

                                return (
                                    <Form>
                                        <div className='d-flex flex-column mt-8'>
                                            <p className='mb-4'>{formatMessage({ defaultMessage: 'Chọn nhóm phân loại tương ứng giữa kho và sàn' })}</p>
                                            <div
                                                style={{
                                                    boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                                                    borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6, borderTopLeftRadius: 6
                                                }}
                                            >
                                                <table className="table product-list table-borderless table-vertical-center fixed mb-0">
                                                    <thead>
                                                        <th style={{ fontSize: '14px' }} width="40%">
                                                            {formatMessage({ defaultMessage: 'Nhóm phân loại kho' })}
                                                        </th>
                                                        <th></th>
                                                        <th style={{ fontSize: '14px' }} width="40%">
                                                            {formatMessage({ defaultMessage: 'Nhóm phân loại trên sàn' })}
                                                        </th>
                                                    </thead>
                                                    <tbody>
                                                        {attributeMapping?.map(
                                                            (_attr, index) => (
                                                                <tr className='py-6' style={index === attributeMapping?.length - 1 ? {} : { borderBottom: '1px solid #F0F0F0' }}>
                                                                    <td width="40%">{_attr?.display_name}</td>
                                                                    <td width="20%">
                                                                        <div className="icon-arrow-product"></div>
                                                                    </td>
                                                                    <td width="40%">
                                                                        {_buildAttributeProductStore(_attr, idsExist)}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className='d-flex justify-content-end mt-12'>
                                            <button
                                                className="btn btn-secondary mr-2"
                                                style={{ width: 150 }}
                                                onClick={e => {
                                                    e.preventDefault()
                                                    history.push('/product-stores/list')
                                                }}>
                                                {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                style={{ width: 150 }}
                                                type="submit"
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    setTouched({
                                                        ['name']: true
                                                    });
                                                    let error = await validateForm(values);

                                                    if (Object.values(error).length == 0) {
                                                        if (!!errors.name) return;
                                                        const MAX_LENGTH_NAME = (isShopee || isTiktok) ? 14 : 15;

                                                        let checkedName = Object.keys(values)
                                                            ?.filter(_key => _key.startsWith('attribute'))
                                                            ?.some(_val => values[_val]?.label?.trim()?.length > MAX_LENGTH_NAME && !!values[_val]?.__isNew__)

                                                        if (checkedName) {
                                                            removeAllToasts();
                                                            addToast(formatMessage({ defaultMessage: 'Tên nhóm phân loại không được vượt quá {count} ký tự' }, { count: MAX_LENGTH_NAME }), { appearance: 'error' })
                                                            return;
                                                        }


                                                        const flatArr = Object.keys(values)
                                                            ?.filter(_key => _key.startsWith('attribute'))
                                                            ?.map(_key => values[_key]?.label)
                                                        const uniqVals = Array.from(new Set(flatArr));

                                                        if (uniqVals?.length < flatArr?.length) {
                                                            removeAllToasts();
                                                            addToast(formatMessage({ defaultMessage: 'Tên nhóm phân loại không được trùng nhau' }), { appearance: 'error' })
                                                            return;
                                                        }

                                                        console.log({ values });
                                                        submitForm();

                                                    } else {
                                                        setShowPopupAlert(true);
                                                        submitForm();
                                                    }
                                                }}>
                                                {formatMessage({ defaultMessage: "Tiếp tục" })}
                                            </button>
                                        </div>
                                    </Form>
                                )
                            }}
                        </Formik>
                    ) : (
                        <div className='d-flex justify-content-end mt-12' >
                            <button
                                className="btn btn-secondary mr-2"
                                style={{ width: 150 }}
                                onClick={e => {
                                    e.preventDefault()
                                    history.push('/product-stores/list')
                                }} >
                                {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ width: 150 }}
                                type="submit"
                                disabled={!categorySelected}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    setTouched({
                                        ['name']: true
                                    });

                                    if (!!errors.name) return;

                                    setCheckMapAttribute(true);
                                }}>
                                {formatMessage({ defaultMessage: "Tiếp tục" })}
                            </button>
                        </div>
                    )}
                </div>
            </CardBody>
        </Card>
    </>
})