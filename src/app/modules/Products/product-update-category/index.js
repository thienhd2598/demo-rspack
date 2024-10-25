import React, { useEffect, useMemo, useCallback, Fragment, useState } from 'react';
import { useSubheader } from "../../../../_metronic/layout/_core/MetronicSubheader";
import { Card, CardBody, InputVertical } from "../../../../_metronic/_partials/controls";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import * as Yup from "yup";
import { Field, Form, Formik } from "formik";
import { useHistory, useLocation } from "react-router-dom";
import { RouterPrompt } from '../../../../components/RouterPrompt';
import LoadingDialog from '../product-new/LoadingDialog';
import { Helmet } from 'react-helmet-async';
import SVG from "react-inlinesvg";
import _ from 'lodash';
import { useMutation } from '@apollo/client';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import mutate_smeUpdateProductPrice from '../../../../graphql/mutate_smeUpdateProductPrice';
import mutate_userUpdateProductInfoMulti from '../../../../graphql/mutate_userUpdateProductInfoMulti';
import ProductUpdateRow from './ProductUpdateRow';
import query_sme_catalog_category from '../../../../graphql/query_sme_catalog_category';
import { useQuery } from '@apollo/client';
import { ReSelectVertical } from '../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import makeAnimated from 'react-select/animated';
import ModalWarning from './dialog/ModalWarning';
import ModalResult from './dialog/ModalResult';
const animatedComponents = makeAnimated();

