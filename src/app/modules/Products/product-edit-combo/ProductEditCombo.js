/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import { useQuery } from "@apollo/client";
import { ContentState, EditorState } from 'draft-js';
import { Formik } from "formik";
import htmlToDraft from 'html-to-draftjs';
import _ from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from 'react-helmet-async';
import * as Yup from "yup";
import { useSubheader } from "../../../../_metronic/layout/_core/MetronicSubheader";
import { RouterPrompt } from "../../../../components/RouterPrompt";
import query_sme_catalog_product_by_pk from "../../../../graphql/query_sme_catalog_product_by_pk";
import ModalProductConnect from "../products-list/dialog/ModalProductConnect";
import { useProductsUIContext } from "../ProductsUIContext";
import { ATTRIBUTE_VALUE_TYPE } from "../ProductsUIHelpers";
import { ProductEditComboInfo } from "./ProductEditComboInfo";
import { ConfirmDialog } from '../../Order/order-detail/ConfirmDialog'
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import {
    Card,
    CardBody,
} from "../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";


export function ProductEditCombo({
    history,
    match,
}) {
    const [idProductCreated, setIdProductCreated] = useState()
    const {
        productEditSchema,
        categorySelected,
        setCategorySelected,
        attributesSelected,
        variants,
        productFiles,
        productVideFiles,
        productAttributeFiles,
        warrantiesList,
        setVariantsCombo,
        productEditComboSchema,
        setProductFiles,
        setProductVideFiles,
        smeCatalogStores,
        setAttributesSelected,
        setCustomAttributes,
        setProductAttributeFiles,
        resetAll, setIsEditProduct,
        setCurrentProduct,
        setProductSizeChart,
        setProductImageOrigin
    } = useProductsUIContext();
    const { setBreadcrumbs, setTitle } = useSubheader()
    const [idsProductsConnected, setIdsProductsConnected] = useState([]);
    const [smeProductIdSelect, setSmeProductIdSelect] = useState(0);
    const { data: productCreated, loadingDetail, refetch, error } = useQuery(query_sme_catalog_product_by_pk, {
        variables: {
            id: match.params.id
        }
    })
    console.log(productCreated)
    const { formatMessage } = useIntl()
    useEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Sửa sản phẩm combo' }),
            }
        ])

        const listener = (e) => {
            if (e.keyCode === 13 || e.which === 13) {
                if ((e.target.nodeName == 'INPUT' && e.target.type == 'text')) {
                    e.preventDefault();
                    return false;
                }
            }
        }
        document.addEventListener('keypress', listener);
        return () => {
            resetAll()
            document.removeEventListener('keypress', listener)
        }
    }, [])

    const initialValues = useMemo(() => {
        console.log('productCreated?.sme_catalog_product_by_pk', productCreated?.sme_catalog_product_by_pk)
        if (!!productCreated?.sme_catalog_product_by_pk) {
            setCurrentProduct(productCreated?.sme_catalog_product_by_pk)
            setIsEditProduct(true)

            let logistics = productCreated?.sme_catalog_product_by_pk.sme_catalog_product_ship_package_infos[0];
            let properties = {};
            setProductFiles((_.sortBy((productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 0), 'position_show')).map(_asset => {
                return {
                    id: _asset.asset_id,
                    source: _asset.asset_url,
                    source_draft: _asset.asset_url,
                    sme_id: _asset.id
                }
            }));
            setProductVideFiles((_.sortBy((productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 1), 'position_show')).map(_asset => {
                return {
                    id: _asset.asset_id,
                    source: _asset.asset_url,
                    sme_id: _asset.id
                }
            }));
            let sizeCharts = (productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 2).map(_asset => {
                return {
                    id: _asset.asset_id,
                    source: _asset.asset_url,
                    sme_id: _asset.id
                }
            })
            if (sizeCharts.length > 0) {
                setProductSizeChart(sizeCharts[0]);
            }
            let imageOrigin = (productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 3).map(_asset => {
                return {
                    id: _asset.asset_id,
                    source: _asset.asset_url,
                    source_draft: _asset.asset_url,
                    sme_id: _asset.id
                }
            })
            if (imageOrigin.length > 0) {
                setProductImageOrigin(imageOrigin[0]);
            }
            let _customAttributes = (productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_attributes_custom || []).map(_attribute => {
                return {
                    ..._attribute,
                    input_type: ATTRIBUTE_VALUE_TYPE.TEXT,
                    isCustom: true,
                }
            });
            let _attributeSelected = [];
            let _attributeValueForm = {};
            let _productAttributeFiles = {};

            let _disableFields = {
                ['disable-edit-attribute']: true
            };
            let has_asset = 0;
            _customAttributes = _customAttributes.map(_att => {
                _disableFields = {
                    ..._disableFields,
                    [`disable-delete-att-${_att.id}`]: true
                }

                let values = [...(_att.values || [])]
                values.sort((_1, _2) => _1.position - _2.position)
                if (Object.values(_productAttributeFiles).some(_file => _file.attribute_id == _att.id && _file?.files?.length > 0)) {
                    has_asset++;
                    return {
                        ..._att,
                        has_asset: true,
                        values
                    }
                }
                return {
                    ..._att,
                    values
                }
            })

            setCustomAttributes(_customAttributes)

            has_asset = 0;

            console.log('_productAttributeFiles', _productAttributeFiles)
            console.log('_attributeSelected', _attributeSelected)

            setAttributesSelected(_attributeSelected)
            setProductAttributeFiles(_productAttributeFiles)

            if (has_asset == 0) {
                _attributeValueForm['no-attribute-assets'] = true
            }

            const comboQuantity = productCreated?.sme_catalog_product_by_pk?.combo_items?.reduce(
                (result, val) => {
                    result[`variant-combo-${val?.combo_item?.id}-quantity`] = val?.quantity;
                    result[`variant-combo-${val?.combo_item?.id}-costRatioValue`] = val?.cost_allocate_ratio;

                    return result;
                }, {}
            );

            let parseComboItems = productCreated?.sme_catalog_product_by_pk?.combo_items?.map(
                _combo => ({
                    id: _combo?.combo_item?.id,
                    name: _combo?.combo_item?.name,
                    sku: _combo?.combo_item?.sku,
                    attributes: _combo?.combo_item?.attributes,
                    inventory: _combo?.combo_item?.inventory,
                    sme_catalog_product: _combo?.combo_item?.sme_catalog_product,
                    sme_catalog_product_variant_assets: _combo?.combo_item?.sme_catalog_product_variant_assets,
                })
            );
            setVariantsCombo(parseComboItems);

            let _variant = productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants[0]

            const originStockOnHand = smeCatalogStores?.reduce(
                (result, store) => {
                    if (store?.value == _variant?.inventory?.sme_store_id) {
                        result[`${store?.value}-stockOnHand`] = _variant?.inventory?.stock_actual || 0;
                        result[`${store?.value}-stockActual`] = _variant?.inventory?.stock_actual || 0;
                        result[`${store?.value}-stockReserve`] = _variant?.inventory?.stock_reserve || 0;
                        result[`${store?.value}-stockPreallocate`] = _variant?.inventory?.stock_preallocate || 0;
                        result[`${store?.value}-stockAvailable`] = _variant?.inventory?.stock_available || 0;
                        result[`${store?.value}-stockAllocated`] = _variant?.inventory?.stock_allocated || 0;
                        result[`${store?.value}-stockShipping`] = _variant?.inventory?.stock_shipping || 0;
                    }

                    return result;
                }, {}
            )

            _attributeValueForm = {
                ..._attributeValueForm,
                ...originStockOnHand,
                // origin_price: _variant.price,
                // origin_stockOnHand: _variant.stock_on_hand,
                origin_sku: String(_variant.sku),
            }

            let descriptionObj = {
                description: productCreated?.sme_catalog_product_by_pk.description || '',
                description_short: productCreated?.sme_catalog_product_by_pk.description_short || '',
                description_short_init: productCreated?.sme_catalog_product_by_pk.description_short || '',
                description_html: productCreated?.sme_catalog_product_by_pk.description_html || '',
                description_html_init: productCreated?.sme_catalog_product_by_pk.description_html || '',
            }

            let description_extend = EditorState.createEmpty()


            if (productCreated?.sme_catalog_product_by_pk?.description_extend) {
                try {
                    let hasItem = false;
                    const blocksFromHtml = htmlToDraft(_.flatten(JSON.parse(productCreated?.sme_catalog_product_by_pk?.description_extend).map(__ => {
                        if (__.field_type == 'text') {
                            hasItem = true;
                            return (__.text || '').split('\n').map(__ => `<p>${__}</p>`)
                        }
                        if (!!__.image_info) {
                            return [`${!!hasItem ? '' : '<p></p>'}<img src="${__.image_info.sme_url}" alt="${__.image_info.sme_url}" style="height: auto;width: 100%"/><p></p>`]
                        }
                        return null
                    })).filter(__ => !!__).join(''));
                    const contentState = ContentState.createFromBlockArray(blocksFromHtml.contentBlocks, blocksFromHtml.entityMap);
                    description_extend = EditorState.createWithContent(contentState)
                } catch (error) {

                }
            } else {
                // try {
                //   const blocksFromHtml = htmlToDraft(`<p>${productCreated?.sme_catalog_product_by_pk.description || ""}</p>`);
                //   const contentState = ContentState.createFromBlockArray(blocksFromHtml.contentBlocks, blocksFromHtml.entityMap);
                //   description_extend = EditorState.createWithContent(contentState)
                // } catch (error) {

                // }
            }

            let tags = productCreated?.sme_catalog_product_by_pk?.tags?.map(
                _tag => ({
                    value: _tag?.tag?.id,
                    label: _tag?.tag?.title
                })
            ) || [];

            let originStock = smeCatalogStores?.find(_store => _store?.isDefault);

            return {
                name: productCreated?.sme_catalog_product_by_pk.name,
                seoName: productCreated?.sme_catalog_product_by_pk.name_seo,
                is_lot: productCreated?.sme_catalog_product_by_pk.is_lot,
                serial_type: productCreated?.sme_catalog_product_by_pk.serial_type,
                is_expired_date: productCreated?.sme_catalog_product_by_pk.is_expired_date,
                catalog_category_id: productCreated?.sme_catalog_product_by_pk.catalog_category_id,
                sku: productCreated?.sme_catalog_product_by_pk.sku || '',
                brand_name: productCreated?.sme_catalog_product_by_pk?.brand_name || '',
                stockOnHand: (!!productCreated?.sme_catalog_product_by_pk.stock_on_hand || productCreated?.sme_catalog_product_by_pk.stock_on_hand == 0) ? productCreated?.sme_catalog_product_by_pk.stock_on_hand : undefined,
                price: _variant.price,
                costPrice: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.[0]?.cost_price || undefined,
                priceMinimum: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.[0]?.price_minimum || undefined,
                stockWarning: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.[0]?.stock_warning,
                vatRate: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.[0]?.vat_rate,
                gtin: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.[0]?.gtin || productCreated?.sme_catalog_product_by_pk.sku || undefined,
                has_attributes: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.length > 0 && productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.[0]?.attributes.length > 0,
                is_has_sell_info: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.length > 0 && productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.[0]?.attributes.length > 0,
                has_order: !!productCreated?.sme_catalog_product_by_pk?.has_order,
                product_tags: tags,
                inventories: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.[0]?.inventories,
                inventory: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.[0]?.inventory,
                video_url: productCreated?.sme_catalog_product_by_pk.video_url || '',
                origin_stock: originStock,
                ...comboQuantity,
                ...descriptionObj,
                ..._disableFields,
                height: logistics?.size_height || undefined,
                length: logistics?.size_length || undefined,
                width: logistics?.size_width || undefined,
                weight: logistics?.weight,
                ...properties,
                ..._attributeValueForm,
                description_extend
            }
        }
        return {}
    }, [productCreated?.sme_catalog_product_by_pk])

    const helmetRender = useMemo(
        () => {
            if (!productCreated?.sme_catalog_product_by_pk?.name) return null;

            return (
                <Helmet
                    titleTemplate={`${productCreated?.sme_catalog_product_by_pk?.name} - UpBase`}
                    defaultTitle={`${productCreated?.sme_catalog_product_by_pk?.name} - UpBase`}
                >
                    <meta name="description" content={`${productCreated?.sme_catalog_product_by_pk?.name} - UpBase`} />
                </Helmet>
            )
        }, [productCreated?.sme_catalog_product_by_pk?.name]
    );

    const imgAssets = useMemo(() => {
        return _.minBy(productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_assets?.filter(_asset => !_asset.is_video).map(__vv => ({ ...__vv, position: __vv.position_show || 0 })), 'position')
    }, [productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_assets])

    const isSyncVietful = useMemo(() => {
        return productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.some(
             (variant) => variant.provider_links?.length > 0 && variant.provider_links?.some(provider => provider?.provider_code == 'vietful' && !provider?.sync_error_msg)
           );    
     }, [productCreated])
    if (!!error) {
        return <ConfirmDialog title='Sản phẩm không tồn tại' show={true} onHide={() => {
            try {
                window.open("about:blank", "_self")
                window.close()
            } catch (err) {

            }
        }} />
    }

    if (loadingDetail || Object.keys(initialValues).length == 0)
        return (
            <div className="row" data-sticky-container style={{ justifyContent: 'center', alignItems: 'center' }} >
                <span className="spinner spinner-primary" style={{ marginTop: 20 }} ></span>
            </div>
        );

    console.log({ initialValues })

    const onShowProductConnect = () => {
        setIdsProductsConnected(productCreated?.sme_catalog_product_by_pk?.scProductMapping?.map(_scProduct => _scProduct.sc_product_id))
        setSmeProductIdSelect(match.params.id)
    }

    return (
        <>
            {helmetRender}
            <Card >
                <ModalProductConnect
                    scProductIds={idsProductsConnected}
                    hasAttribute={false}
                    smeProductIdSelect={smeProductIdSelect}
                    onHide={() => { refetch(); setIdsProductsConnected([]) }}
                />
                <CardBody style={{ padding: '1rem' }} >
                    <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                        <div style={{
                            backgroundColor: '#F7F7FA',
                            width: 50, height: 50,
                            borderRadius: 8,
                            overflow: 'hidden',
                            minWidth: 50
                        }} className='mr-6' >
                            {
                                !!imgAssets && <img src={imgAssets?.asset_url}
                                    style={{ width: 50, height: 50, objectFit: 'contain' }} />
                            }
                        </div>
                        <div>
                            <p className='font-weight-normal mb-1' style={{ fontSize: 14 }} >
                                {productCreated?.sme_catalog_product_by_pk?.name}
                                <span className="text-primary ml-4 fs-14">Combo</span>
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center' }} >
                                <p style={{ fontSize: 12 }} className='mb-1'><img className="mr-2" src={toAbsoluteUrl('/media/ic_sku.svg')} /> {productCreated?.sme_catalog_product_by_pk?.sku || '--'}</p>
                            </div>
                            <span
                                className={`${productCreated?.sme_catalog_product_by_pk?.scProductMapping?.length ? 'text-primary cursor-pointer' : "text-secondary-custom"} ` + 'fs-12'}
                                onClick={() => {
                                    if (productCreated?.sme_catalog_product_by_pk?.scProductMapping?.length === 0) return;
                                    onShowProductConnect()

                                }}
                            >
                                {productCreated?.sme_catalog_product_by_pk?.scProductMapping?.length || 0} {formatMessage({ defaultMessage: 'liên kết' })}
                            </span>
                        </div>
                    </div>
                </CardBody>
            </Card>
            <Formik
                initialValues={initialValues}
                validationSchema={Yup.object().shape(productEditComboSchema)}
            // enableReinitialize={true}
            >
                {
                    (formikProps) => {
                        const changed = formikProps.values['__changed__']
                        return <>
                            <RouterPrompt
                                when={changed}
                                title={formatMessage({ defaultMessage: "Bạn đang chỉnh sửa sản phẩm. Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?" })}
                                cancelText={formatMessage({ defaultMessage: "KHÔNG" })}
                                okText={formatMessage({ defaultMessage: "CÓ, THOÁT" })}
                                onOK={() => true}
                                onCancel={() => false}
                            />
                            <ProductEditComboInfo
                                history={history}
                                isSyncVietful={isSyncVietful}
                                formikProps={formikProps}
                                setIdProductCreated={setIdProductCreated}
                                productCreated={productCreated?.sme_catalog_product_by_pk || null}
                            />
                        </>
                    }
                }
            </Formik>
        </>
    );
}
