import React, { memo, useState, useMemo, useCallback, Fragment, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";
import * as Yup from "yup";
import { FastField, Field, Formik } from "formik";
import {
    Card,
    CardBody,
    InputVertical
} from "../../../../_metronic/_partials/controls";
import { useSubheader } from "../../../../_metronic/layout";
import { RouterPrompt } from '../../../../components/RouterPrompt';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import op_connector_channels from "../../../../graphql/op_connector_channels";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { Helmet } from 'react-helmet-async';
import SVG from "react-inlinesvg";
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import ProductUpdateSellInfoRow from "./ProductUpdateSellInfoRow";
import mutate_scUpdateMultiProductStockPrice from "../../../../graphql/mutate_scUpdateMultiProductStockPrice";
import LoadingDialog from "../product-new/LoadingDialog";
import query_scGetWarehouses from "../../../../graphql/query_scGetWarehouses";
import query_scGetSmeProductByListId from "../../../../graphql/query_scGetSmeProductByListId";
import ModalVariantStockOnHand from "./dialog/ModalVariantStockOnHand";
import { ReSelect } from "../../../../_metronic/_partials/controls/forms/ReSelect";
import ErrorDialog from "./dialog/errorDialog";
import { set } from "lodash";
import ResultUpdateDialog from "./dialog/ResultUpdateDialog";

const ProductUpdateSellInfo = () => {
    const { setBreadcrumbs } = useSubheader();
    const history = useHistory();
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();

    useEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Sửa giá & tồn kho' }),
                pathname: '/product-stores/update-sell-info'
            }
        ])
    }, []);

    const [products, setProducts] = useState([]);
    const [productSchema, setProductSchema] = useState({});
    const [currentCodesVariant, setCurrentCodesVariant] = useState(null);
    const [idStore, setIdStore] = useState()
    const [dataResults, setDataResult] = useState()
    const [errorProductStockPrice, setErrorProductStockPrice] = useState('')
    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataScWareHouse } = useQuery(query_scGetWarehouses, {
        fetchPolicy: 'cache-and-network',
    });
    const { data: productByListId, loading } = useQuery(query_scGetSmeProductByListId, {
        variables: {
            list_product_id: history?.location?.state?.list_product?.map(product => product?.id)
        },
        fetchPolicy: 'cache-and-network',
    });

    const scWarehouses = useMemo(
        () => {
            if (!dataScWareHouse) return []
            return dataScWareHouse?.scGetWarehouses?.filter(wh => wh?.warehouse_type == 1) || []
        }, [dataScWareHouse]
    );

    const scWarehousesByVariant = useMemo(() => {
        if (!scWarehouses) return []
        return scWarehouses?.filter(wh => wh?.store_id == idStore) || []
    }, [idStore, scWarehouses])

    const [updateMultiProductStockPrice, { loading: loadingUpdateMultiProductStockPrice }] = useMutation(mutate_scUpdateMultiProductStockPrice);

    const optionsScWarehouse = useMemo(() => {
        return scWarehouses?.map(wh => ({ store_id: wh?.store_id, value: wh?.id, label: wh?.warehouse_name, isDefault: wh?.is_default })) || []
    }, [scWarehouses]);
    console.log('optionsScWarehouse', optionsScWarehouse)
    const [optionsStore] = useMemo(
        () => {
            let _options = dataStore?.sc_stores?.map(_store => {
                let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
                return {
                    label: _store.name,
                    value: _store.id,
                    logo: _channel?.logo_asset_url,
                    merge_stock: _store?.merge_stock,
                    enable_multi_warehouse: _store?.enable_multi_warehouse
                }
            }) || [];

            return [_options];
        }, [dataStore]
    );
    
    const initialValues = useMemo(
        () => {
            let schema = {};
            let initial = {

            };

            setProducts(history?.location?.state?.list_product?.map(
                _product => {
                    let _store = optionsStore?.find(store => store.value == _product?.store_id) || {};

                    return {
                        ..._product,
                        store: _store,
                        origin_warehouse: optionsScWarehouse?.filter(wh => wh?.store_id == _product?.store_id)?.find(wh => wh?.isDefault)
                    }
                }
            ));
            
            (productByListId?.scGetSmeProductByListId || []).forEach(
                product => {
                    let _store = optionsStore?.find(store => store.value == product?.store_id) || {};

                    (product?.productVariants || []).forEach(_variant => {
                        initial[`variant-${product?.id}-${_variant?.id}-disabled`] = !!_variant?.sme_product_variant_id && !!_variant?.is_enable_link_inventory
                        initial[`variant-${product?.id}-${_variant?.id}-price`] = _variant?.price;
                        initial[`variant-${product?.id}-${_variant?.id}-priceMinimum`] = _variant?.price_minimum;
                        initial[`variant-${product?.id}-${_variant?.id}-sku`] = _variant?.sku;

                        if (_store?.enable_multi_warehouse) {
                            const warehouseVariant = scWarehouses?.reduce(
                                (result, wh) => {
                                    const whStockOnHand = _variant?.variantInventoris?.find(iv => iv?.sc_warehouse_id == wh?.id)?.stock_on_hand || 0;
                                    initial[`variant-${product?.id}-${_variant?.id}-${wh?.id}-stockOnHand`] = whStockOnHand;
                                    schema[`variant-${product?.id}-${_variant?.id}-${wh?.id}-stockOnHand`] = Yup.number().notRequired()
                                        .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
                                        .max(999999, formatMessage({ defaultMessage: 'Số lượng sản phẩm tối đa {max}' }, { max: '999.999' }));

                                    return result;
                                }, {}
                            );
                        } else {
                            initial[`variant-${product?.id}-${_variant?.id}-stockOnHand`] = _variant?.sellable_stock;
                            initial[`variant-${product?.id}-${_variant?.id}-stockReverse`] = _variant?.reverse_stock;
                            schema[`variant-${product?.id}-${_variant?.id}-stockOnHand`] = Yup.number()
                                .required(formatMessage({ defaultMessage: 'Vui lòng nhập có sẵn' }))
                                .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
                                .max(999999, formatMessage({ defaultMessage: 'Số lượng sản phẩm tối đa {max}' }, { max: '999.999' }));
                        }


                        schema[`variant-price-total`] = Yup.number().notRequired()
                            .min(1000, formatMessage({ defaultMessage: 'Giá tối thiểu là {min}đ' }, { min: '1.000' }))
                            .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }))
                            .when(`variant-priceMinimum-total`, values => {
                                if (values) {
                                    return Yup.number()
                                        .min(values, 'Giá niêm yết phải lớn hơn hoặc bằng giá bán tối thiểu')
                                        .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }));
                                }
                            });
                        schema[`variant-priceMinimum-total`] = Yup.number().notRequired()
                            .min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
                            .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
                            .nullable();
                        schema[`variant-stock-total`] = Yup.number().notRequired()
                            .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
                            .max(999999, formatMessage({ defaultMessage: 'Số lượng sản phẩm tối đa {max}' }, { max: '999.999' }));
                        schema[`variant-${product?.id}-${_variant?.id}-price`] = Yup.number()
                            .required(formatMessage({ defaultMessage: "Vui lòng nhập giá niêm yết" }))
                            .min(1000, formatMessage({ defaultMessage: 'Giá tối thiểu là {min}đ' }, { min: '1.000' }))
                            .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }))
                            .when(`variant-${product?.id}-${_variant?.id}-priceMinimum`, values => {
                                if (values) {
                                    return Yup.number()
                                        .min(values, 'Giá niêm yết phải lớn hơn hoặc bằng giá bán tối thiểu')
                                        .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {max}đ' }, { max: '120.000.000' }));
                                }
                            });
                        schema[`variant-${product?.id}-${_variant?.id}-priceMinimum`] = Yup.number().min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
                            .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
                            .nullable()
                            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Giá tối thiểu' }).toLowerCase() }));
                    })
                }
            );

            setProductSchema(Yup.object().shape(schema));

            return initial;
        }, [history.location.state, productByListId, optionsStore, scWarehouses, optionsScWarehouse]
    );

    const updateMultiple = async (values) => {
        const productBodyUpdate = products?.map(product => ({
            product_id: product?.id,
            variants: product?.productVariants?.map(variant => ({
                variant_id: variant?.id,
                price: values[`variant-${product?.id}-${variant?.id}-price`],
                price_minimum: values[`variant-${product?.id}-${variant?.id}-priceMinimum`],
                ...(!!product?.store?.enable_multi_warehouse ? {
                    warehouse_inventories: scWarehouses?.map(wh => ({
                        warehouse_id: wh?.id,
                        stock_on_hand: values[`variant-${product?.id}-${variant?.id}-${wh?.id}-stockOnHand`]
                    }))
                } : {
                    stock: values[`variant-${product?.id}-${variant?.id}-stockOnHand`],
                })
            }))
        }));

        let res = await updateMultiProductStockPrice({
            variables: {
                products: productBodyUpdate
            }
        });

        if (res?.data?.scUpdateMultiProductStockPrice?.success) {
            setDataResult(res?.data?.scUpdateMultiProductStockPrice)
        } else {
            setErrorProductStockPrice(res?.data?.scUpdateMultiProductStockPrice?.message)
        }
    }

    return (
        <>
            <Helmet
                titleTemplate={`${formatMessage({ defaultMessage: 'Sửa giá và tồn kho hàng loạt' })} - UpBase`}
                defaultTitle={`${formatMessage({ defaultMessage: 'Sửa giá và tồn kho hàng loạt' })} - UpBase`}
            >
                <meta name="description" content={`${formatMessage({ defaultMessage: 'Sửa giá và tồn kho hàng loạt' })} - UpBase`} />
            </Helmet>
            <ErrorDialog messageError={errorProductStockPrice} onHide={() => setErrorProductStockPrice('')} />
            <LoadingDialog show={loadingUpdateMultiProductStockPrice} />
            {!!dataResults && <ResultUpdateDialog dataResults={dataResults} onHide={() => {
                setDataResult(null)
                history.push(history?.location?.state?.from == 'draf' ? `/product-stores/draf?channel=${products?.[0]?.connector_channel_code}` : `/product-stores/list?channel=${products?.[0]?.connector_channel_code}`);
            }} />}
            {loading ? <div className='text-center col-12 mt-4' style={{ position: 'absolute' }} ><span className="spinner spinner-primary"></span></div> : (
                <Formik
                    initialValues={initialValues}
                    validationSchema={productSchema}
                    enableReinitialize
                >
                    {({
                        handleSubmit,
                        values,
                        validateForm,
                        setValues,
                        setFieldValue,
                        errors,
                        ...rest
                    }) => {
                        const changed = values['__changed__'];

                        return (
                            <Fragment>
                                <RouterPrompt
                                    when={changed}
                                    title={formatMessage({ defaultMessage: "Bạn đang cập nhật giá & tồn kho sản phẩm sàn. Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?" })}
                                    cancelText={formatMessage({ defaultMessage: "KHÔNG" })}
                                    okText={formatMessage({ defaultMessage: "CÓ, THOÁT" })}
                                    onOK={() => true}
                                    onCancel={() => false}
                                />

                                {!!currentCodesVariant && (
                                    <ModalVariantStockOnHand
                                        currentCodesVariant={currentCodesVariant}
                                        scWarehousesByVariant={scWarehousesByVariant}
                                        onHide={() => setCurrentCodesVariant(null)}
                                    />
                                )}

                                <Card>
                                    <CardBody>
                                        <div className="row d-flex justify-content-end align-items-end mb-8">
                                            <div className="col-2">
                                                <button
                                                    className="btn btn-primary"
                                                    type="submit"
                                                    style={{ width: '100%', height: 36 }}
                                                    disabled={errors[`variant-price-total`] || errors[`variant-stock-total`] || errors[`variant-priceMinimum-total`]}
                                                    onClick={async (e) => {
                                                        const formValues = { ...values };
                                                        products.forEach(product => {
                                                            (product?.productVariants || []).forEach(variant => {
                                                                if (typeof values[`variant-price-total`] == 'number') {
                                                                    formValues[`variant-${product?.id}-${variant?.id}-price`] = values[`variant-price-total`];
                                                                }
                                                                if (typeof values[`variant-priceMinimum-total`] == 'number') {
                                                                    formValues[`variant-${product?.id}-${variant?.id}-priceMinimum`] = values[`variant-priceMinimum-total`];
                                                                }

                                                                if (!values[`variant-${product?.id}-${variant?.id}-disabled`] && typeof values[`variant-stock-total`] == 'number') {
                                                                    if (!!product?.store?.enable_multi_warehouse) {
                                                                        formValues[`variant-${product?.id}-${variant?.id}-${product?.origin_warehouse?.value}-stockOnHand`] = values[`variant-stock-total`];
                                                                    } else {
                                                                        formValues[`variant-${product?.id}-${variant?.id}-stockOnHand`] = values[`variant-stock-total`];
                                                                    }
                                                                }
                                                            })
                                                        })
                                                        
                                                        console.log({ formValues })
                                                        setValues(formValues);
                                                    }}
                                                >
                                                    {formatMessage({ defaultMessage: 'Áp dụng cho tất cả' })}
                                                </button>
                                            </div>
                                            <div className="col-2 d-flex flex-column">
                                                <span className="mb-1">{formatMessage({ defaultMessage: 'Giá niêm yết' })}</span>
                                                <FastField
                                                    name={`variant-price-total`}
                                                    component={InputVertical}
                                                    placeholder={formatMessage({ defaultMessage: "Nhập giá niêm yết" })}
                                                    label={""}
                                                    type="number"
                                                    nameTxt={""}
                                                    required
                                                    absolute
                                                    customFeedbackLabel={' '}
                                                    addOnRight={''}
                                                />
                                            </div>
                                            <div className="col-2 d-flex flex-column">
                                                <span className="mb-1">{formatMessage({ defaultMessage: 'Giá bán tối thiểu' })}</span>
                                                <FastField
                                                    name={`variant-priceMinimum-total`}
                                                    component={InputVertical}
                                                    placeholder={formatMessage({ defaultMessage: "Nhập giá bán tối thiểu" })}
                                                    label={""}
                                                    type="number"
                                                    nameTxt={""}
                                                    required
                                                    absolute
                                                    customFeedbackLabel={' '}
                                                    addOnRight={''}
                                                />
                                            </div>
                                            {!!products[0]?.store?.enable_multi_warehouse ? (
                                                <div className="col-2 d-flex flex-column">
                                                    <span className="mb-1">{formatMessage({ defaultMessage: 'Tồn kho' })}</span>
                                                    <FastField
                                                        name={`variant-stock-total`}
                                                        component={InputVertical}
                                                        placeholder={formatMessage({ defaultMessage: "Nhập tồn kho" })}
                                                        label={""}
                                                        type="number"
                                                        nameTxt={""}
                                                        required
                                                        absolute
                                                        customFeedbackLabel={' '}
                                                        addOnRight={''}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="col-2 d-flex flex-column ">
                                                    <span className="mb-1">{formatMessage({ defaultMessage: 'Có sẵn' })}</span>
                                                    <FastField
                                                        name={`variant-stock-total`}
                                                        component={InputVertical}
                                                        placeholder={formatMessage({ defaultMessage: "Nhập có sẵn" })}
                                                        label={""}
                                                        type="number"
                                                        nameTxt={""}
                                                        required
                                                        absolute
                                                        customFeedbackLabel={' '}
                                                        addOnRight={''}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ borderRadius: 6, minHeight: 220, }}>
                                            <table className="table table-borderless product-list table-vertical-center fixed">
                                                <thead style={{
                                                    position: 'sticky', top: 42, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', zIndex: 1
                                                }}>
                                                    <tr className="font-size-lg" style={{ zIndex: 1, borderRadius: 6 }}>
                                                        <th style={{ fontSize: '14px' }} width="22%">{formatMessage({ defaultMessage: 'Sản phẩm' })}</th>
                                                        <th style={{ fontSize: '14px' }} width="25%">{formatMessage({ defaultMessage: 'SKU Hàng hóa' })}</th>
                                                        <th style={{ fontSize: '14px' }} width="15%">{formatMessage({ defaultMessage: 'Giá niêm yết' })}</th>
                                                        <th style={{ fontSize: '14px' }} width="15%">{formatMessage({ defaultMessage: 'Giá bán tối thiểu' })}</th>
                                                        <th style={{ fontSize: '14px' }} width="15%" className={!!products[0]?.store?.enable_multi_warehouse ? 'text-center' : ''}>
                                                            {formatMessage({ defaultMessage: 'Có sẵn' })}
                                                        </th>
                                                        <th className='text-center' style={{ fontSize: '14px' }} width="8%">{formatMessage({ defaultMessage: 'Thao tác' })}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {products?.map((_product) => (
                                                        <ProductUpdateSellInfoRow
                                                            key={`product-update-sell-info-${_product?.id}`}
                                                            product={_product}
                                                            setCurrentCodesVariant={setCurrentCodesVariant}
                                                            scWarehouses={scWarehouses}
                                                            setIdStore={setIdStore}
                                                            disabledAction={products?.length == 1}
                                                            onRemoveProduct={id => setProducts(prev => prev?.filter(item => item.id != id))}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10'>
                                            <button
                                                className="btn btn-secondary mr-2"
                                                style={{ width: 150 }}
                                                onClick={e => {
                                                    e.preventDefault()
                                                    history.push(history?.location?.state?.from == 'draf' ? `/product-stores/draf?channel=${products?.[0]?.connector_channel_code}` : `/product-stores/list?channel=${products?.[0]?.connector_channel_code}`);
                                                }}
                                            >
                                                {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                type="submit"
                                                style={{ minWidth: 150 }}
                                                onClick={async (e) => {
                                                    setFieldValue('__changed__', false)
                                                    let error = await validateForm();

                                                    delete error[`variant-price-total`];
                                                    delete error[`variant-stock-total`];
                                                    delete error[`variant-priceMinimum-total`];

                                                    if (Object.keys(error).length > 0) {
                                                        handleSubmit();
                                                        addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' });
                                                        return;
                                                    } else {
                                                        updateMultiple(values)
                                                    }
                                                }}
                                            >
                                                {formatMessage({ defaultMessage: 'Cập nhật' })}
                                            </button>
                                        </div>
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
                    }}
                </Formik>
            )}

        </>
    )
};

export default memo(ProductUpdateSellInfo);