const ProductUpdateNameCategory = () => {
    const history = useHistory();
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();
    const [products, setProducts] = useState(false);
    const [showWarning, setShowWarning] = useState(false)
    const [dataResults, setDataResults] = useState(null)
    const [productSchema, setProductSchema] = useState({});
    const { loading, data, error } = useQuery(query_sme_catalog_category, {
        fetchPolicy: "cache-and-network",
    });
    
    const optionsCategory = useMemo(() => {
        return data?.sme_catalog_category?.map(option => ({label: option?.name, value: option?.id}))
    }, [data])

    useEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Cập nhật tên sản phẩm kho và Danh mục' }),
                pathname: '/products/update-category'
            }
        ])
    }, []);

    const [userUpdateProductCategory, { loading: loadingUserUpdateProductCategory }] = useMutation(mutate_userUpdateProductInfoMulti, {
        refetchQueries: ['sme_catalog_product', 'sme_catalog_product_aggregate'],
        awaitRefetchQueries: true,
    });    
    const initialValues = useMemo(
        () => {
            const { list_product } = history?.location?.state || {};

            setProducts(list_product?.map(product => {
                const imgAssets = _.minBy(product?.sme_catalog_product_assets?.filter(_asset => !_asset.is_video).map(__vv => ({ ...__vv, position: __vv.position_show || 0 })), 'position');

                return {
                    ...product,
                    imgAssets
                }
            }));

            let schema = {};
            let initial = {};

            (list_product || []).forEach(product => {
                initial[`product-${product?.id}-category`] = optionsCategory?.find(item => item?.value == product?.catalog_category_id) || null;
                initial[`product-${product?.id}-name`] = product?.name;

                schema[`product-${product?.id}-name`] = Yup.string()
                    .max(255, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 255, name: formatMessage({ defaultMessage: "Tên sản phẩm" }) }))
                    .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên sản phẩm" }).toLowerCase() }))
                    .test(
                    'chua-ky-tu-space-o-dau-cuoi',
                    formatMessage({ defaultMessage: 'Tên sản phẩm kho không được chứa dấu cách ở đầu và cuối' }),
                    (value, context) => {
                        if (!!value) {
                        return value.length == value.trim().length;
                        }
                        return false;
                    },
                    )
                    .test(
                    'chua-ky-tu-2space',
                    formatMessage({ defaultMessage: 'Tên sản phẩm kho không được chứa 2 dấu cách liên tiếp' }),
                    (value, context) => {
                        if (!!value) {
                        return !(/\s\s+/g.test(value))
                        }
                        return false;
                    },
                    )
            });

            setProductSchema(Yup.object().shape(schema));

            return initial;
        }, [history?.location?.state, optionsCategory]
    );

    

    return (
        <Fragment>
            <Helmet
                titleTemplate={`${formatMessage({ defaultMessage: 'Cập nhật tên sản phẩm kho và Danh mục' })} - UpBase`}
                defaultTitle={`${formatMessage({ defaultMessage: 'Cập nhật tên sản phẩm kho và Danh mục' })} - UpBase`}
            >
                <meta name="description" content={`${formatMessage({ defaultMessage: 'Cập nhật tên sản phẩm kho và Danh mục' })} - UpBase`} />
            </Helmet>
            <LoadingDialog show={loadingUserUpdateProductCategory} />
            {!!showWarning && <ModalWarning 
                show={showWarning}
                onHide={() => {setShowWarning(false)}}
            />}
            {!!dataResults && <ModalResult 
                dataResults={dataResults}
                onHide={() => {
                    setDataResults([])
                    history.push(`/products/list`)
                }}
            />}
            <Card >
                <CardBody style={{ padding: '1rem' }} >
                    <Formik
                        initialValues={initialValues}
                        validationSchema={productSchema}
                        enableReinitialize
                    >
                        {({
                            values,
                            handleSubmit,
                            validateForm,
                            setFieldValue,
                            setFieldError,
                            setValues,
                            errors
                        }) => {
                            const changed = values['__changed__'];

                            return <Fragment>
                                <RouterPrompt
                                    when={changed}
                                    title={formatMessage({ defaultMessage: 'Bạn đang cập nhật tên sản phẩm kho và danh mục. Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?' })}
                                    cancelText={formatMessage({ defaultMessage: 'KHÔNG' })}
                                    okText={formatMessage({ defaultMessage: 'CÓ, THOÁT' })}
                                    onOK={() => true}
                                    onCancel={() => false}
                                />    
                                <div className='ml-auto row align-items-end' style={{width: '45%', padding: '1rem'}}>
                                    <div className='col-7 d-flex align-items-center' style={{zIndex: 2}}>
                                        <label style={{width: '30%', marginBottom: '1.75rem'}}>Danh mục</label>
                                        <Field
                                            name={`product-category`}
                                            style={{ width: '100%'}}
                                            component={ReSelectVertical}
                                            placeholder={formatMessage({ defaultMessage: 'Chọn danh mục tương ứng' })}
                                            onChange={(item) => {
                                                setFieldValue(`product-category`, item || null);
                                            }}
                                            customFeedbackLabel={' '}
                                            components={animatedComponents}
                                            options={optionsCategory}
                                            isClearable={true}
                                        />
                                    </div>
                                    <div className='col-5' style={{paddingRight: 0, marginBottom: '1.75rem'}}>
                                        <button
                                            className="btn btn-primary"
                                            type="submit"
                                            style={{ width: '100%', height: 36 }}
                                            disabled={!values[`product-category`]}
                                            onClick={async (e) => {
                                                const fieldValue = {...values}
                                                const filterProduct = products?.filter((product) => {
                                                    return !product?.sme_catalog_product_variants?.some(
                                                        (variant) => variant.provider_links?.length > 0 && variant.provider_links?.some(provider => provider?.provider_code == 'vietful' && !provider?.sync_error_msg)
                                                      );
                                                })
                                                filterProduct.forEach(product => {
                                                    fieldValue[`product-${product?.id}-category`]  = values[`product-category`];
                                                })
                                                setValues(fieldValue)
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'Áp dụng cho tất cả' })}
                                        </button>
                                    </div>
                                </div>                            
                                <div
                                    style={{
                                        borderRadius: 6,
                                        minHeight: 220,

                                    }}
                                >
                                    <table className="table table-borderless product-list table-vertical-center fixed">
                                        <thead
                                            style={{
                                                position: 'sticky', top: 42, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', zIndex: 1,
                                                borderLeft: '0.5px solid #cbced4', borderRight: '0.5px solid #cbced4'
                                            }}
                                        >
                                            <tr className="font-size-lg" style={{ zIndex: 1, borderRadius: 6 }}>
                                                <th style={{ fontSize: '14px' }} width="35%">
                                                    {formatMessage({ defaultMessage: 'Thông tin sản phẩm' })}
                                                </th>
                                                <th className='text-center' style={{ fontSize: '14px' }} width="35%">
                                                    {formatMessage({ defaultMessage: 'Tên sản phẩm kho' })}
                                                </th>
                                                <th className='text-center' style={{ fontSize: '14px' }} width="20%">
                                                            {formatMessage({ defaultMessage: 'Danh mục' })}
                                                </th>
                                                <th className='text-center' style={{ fontSize: '14px' }} width="10%">
                                                    {formatMessage({ defaultMessage: 'Thao tác' })}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products?.map(product => {
                                                console.log('abcccc',product)
                                                return <ProductUpdateRow
                                                    optionsCategory={optionsCategory}
                                                    key={product?.id}
                                                    product={product}
                                                    disabledAction={products?.length == 1}
                                                    onRemoveProduct={() => {
                                                        setProducts(prev => prev.filter(_product => _product?.id != product?.id))
                                                        setFieldError([`product-${product?.id}-name`], false);
                                                    }}
                                                />
                                            })}
                                        </tbody>
                                    </table>
                                    <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10'>
                                        <button
                                            className="btn btn-secondary mr-2"
                                            style={{ width: 150 }}
                                            onClick={e => {
                                                e.preventDefault();
                                                setShowWarning(true);
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            style={{ width: 150 }}
                                            onClick={async () => {
                                                setFieldValue('__changed__', false)
                                                let errors = await validateForm();

                                                console.log({ errors })

                                                delete errors[`product-category`];

                                                if (Object.keys(errors).length > 0) {
                                                    addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' });
                                                    return;
                                                } else {
                                                    const body = {
                                                        userUpdateProductInfoItemInput: products?.map(product => ({
                                                            id: product?.id, 
                                                            name: values[`product-${product?.id}-name`], 
                                                            category: values[`product-${product?.id}-category`]?.value || null
                                                        }))
                                                    };

                                                    let { data } = await userUpdateProductCategory({
                                                        variables: body
                                                    });

                                                    if (data?.userUpdateProductInfoMulti?.success) {
                                                        if(data?.userUpdateProductInfoMulti?.total == data?.userUpdateProductInfoMulti?.totalSuccess) {
                                                            addToast(formatMessage({ defaultMessage: 'Cập nhật tên và danh mục sản phẩm kho thành công' }), { appearance: 'success' })
                                                            setDataResults({
                                                                errors: [],
                                                                total: data?.userUpdateProductInfoMulti?.total,
                                                                totalSuccess: data?.userUpdateProductInfoMulti?.totalSuccess
                                                            })
                                                        } else {
                                                            setDataResults({
                                                                errors: data?.userUpdateProductInfoMulti?.errors,
                                                                total: data?.userUpdateProductInfoMulti?.total,
                                                                totalSuccess: data?.userUpdateProductInfoMulti?.totalSuccess
                                                            })
                                                        }
                                                    } else {
                                                        addToast(data?.userUpdateProductInfoMulti?.message || 'Cập nhật tên và danh mục sản phẩm kho thất bại', { appearance: 'error' })
                                                    }
                                                }
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'Lưu lại' })}
                                        </button>
                                    </div>
                                </div>
                            </Fragment>
                        }}
                    </Formik>
                </CardBody>
            </Card>

            <div
                id="kt_scrolltop1"
                className="scrolltop"
                style={{ bottom: 80 }}
                onClick={() => {
                    window.scrollTo({
                        letf: 0,
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                }}
            >
                <span className="svg-icon">
                    <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
                </span>{" "}
            </div>
        </Fragment >
    )
};

export default ProductUpdateNameCategory;