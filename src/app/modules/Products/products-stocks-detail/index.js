/*
 * Created by duydatpham@gmail.com on 15/03/2023
 * Copyright (c) 2023 duydatpham@gmail.com
 */
import React, { memo, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useSubheader } from "../../../../_metronic/layout";
import { CardBody, Card } from "../../../../_metronic/_partials/controls";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import ProductInfo from "./components/ProductInfo";
import { useMutation, useQuery } from "@apollo/client";
import query_sme_catalog_inventories_by_variant from "../../../../graphql/query_sme_catalog_inventories_by_variant";
import mutate_inventoryUpdate from "../../../../graphql/mutate_inventoryUpdate";
import VariantInfo from "./components/VariantInfo";
import { Formik } from "formik";
import StockInfo from "./components/StockInfo";
import * as Yup from "yup";
import { useToasts } from "react-toast-notifications";
import { useIntl } from "react-intl";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
const regex = new RegExp("[^\u0000-\u007F]+")

export default memo(({
    history,
    match,
}) => {

    const { formatMessage } = useIntl()
    const { addToast } = useToasts();
    const { setBreadcrumbs, setTitle } = useSubheader()
    setTitle(formatMessage({ defaultMessage: 'Tồn kho' }));
    useEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Sửa sản phẩm phân loại' }),
            }
        ])
    }, [])
    const [update, { loading: loadingUpdate }] = useMutation(mutate_inventoryUpdate);

    const { data, loading, refetch } = useQuery(query_sme_catalog_inventories_by_variant, {
        variables: {
            variant_id: match?.params?.id
        },
        fetchPolicy: 'cache-and-network'
    })
    const isMutilUnit = data?.sme_catalog_inventories?.some(inven => {
        return inven?.product?.sme_catalog_product_variants?.some(variant => variant?.is_multi_unit == 1)
    })
    const [variant, initialValues, initSchema] = useMemo(() => {
        if (!data || !data.sme_catalog_inventories || data.sme_catalog_inventories.length == 0) {
            return [null]
        }
        let _variant = data.sme_catalog_inventories[0]
        let _variant_asset = null//_variant?.product?.sme_catalog_product_assets[0]
        if (!!_variant?.variant?.sme_catalog_product_variant_assets[0] && _variant?.variant?.sme_catalog_product_variant_assets[0].asset_url) {
            _variant_asset = _variant?.variant?.sme_catalog_product_variant_assets[0]
        }


        let attributes = {};
        if (_variant?.variant?.attributes && _variant?.variant?.attributes.length > 0) {
            for (let index = 0; index < _variant?.variant?.attributes.length; index++) {
                const element = _variant?.variant?.attributes[index];
                attributes[`attribute-${element?.id}`] = element.sme_catalog_product_attribute_value?.name;

            }
        }

        let _initialValues = {
            variant_full_name: _variant.variant.variant_full_name || '',
            sku: _variant.variant.sku,
            gtin: _variant.variant.gtin || undefined,
            costPrice: _variant.variant.cost_price || undefined,
            price: _variant.variant.price || undefined,
            priceMinimum: _variant.variant.price_minimum || undefined,
            stockWarning: _variant.variant.stock_warning,
            variantUnit: _variant?.variant?.unit,
            vatRate: _variant.variant.vat_rate,
            image: !!_variant_asset ? {
                id: _variant_asset.asset_id,
                source: _variant_asset.asset_url,
                source_draft: _variant_asset.asset_url,
                sme_id: _variant_asset.id
            } : null,
            ...attributes
        }


        let _initSchema = Yup.object().shape({
            variant_full_name: Yup.string()
                .max(255, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 255, name: formatMessage({ defaultMessage: "Tên sản phẩm phân loại" }) }))
                .test(
                    'chua-ky-tu-space-o-dau-cuoi',
                    formatMessage({ defaultMessage: 'Tên sản phẩm phân loại không được chứa dấu cách ở đầu và cuối' }),
                    (value, context) => {    
                        if (!!value) {
                            return value.length == value.trim().length;
                        }
                        return true;
                    },
                )
                .test(
                    'chua-ky-tu-2space',
                    formatMessage({ defaultMessage: 'Tên sản phẩm phân loại không được chứa 2 dấu cách liên tiếp' }),
                    (value, context) => {
                        if (!!value) {
                            return !(/\s\s+/g.test(value))
                        }
                        return true;
                    },
                ),
            variantUnit:Yup.string().nullable()
            .max(120, formatMessage({ defaultMessage: 'Đơn vị tính tối đa chỉ được {max} ký tự' }, { max: 120 })),
            sku: Yup.string()
                .max(50, formatMessage({ defaultMessage: 'Mã SKU tối đa chỉ được {max} ký tự' }, { max: 50 }))
                .required(formatMessage({ defaultMessage: 'Vui lòng nhập mã SKU' }))
                .test(
                    'chua-ky-tu-space-o-dau-cuoi',
                    formatMessage({ defaultMessage: 'SKU không được chứa dấu cách ở đầu và cuối' }),
                    (value, context) => {
                        if (!!value) {
                            return value.length == value.trim().length;
                        }
                        return false;
                    },
                )
                .test(
                    'chua-ky-tu-tieng-viet',
                    formatMessage({ defaultMessage: 'Mã SKU không được chứa ký tự Tiếng Việt' }),
                    (value, context) => {
                        if (!!value) {
                            return !regex.test(value);
                        }
                        return true;
                    },
                )
                .test(
                    'chua-ky-tu-2space',
                    formatMessage({ defaultMessage: 'SKU không được chứa 2 dấu cách liên tiếp' }),
                    (value, context) => {
                        if (!!value) {
                            return !(/\s\s+/g.test(value))
                        }
                        return false;
                    },
                ),
            gtin: Yup.string()
                .max(120, formatMessage({ defaultMessage: 'Gtin tối đa {max} ký tự' }, { max: 120 })),
            price: Yup.number().notRequired()
                .min(1000, formatMessage({ defaultMessage: 'Giá tối thiểu là {max}đ' }, { max: '1.000' }))
                .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {min}đ' }, { min: '120.000.000' })),
            // .when(`priceMinimum`, values => {
            //     if (values) {
            //         return Yup.number()
            //             .min(values, 'Giá bán phải lớn hơn hoặc bằng giá bán tối thiểu')
            //             .max(120000000, 'Giá tối đa là 120.000.000đ');
            //     }
            // }),            
            priceMinimum: Yup.number().notRequired()
                .min(1000, formatMessage({ defaultMessage: 'Giá tối thiểu là {max}đ' }, { max: '1.000' }))
                .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là {min}đ' }, { min: '120.000.000' })),
            stockWarning: Yup.number()
                .min(0, formatMessage({ defaultMessage: 'Cảnh báo tồn có thể nhập hợp lệ từ 0 đến 999,999' }))
                .max(999999, formatMessage({ defaultMessage: 'Số lượng sản phẩm tối đa 999.999' }))
                .nullable(),        
        })

        return [_variant, _initialValues, _initSchema]
    }, [data])
    const isSyncVietful = useMemo(() => {
        return variant?.variant?.provider_links?.length > 0 &&  variant?.variant.provider_links?.some(provider => provider?.provider_code == 'vietful' && !provider?.sync_error_msg)
     }, [variant])
    return <>
        <Helmet
            titleTemplate={formatMessage({ defaultMessage: "Sửa sản phẩm phân loại" }) + "- UpBase"}
            defaultTitle={formatMessage({ defaultMessage: "Sửa sản phẩm phân loại" }) + "- UpBase"}
        >
            <meta name="description" content={formatMessage({ defaultMessage: "Sửa sản phẩm phân loại" }) + "- UpBase"} />
        </Helmet>
        {
            !!variant && <Formik
                initialValues={initialValues}
                validationSchema={initSchema}
                onSubmit={async (values) => {
                    if (!!values.image && values.image.hasError) {
                        addToast(formatMessage({ defaultMessage: "Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ" }), { appearance: 'error' })
                        return
                    }
                    if (values.price != null && values.price != undefined && values.priceMinimum != null && values.priceMinimum != undefined && values.price < values.priceMinimum) {
                        addToast(formatMessage({ defaultMessage: "Giá bán phải lớn hơn hoặc bằng giá bán tối thiểu" }), { appearance: 'error' })
                        return
                    }

                    let res = await update({
                        variables: {
                            inventoryInput: {
                                variantFullName: values.variant_full_name,
                                variantId: match?.params?.id,
                                sku: values.sku || null,
                                gtin: values.gtin || values.sku,                                
                                price: values.price || null,
                                priceMinimum: values.priceMinimum || null,
                                stockWarning: typeof values.stockWarning == 'number' ? values.stockWarning : null,
                                unitName: values.variantUnit || "",
                                imageUrl: values.image?.source
                            }
                        }
                    })
                    if (res?.data?.inventoryUpdate?.success) {
                        addToast(formatMessage({ defaultMessage: "Cập nhật thành công" }), { appearance: 'success' })
                        history.push('/products/stocks')
                        return
                    } else {
                        addToast(res?.data?.inventoryUpdate?.message || formatMessage({ defaultMessage: "Gặp lỗi, xin vui lòng thử lại" }), { appearance: 'error' })
                    }

                }}
            >
                {({
                    handleSubmit,
                    values,
                    validateForm,
                    setFieldError,
                    submitForm,
                }) => {
                    return (
                        <>
                            <ProductInfo variant={variant} refetch={refetch}/>
                            <VariantInfo variant={variant} isSyncVietful={isSyncVietful}/>
                            <StockInfo variant={variant} isMutilUnit={isMutilUnit} isSyncVietful={isSyncVietful}/>
                            <div className='d-flex justify-content-end' >
                                <button className="btn btn-secondary mr-2" style={{ width: 150 }} onClick={e => {
                                    e.preventDefault()
                                    history.push('/products/stocks')
                                }} >Hủy bỏ</button>
                                <AuthorizationWrapper keys={['product_edit', "product_stock_update_detail"]}>
                                    <button className="btn btn-primary" style={{ width: 150 }} type="submit"
                                        disabled={values.image_uploading}
                                        onClick={async () => {
                                            let res = await validateForm()
                                            console.log('res', res)
                                            if (Object.keys(res).length > 0) {
                                                addToast(formatMessage({ defaultMessage: "Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ" }), { appearance: 'error' })
                                                return
                                            }
                                            handleSubmit()
                                        }} >{formatMessage({ defaultMessage: 'Lưu lại' })}</button>
                                </AuthorizationWrapper>
                            </div>
                        </>
                    )
                }
                }
            </Formik>
        }
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
    </>
})