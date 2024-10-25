import React, { useEffect, useMemo, useCallback, Fragment, useState } from 'react';
import { useSubheader } from "../../../../_metronic/layout/_core/MetronicSubheader";
import { Card, CardBody, Checkbox } from "../../../../_metronic/_partials/controls";
import { RadioGroup } from '../../../../_metronic/_partials/controls/forms/RadioGroup';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import * as Yup from "yup";
import { Field, Form, Formik } from "formik";
import { useHistory, useLocation } from "react-router-dom";
import { RouterPrompt } from '../../../../components/RouterPrompt';
import LoadingDialog from '../product-new/LoadingDialog';
import { Helmet } from 'react-helmet-async';
import SVG from "react-inlinesvg";
import _ from 'lodash';
import ProductCreateMultipleRow from './ProductCreateMultipleRow';
import mutate_scProductSyncDown from '../../../../graphql/mutate_scProductSyncDown';
import { useMutation } from '@apollo/client';
import ModalCreateMultipleResults from './components/ModalCreateMultipleResults';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';

const ProductCreateOnly = () => {
    const history = useHistory();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const { setBreadcrumbs } = useSubheader();
    const [products, setProducts] = useState(false);
    const [variants, setVariants] = useState([]);
    const [variantAttributes, setVariantAttributes] = useState([]);
    const [dataResult, setDataResult] = useState(null);
    const [productSchema, setProductSchema] = useState({});

    useEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Tạo sản phẩm kho' }),
                pathname: '/product-stores/only'
            }
        ])
    }, []);

    const [scProductSyncDown, { loading: loadingSyncDown }] = useMutation(mutate_scProductSyncDown, {
        refetchQueries: ['ScGetSmeProducts', 'sme_catalog_notifications'],
        awaitRefetchQueries: true,
    });
    console.log('history?.location?.state', history?.location?.state)
    const initialValues = useMemo(
        () => {
            const { products: listProduct } = history?.location?.state || {};
            setProducts(listProduct || []);

            let schema = {};
            let initial = {
                outboundType: 'FIFO'
            };
            let variantsProduct = [];
            let variantAttributesProduct = [];

            (listProduct || []).forEach(product => {
                const arraySort = [...product?.productVariantAttributes]
                const sortAttribute = arraySort
                    ?.sort((a, b) => a.position - b.position)
                    ?.map(_attribute => ({
                        ..._attribute,
                        product_id: product?.id,
                        values: _.filter(product?.variantAttributeValues || [], item => item?.sc_variant_attribute_id === _attribute?.id)
                            ?.map(_value => ({
                                ..._value,
                                code: _value?.ref_index
                            }))
                    }));

                const variantProduct = (product?.productVariants || [])?.reduce((result, _variant) => {
                    let sc_product_attributes_value = JSON.parse(_variant.sc_product_attributes_value || "[]");

                    let _codesss = sortAttribute?.map(_attribute => {
                        return (_attribute.values.find(_value => sc_product_attributes_value.some(_code => _code == _value.code)) || { code: "" }).code
                    })

                    initial[`variant-${product.id}-${_codesss.join('-')}-sku`] = _variant.sku;
                    initial[`variant-${product.id}-${_codesss.join('-')}-price`] = _variant.price;
                    initial[`variant-${product.id}-${_codesss.join('-')}-costPrice`] = 0;
                    initial[`variant-${product.id}-${_codesss.join('-')}-stockOnHand`] = _variant.stock_on_hand;

                    schema[`variant-${product.id}-${_codesss.join('-')}-price`] = Yup.number().notRequired()
                        .min(1000, formatMessage({ defaultMessage: 'Giá tối thiểu là {min}đ' }, { min: '1.000' }))
                        .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }));
                    schema[`variant-${product.id}-${_codesss.join('-')}-costPrice`] = Yup.number().notRequired()
                        .min(0, formatMessage({ defaultMessage: 'Giá tối thiểu là {min}đ' }, { min: '0' }))
                        .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }));
                    schema[`variant-${product.id}-${_codesss.join('-')}-stockOnHand`] = Yup.number()
                        .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
                        .max(999999, formatMessage({ defaultMessage: 'Số lượng sản phẩm tối đa {max}' }, { max: '999.999' }));

                    result = result.concat([{
                        ..._variant,
                        product_id: product?.id,
                        codes: _codesss.join('-'),
                    }])

                    return result;
                }, [])

                variantAttributesProduct = variantAttributesProduct.concat(sortAttribute);
                variantsProduct = variantsProduct.concat(variantProduct);
            });

            setVariants(variantsProduct);
            setVariantAttributes(variantAttributesProduct);
            setProductSchema(Yup.object().shape(schema));

            return initial;
        }, [history?.location?.state]
    );

    const onRemoveVariant = useCallback(
        (id, attributeCode) => {
            const isPause = _.find(variantAttributes, __ => __?.id == id)?.values?.length == 1;
            setVariantAttributes(prev => prev.map(
                _variant => {
                    if (_variant?.id === id) {
                        const newValues = _variant?.values?.length > 1
                            ? _.filter(_variant?.values, item => item?.code != attributeCode)
                            : _variant?.values

                        return { ..._variant, values: newValues }
                    }

                    return _variant
                }
            ));

            if (isPause) return;
            setVariants(prev => prev.filter(
                _variant => {
                    let sc_product_attributes_value = JSON.parse(_variant.sc_product_attributes_value || "[]");
                    let existValue = sc_product_attributes_value?.some(item => item === attributeCode);

                    return !existValue;
                }
            ));
        }, [variants, variantAttributes]
    );

    console.log({ initialValues, variants, variantAttributes });

    return (
        <Fragment>
            <Helmet
                titleTemplate={`${formatMessage({ defaultMessage: 'Tạo sản phẩm kho hàng loạt' })} - UpBase`}
                defaultTitle={`${formatMessage({ defaultMessage: 'Tạo sản phẩm kho hàng loạt' })} - UpBase`}
            >
                <meta name="description" content={`${formatMessage({ defaultMessage: 'Tạo sản phẩm kho hàng loạt' })} - UpBase`} />
            </Helmet>
            <LoadingDialog show={loadingSyncDown} />
            <ModalCreateMultipleResults
                dataResults={dataResult}
                onHide={() => setDataResult(null)}
            />
            <Card >
                <CardBody style={{ padding: '1rem' }} >
                    <Formik
                        initialValues={initialValues}
                        validationSchema={productSchema}
                        enableReinitialize
                        onSubmit={async (values) => {
                            // const lstAttributeValue = variantAttributes?.map(
                            //     _variant => _.map(_variant?.values || [], item => item.ref_index)
                            // ).flat();

                            const body = {
                                store_id: history?.location?.state?.store_id,
                                is_lot: !!values?.is_lot ? 1 : 0,
                                is_expired_date: !!values?.is_expired_date ? 1 : 0,
                                outbound_method: !!values?.is_expired_date ? `${values['outboundType']}` || 'FIFO' : 'FIFO',
                                products: (history?.location?.state?.products || [])?.map(
                                    product => ({
                                        id: product?.id,
                                        product_variants: _.filter(variants, _variant => _variant?.product_id === product?.id)
                                            ?.map(_variant => ({
                                                id: _variant?.id,
                                                sku: _variant?.sku,
                                                stock_on_hand: values[`variant-${product?.id}-${_variant?.codes}-stockOnHand`],
                                                cost_price: values[`variant-${product?.id}-${_variant?.codes}-costPrice`],
                                                price: values[`variant-${product?.id}-${_variant?.codes}-price`],
                                            })),
                                        variant_attribute_value_ref_index_list: _.filter(
                                            variantAttributes, _variant => _variant?.product_id === product?.id
                                        )?.map(
                                            _variant => _.map(_variant?.values || [], item => item.ref_index)
                                        ).flat()
                                    })
                                )
                            };

                            let res = await scProductSyncDown({
                                variables: body
                            });

                            if (!!res?.data?.scProductSyncDown?.total_success) {
                                addToast(formatMessage({ defaultMessage: 'Tạo sản phẩm thành công' }), { appearance: 'success' });
                                history.push(`/product-stores/list`);
                            } else {
                                addToast(formatMessage({ defaultMessage: 'Tạo sản phẩm thất bại' }), { appearance: 'error' });
                            }
                        }}
                    >
                        {({
                            values,
                            handleSubmit,
                            validateForm,
                            setFieldValue
                        }) => {
                            const changed = values['__changed__'];

                            return <Fragment>
                                <RouterPrompt
                                    when={changed}
                                    title={formatMessage({ defaultMessage: "Bạn đang tạo sản phẩm. Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?" })}
                                    cancelText={formatMessage({ defaultMessage: "KHÔNG" })}
                                    okText={formatMessage({ defaultMessage: "CÓ, THOÁT" })}
                                    onOK={() => true}
                                    onCancel={() => false}
                                />
                                <div
                                    style={{
                                        borderRadius: 6,
                                        minHeight: 220,

                                    }}
                                >
                                    <div className='row mb-2'>
                                        <div className='col-2'>{formatMessage({defaultMessage: 'Các hình thức quản lý tồn mở rộng: '})}</div>
                                        <div className="d-flex align-items-center">
                                            <div>
                                                <Checkbox
                                                    size="checkbox-md"
                                                    inputProps={{
                                                        "aria-label": "checkbox",
                                                    }}
                                                    title={formatMessage({ defaultMessage: "Có thông tin lô"})}
                                                    isSelected={values[`is_lot`]}
                                                    onChange={(e) => {
                                                        setFieldValue([`is_lot`], !values[`is_lot`]);
                                                    }}
                                                />
                                            </div>
                                            <div className="mx-4">
                                                <Checkbox
                                                    size="checkbox-md"
                                                    inputProps={{
                                                        "aria-label": "checkbox",
                                                    }}
                                                    title={formatMessage({ defaultMessage: "Quản lý hạn sử dụng"})}
                                                    isSelected={values[`is_expired_date`]}
                                                    onChange={(e) => {
                                                        setFieldValue([`is_expired_date`], !values[`is_expired_date`]);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {values[`is_expired_date`] && <div className='row'>
                                        <div className="col-2">Loại xuất kho: </div>
                                        <div className="col-7 pl-0">
                                        <Field
                                            name="outboundType"
                                            component={RadioGroup}
                                            customFeedbackLabel={' '}
                                            options={[
                                            {
                                                value: 'FIFO',
                                                label: 'FIFO (nhập trước xuất trước)'
                                            },
                                            {
                                                value: 'FEFO',
                                                label: 'FEFO (Hết hạn trước xuất trước)'
                                            },
                                            ]}
                                        />
                                        </div>
                                    </div>}
                                    <table className="table table-borderless product-list table-vertical-center fixed">
                                        <thead
                                            style={{
                                                position: 'sticky', top: 42, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', zIndex: 1
                                            }}
                                        >
                                            <tr className="font-size-lg" style={{ zIndex: 1, borderRadius: 6 }}>
                                                <th style={{ fontSize: '14px' }} width="30%">
                                                    {formatMessage({ defaultMessage: 'Sản phẩm' })}
                                                </th>
                                                <th style={{ fontSize: '14px' }} width="20%">
                                                    {formatMessage({ defaultMessage: 'Phân loại' })}
                                                </th>
                                                <th style={{ fontSize: '14px' }} width="20%">
                                                    {formatMessage({ defaultMessage: 'Hàng hóa' })}
                                                </th>
                                                <th style={{ fontSize: '14px' }} width="18%">
                                                    {formatMessage({ defaultMessage: 'Giá' })}
                                                </th>
                                                {/* <th style={{ fontSize: '14px' }} width="12%">
                                                    {formatMessage({ defaultMessage: 'Tồn' })}
                                                </th> */}
                                            </tr>
                                        </thead>
                                        <tbody style={{ borderRight: "1px solid #D9D9D9", borderLeft: "1px solid #D9D9D9" }}>
                                            {products?.map(_product => (
                                                <ProductCreateMultipleRow
                                                    key={`product-create-multiple-${_product?.id}`}
                                                    product={_product}
                                                    isDelete={false}
                                                    variants={_.filter(variants, _variant => _variant?.product_id === _product?.id) || []}
                                                    variantAttributes={_.filter(variantAttributes, _variantAttribute => _variantAttribute?.product_id === _product?.id) || []}
                                                    onRemoveProduct={(id) => setProducts(prev => prev?.filter(item => item.id != id))}
                                                    onRemoveVariant={onRemoveVariant}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10'>
                                        <button
                                            className="btn btn-secondary mr-2"
                                            style={{ width: 150 }}
                                            onClick={e => {
                                                e.preventDefault();
                                                history.push(`/product-stores/list`);
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: "HỦY" })}
                                        </button>
                                        <button
                                            className="btn btn-primary mr-2"
                                            style={{ width: 150 }}
                                            type="submit"
                                            onClick={async () => {
                                                setFieldValue('__changed__', false)
                                                let res = await validateForm();

                                                if (Object.keys(res).length > 0) {
                                                    // handleSubmit();
                                                    addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' });
                                                    return;
                                                }
                                                handleSubmit()
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'TẠO SẢN PHẨM' })}
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
        </Fragment>
    )
};

export default ProductCreateOnly;