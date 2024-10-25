import React, { useEffect, useMemo, useCallback, Fragment, useState } from 'react';
import * as Yup from "yup";
import { Field, Form, Formik } from "formik";
import { useHistory, useLocation } from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import SVG from "react-inlinesvg";
import _ from 'lodash';
import { useMutation } from '@apollo/client';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import LoadingDialog from '../../../Products/product-new/LoadingDialog';
import ModalCombo from '../dialog/ModalCombo';
import { useSubheader } from '../../../../../_metronic/layout';
import { Card, CardBody, InputVertical } from "../../../../../_metronic/_partials/controls";
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { RouterPrompt } from '../../../../../components/RouterPrompt';
import mutate_smeUpdateProductPrice from '../../../../../graphql/mutate_smeUpdateProductPrice';
import ProductUpdateRow from './ProductUpdateRow';

const ProductUpdatePriceVat = () => {
    const history = useHistory();
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();
    const [products, setProducts] = useState(false);
    const [productSchema, setProductSchema] = useState({});
    const [dataCombo, setDataCombo] = useState(null);

    useEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Cập nhật giá và VAT' }),
                pathname: '/finance/update-cost-price-vat'
            }
        ])
    }, []);

    const [userUpdateProductPrice, { loading: loadingUserUpdateProductPrice }] = useMutation(mutate_smeUpdateProductPrice, {
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

            schema[`variant-vat-total`] = Yup.number()
                .min(0, formatMessage({ defaultMessage: 'VAT có thể nhập hợp lệ từ 0 đến 100%' }))
                .max(100, formatMessage({ defaultMessage: 'VAT tối đa {max}' }, { max: '100%' }))
                .nullable();


            (list_product || []).forEach(product => {
                (product?.sme_catalog_product_variants || []).forEach(variant => {
                    initial[`variant-${product?.id}-${variant?.id}-price`] = variant?.price;
                    initial[`variant-${product?.id}-${variant?.id}-costPrice`] = variant?.cost_price;
                    initial[`variant-${product?.id}-${variant?.id}-priceMinimum`] = variant?.price_minimum;
                    initial[`variant-${product?.id}-${variant?.id}-stockOnHand`] = variant?.stock_on_hand;
                    initial[`variant-${product?.id}-${variant?.id}-vatRate`] = variant?.vat_rate;

                    schema[`variant-${product?.id}-${variant?.id}-price`] = Yup.number()
                        .min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
                        .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
                        .nullable()
                        .when(`variant-${product?.id}-${variant?.id}-priceMinimum`, values => {
                            if (values) {
                                return Yup.number()
                                    .min(values, formatMessage({ defaultMessage: 'Giá bán phải lớn hơn hoặc bằng giá bán tối thiểu' }))
                                    .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }))
                                    .nullable();
                            }
                        });
                    schema[`variant-${product?.id}-${variant?.id}-priceMinimum`] = Yup.number()
                        .min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
                        .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
                        .nullable()
                    schema[`variant-${product?.id}-${variant?.id}-costPrice`] = Yup.number()
                        .min(0, formatMessage({ defaultMessage: 'Giá tối thiểu là 0đ' }))
                        .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }))
                        .nullable()
                    schema[`variant-${product?.id}-${variant?.id}-vatRate`] = Yup.number()
                        .min(0, formatMessage({ defaultMessage: 'VAT có thể nhập hợp lệ từ 0 đến 100%' }))
                        .max(100, formatMessage({ defaultMessage: 'VAT tối đa {max}' }, { max: '100%' }))
                        .nullable()
                })
            });

            setProductSchema(Yup.object().shape(schema));

            return initial;
        }, [history?.location?.state]
    );

    return (
        <Fragment>
            <Helmet
                titleTemplate={`${formatMessage({ defaultMessage: 'Cập nhật giá vốn và VAT' })} - UpBase`}
                defaultTitle={`${formatMessage({ defaultMessage: 'Cập nhật giá vốn và VAT' })} - UpBase`}
            >
                <meta name="description" content={`${formatMessage({ defaultMessage: 'Cập nhật giá vốn và VAT' })} - UpBase`} />
            </Helmet>
            <LoadingDialog show={loadingUserUpdateProductPrice} />
            {!!dataCombo && <ModalCombo dataCombo={dataCombo} onHide={() => setDataCombo(null)} />}
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
                            errors
                        }) => {
                            const changed = values['__changed__'];

                            return <Fragment>
                                <RouterPrompt
                                    when={changed}
                                    title={formatMessage({ defaultMessage: 'Bạn đang cập nhật giá và VAT. Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?' })}
                                    cancelText={formatMessage({ defaultMessage: 'KHÔNG' })}
                                    okText={formatMessage({ defaultMessage: 'CÓ, THOÁT' })}
                                    onOK={() => true}
                                    onCancel={() => false}
                                />
                                <div className="row d-flex justify-content-end align-items-end mb-8">
                                    <div className="col-2">
                                        <button
                                            className="btn btn-primary"
                                            type="submit"
                                            style={{ width: '100%', height: 36 }}
                                            disabled={errors[`variant-vat-total`]}
                                            onClick={async (e) => {
                                                products.forEach(product => {
                                                    (product?.sme_catalog_product_variants || []).forEach(variant => {
                                                        if (typeof values[`variant-vat-total`] == 'number') {
                                                            setFieldValue(`variant-${product?.id}-${variant?.id}-vatRate`, values[`variant-vat-total`]);
                                                        }
                                                    })
                                                })
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'Áp dụng cho tất cả' })}
                                        </button>
                                    </div>
                                    <div className="col-2 d-flex flex-column">
                                        <span className="mb-1">{formatMessage({ defaultMessage: 'VAT' })}</span>
                                        <Field
                                            name={`variant-vat-total`}
                                            component={InputVertical}
                                            placeholder={formatMessage({ defaultMessage: "Nhập VAT" })}
                                            label={""}
                                            type="number"
                                            nameTxt={""}
                                            required
                                            absolute
                                            customFeedbackLabel={' '}
                                            addOnRight={''}
                                        />
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
                                                <th style={{ fontSize: '14px' }} width="30%">
                                                    {formatMessage({ defaultMessage: 'Sản phẩm' })}
                                                </th>
                                                <th style={{ fontSize: '14px' }} width="30%">
                                                    {formatMessage({ defaultMessage: 'Hàng hóa' })}
                                                </th>
                                                <th style={{ fontSize: '14px' }} width="15%">
                                                    <div className='d-flex justify-content-end'>
                                                        <span>
                                                            {formatMessage({ defaultMessage: 'Giá vốn' })}
                                                        </span>
                                                    </div>
                                                </th>
                                                <th style={{ fontSize: '14px' }} width="15%">
                                                    <div className='d-flex justify-content-end'>
                                                        <span>
                                                            {formatMessage({ defaultMessage: 'VAT' })}
                                                        </span>
                                                    </div>
                                                </th>
                                                <th className='text-center' style={{ fontSize: '14px' }} width="10%">
                                                    {formatMessage({ defaultMessage: 'Thao tác' })}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products?.map(product => {
                                                return <ProductUpdateRow
                                                    key={product?.id}
                                                    product={product}
                                                    setDataCombo={setDataCombo}
                                                    disabledAction={products?.length == 1}
                                                    onRemoveProduct={() => {
                                                        setProducts(prev => prev.filter(_product => _product?.id != product?.id))

                                                            (product?.sme_catalog_product_variants || []).forEach(variant => {
                                                                setFieldError([`variant-${product?.id}-${variant?.id}-price`], false);
                                                                setFieldError([`variant-${product?.id}-${variant?.id}-costPrice`], false);
                                                                setFieldError([`variant-${product?.id}-${variant?.id}-stockOnHand`], false);
                                                                setFieldError([`variant-${product?.id}-${variant?.id}-priceMinimum`], false);
                                                                setFieldError([`variant-${product?.id}-${variant?.id}-vatRate`], false);
                                                            })
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
                                                history.push(`/finance/manage-cost-price`);
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'HỦY' })}
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            style={{ width: 150 }}
                                            onClick={async () => {
                                                setFieldValue('__changed__', false)
                                                let errors = await validateForm();

                                                console.log({ errors })

                                                delete errors[`variant-vat-total`];

                                                if (Object.keys(errors).length > 0) {
                                                    addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' });
                                                    return;
                                                } else {
                                                    const body = {
                                                        products: products?.map(product => ({
                                                            fields: ['vat', 'cost_price'],
                                                            product_id: product?.id,
                                                            variants: product?.sme_catalog_product_variants?.map(variant => ({
                                                                variant_id: variant?.id,
                                                                cost_price: values[`variant-${product?.id}-${variant?.id}-costPrice`],
                                                                vat: values[`variant-${product?.id}-${variant?.id}-vatRate`],
                                                            }))
                                                        }))
                                                    };

                                                    let res = await userUpdateProductPrice({
                                                        variables: body
                                                    });

                                                    history.push('/finance/manage-cost-price');
                                                    if (res?.data?.userUpdateProductPrice?.success) {
                                                        addToast(formatMessage({ defaultMessage: 'Cập nhật giá và VAT thành công' }), { appearance: 'success' })
                                                    } else {
                                                        addToast(res?.data?.userUpdateProductPrice?.message || 'Cập nhật giá và VAT thất bại', { appearance: 'error' })
                                                    }
                                                }
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'LƯU LẠI' })}
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

export default ProductUpdatePriceVat;
