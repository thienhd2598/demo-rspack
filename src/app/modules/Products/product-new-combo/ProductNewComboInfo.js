/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import { useMutation, useQuery } from "@apollo/client";
import { convertToRaw } from 'draft-js';
import { Form, useFormikContext } from "formik";
import React, { useMemo, useRef, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useIntl } from "react-intl";
import { Element, Link, animateScroll } from 'react-scroll';
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import productCreateCombo from '../../../../graphql/mutate_productCreateCombo';
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { useProductsUIContext } from "../ProductsUIContext";
import { queryCheckExistGtin, queryCheckExistSku, queryCheckExistSkuMain } from "../ProductsUIHelpers";
import ProductBasicInfo from "../product-basic-info";
import ProductDescription from "../product-description";
import ProductImages from "../product-images";
import ProductInventory from "../product-inventory";
import ProductSellInfo from "../product-sell-info";
import ProductShipping from "../product-shipping";
import ChooseStoreDialog from '../product-new/ChooseStoreDialog';
import LoadingDialog from "../product-new/LoadingDialog";
import ProductInfoCombo from "../product-info-combo";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";

const Sticky = require('sticky-js');


export function ProductNewComboInfo({
    history,
    formikProps,
}) {
    const {
        handleSubmit,
        values,
        validateForm,
        setFieldValue,
        ...rest
    } = formikProps;
    const {
        variantsCombo,
        attributesSelected,
        variants,
        productFiles,
        productVideFiles,
        productAttributeFiles,
        resetAll,
        setCurrentProduct,
        setCurrentStep,
        currentProduct,
        logisticChannels,
        smeCatalogStores,
        productSizeChart,
        productImageOrigin,
        btnRefCollapseDescription,
        openBlockDescription,
        btnRefCollapseImage,
        openBlockImage
    } = useProductsUIContext();
    const _refCalled = useRef(false)
    const _refPayload = useRef()
    const { formatMessage } = useIntl()
    const [idProductCreated, setIdProductCreated] = useState()
    const [showChooseStore, setShowChooseStore] = useState()

    const [create, { loading }] = useMutation(productCreateCombo, {
        refetchQueries: ['sme_catalog_product', 'sme_catalog_product_tags'],
        awaitRefetchQueries: true
    })

    const [errorMessage, setErrorMessage] = useState("");
    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });
    const [optionsStore] = useMemo(() => {
        let _options = dataStore?.sc_stores?.filter(_store => _store.status == 1).map(_store => {
            let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
            return {
                label: _store.name,
                value: _store.id,
                logo: _channel?.logo_asset_url,
                connector_channel_code: _store.connector_channel_code,
                special_type: _store.special_type
            }
        }) || [];
        return [_options]
    }, [dataStore])

    useMemo(() => {
        if (!!errorMessage) {
            animateScroll.scrollToTop();
        }
    }, [errorMessage])
    useMemo(() => {
        setCurrentStep(1)
        requestAnimationFrame(() => {
            new Sticky('.sticky')
        })
    }, [])

    const isProductFileInValid = productFiles.some(_file => !!_file.file)
        || Object.values(productAttributeFiles).filter(_file => attributesSelected.length > 0 && attributesSelected[0].id == _file.attribute_id).some(_file => !!_file.file)
        || productVideFiles.some(__ => !!values[`upload-video-error-${__.id}`])

    const createProduct = async (values, isSave, form, channel) => {
        console.log('createProduxxxxxct', values)

        if (values['description_extend_count'] > 0 && values['description_extend_count'] < 100 && values['description_extend_img_count'] == 0) {
            setErrorMessage(formatMessage({ defaultMessage: 'Mô tả kèm hình ảnh yêu cầu tối thiểu có 1 hình ảnh hoặc 100 ký tự.' }))
            setFieldValue('description_extend_error', true)
            return
        }

        //Check sku tong
        let resCheckSKUTong = await queryCheckExistSkuMain(null, values[`sku`] || '');
        if (resCheckSKUTong && !!values.sku) {
            setFieldValue(`variant-sku_boolean`, { sku: true })
            setTimeout(() => {
                handleSubmit()
            }, 100);
            setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
            return;
        }

        let resCheckGtinExist = await queryCheckExistGtin(null, values.gtin || '');
        if (resCheckGtinExist && !!values.gtin) {
            setFieldValue(`variant-gtin_boolean`, { gtin: true })
            setTimeout(() => {
                handleSubmit()
            }, 100);
            setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
            return;
        }

        const totalStockOnHand = variantsCombo?.length > 0
            ? Math.min(
                ...variantsCombo?.map(_variant => {
                    if (values[`variant-combo-${_variant?.id}-quantity`] > 0) {
                        return Math.round(_variant?.inventory?.stock_actual / values[`variant-combo-${_variant?.id}-quantity`]);
                    } else {
                        return _variant?.inventory?.stock_actual
                    }
                })
            ) : 0;

        if (!!values[`variant-total-ratio-boolean`]) {
            setErrorMessage(formatMessage({ defaultMessage: 'Tổng tỷ lệ phân bổ giá của combo phải bằng 100%' }));
            return;
        }

        const combo_items = variantsCombo?.map(
            _variant => ({
                variant_id: _variant?.id,
                quantity: values[`variant-combo-${_variant?.id}-quantity`] || null,
                costRatioValue: values[`variant-combo-${_variant?.id}-costRatioValue`] || null,
            })
        );

        //
        const newvariants = {
            attributes: [],
            price: values.price || null,
            costPrice: values.costPrice || null,
            priceMinimum: values.priceMinimum || null,
            gtin: values.gtin || values.origin_sku || '',
            stockWarning: typeof values.stockWarning == 'number' ? values.stockWarning : null,
            stockOnHand: totalStockOnHand,
            sku: values.origin_sku,
            vatRate: typeof values.vatRate == 'number' ? values.vatRate : null,
            position: 0,
            visible: true,
            name: values.name,
            warehouses: smeCatalogStores?.map(store => {
                const stockOnHandCombo = variantsCombo?.length > 0
                    ? Math.min(...variantsCombo?.map(_variant => {
                        const inventory = _variant?.inventories?.find(iv => iv?.sme_store_id === store?.value);
                        const valueInventory = inventory?.stock_actual

                        if (values[`variant-combo-${_variant?.id}-quantity`] > 0) {
                            return Math.floor(valueInventory / values[`variant-combo-${_variant?.id}-quantity`]);
                        } else {
                            return valueInventory
                        }
                    })) : 0

                return {
                    warehouse_id: store?.value,
                    stockOnHand: stockOnHandCombo
                }
            })
        }

        let description_extend = []
        try {
            let rawDes = convertToRaw(values.description_extend.getCurrentContent());
            description_extend = rawDes.blocks.map(__ => {
                if (__.entityRanges.length > 0) {
                    return {
                        field_type: 'image',
                        text: __.text,
                        image_info: {
                            sme_url: rawDes.entityMap[__.entityRanges[0]?.key]?.data?.src
                        }
                    }
                }
                if (__.text.length == 0) {
                    return null
                } else {
                    return {
                        field_type: 'text',
                        text: __.text
                    }
                }
            }).filter(__ => !!__)
        } catch (error) { }

        let tags = values?.product_tags?.map(
            _tag => {
                let { value, label } = _tag;
                if (_tag?.__isNew__) {
                    return {
                        title: label
                    }
                }
                return {
                    id: value,
                    title: label
                }
            }
        ) || [];

        let productBody = {
            info: {
                name: values.name,
                description: values.description,
                brand_name: values.brand_name,
                description_html: values.description_html,
                video_url: values.video_url,
                description_short: values.description_short,
                sku: values.sku,
                name_seo: values.seoName,
                is_lot: !!values['is_lot'],
                serial_type: values['serial_type'] || null,
                is_expired_date: !!values['is_expired_date'],
                catalog_category_id: values['catalog_category_id'] || null,
                stockOnHand: totalStockOnHand,
                price: values.price || null,
                description_extend: JSON.stringify(description_extend),
            },
            logistics: {
                size_height: values.height,
                size_length: values.length,
                size_width: values.width,
                weight: values.weight,
            },
            combo_items: combo_items,
            store_id: smeCatalogStores[0]?.value,
            product_images: productFiles.map((_file, index) => ({ asset_id: _file.id, url: _file.source, positionShow: index })),
            product_videos: productVideFiles.map((_file, index) => ({ asset_id: _file.id, url: _file.source, positionShow: index })),
            variants: newvariants,
            tags,
            tier_variations: [],
            custom_attributes: [],
            product_size_chart: !!productSizeChart && !!productSizeChart.id ? { asset_id: productSizeChart.id, url: productSizeChart.source, positionShow: 0 } : null,
            product_image_origin: !!productImageOrigin && !!productImageOrigin.id ? { asset_id: productImageOrigin.id, url: productImageOrigin.source, positionShow: 0 } : null
        }

        setFieldValue(`__changed__`, false);

        let { data, errors } = await create({
            variables: {
                productInput: productBody
            }
        })

        console.log({ data });
        if (!!data) {
            if (isSave) {
                setIdProductCreated(data?.productComboCreate?.product_id)
                history.push({
                    pathname: '/product-stores/new',
                    state: {
                        channel: channel,
                        idProductCreated: data?.productComboCreate?.product_id
                    }
                })
            } else {
                history.push('/products/list')
            }
        } else {
            if (!!errors) {
                setErrorMessage(errors[0].message)
                setFieldValue(`__changed__`, true)
            }
        }
    }

    const onShowBlockDescription = () => {
        if (btnRefCollapseDescription?.current && !openBlockDescription)
            btnRefCollapseDescription.current.click();
    }

    const onShowBlockImage = () => {
        if (btnRefCollapseImage?.current && !openBlockImage)
            btnRefCollapseImage.current.click();
    }

    return <div className="row " data-sticky-container>
        <div className="col-9">
            <Form>
                {
                    !!errorMessage && <div className='bg-danger text-white py-4 px-4  rounded-sm mb-4' >
                        <span>{errorMessage}</span>
                    </div>
                }
                <div className="mb-4">
                    <h6 style={{ fontSize: 18 }}>{formatMessage({ defaultMessage: 'THÔNG TIN SẢN PHẨM' })}<OverlayTrigger
                        placement="bottom-start"
                        overlay={
                            <Tooltip className="custom-tooltip">
                                {formatMessage({ defaultMessage: 'Thông tin sản phẩm là nơi chứa các thông tin chung của sản phẩm' })}
                            </Tooltip>
                        }
                    >
                        <i className="fas fa-info-circle ml-2"></i>
                    </OverlayTrigger></h6>
                </div>
                <Element id='productInfo'  >
                    <ProductBasicInfo isCombo={true}/>
                </Element>
                <Element id='productAssets'>
                    <ProductImages />
                </Element>
                <Element id='productDescription'>
                    <ProductDescription />
                </Element>
                <Element id='productShipping'>
                    <ProductShipping />
                </Element>
                <div className="mb-4">
                    <h6 style={{ fontSize: 18 }}>{formatMessage({ defaultMessage: 'THÔNG TIN HÀNG HÓA' })}<OverlayTrigger
                        placement="bottom-start"
                        overlay={
                            <Tooltip className="custom-tooltip">
                                {formatMessage({ defaultMessage: 'Thông tin hàng hoá là nơi chứa các thông tin của sản phẩm nhằm mục đích để quản lý tồn kho' })}
                            </Tooltip>
                        }
                    >
                        <i className="fas fa-info-circle ml-2"></i>
                    </OverlayTrigger></h6>
                </div>
                <Element id='productInventory'>
                    <ProductInventory isCombo />
                </Element>
                <Element id='productInfoCombo'>
                    <ProductInfoCombo isCreating />
                </Element>
                <div className='d-flex justify-content-end' >
                    <button className="btn btn-secondary mr-2" style={{ width: 150 }} onClick={e => {
                        e.preventDefault()
                        history.push('/products/list')
                    }} >{formatMessage({ defaultMessage: 'Hủy bỏ' })}</button>
                    <button className="btn btn-secondary mr-2" style={{ width: 150 }} type="submit" onClick={async (e) => {
                        e.preventDefault();

                        let error = await validateForm(values);
                        if (variantsCombo?.length == 0) {
                            setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng thêm ít nhất 1 sản phẩm trong combo' }));
                            return;
                        }

                        const existErrBlockDescription = Object.keys(error)?.some(_err => _err.startsWith('description'));
                        if (existErrBlockDescription) onShowBlockDescription();

                        if (Object.values(error).length != 0 && !Object.keys(error)?.includes('main-unit')) {
                            handleSubmit()
                            setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
                            return;
                        } else {
                            if (isProductFileInValid || (values?.is_has_sell_info && attributesSelected.length > 0 && attributesSelected[0].values.some(_value => !!productAttributeFiles[_value.code] && productAttributeFiles[_value.code].files.length != 0 && productAttributeFiles[_value.code].files.some(_file => _file.hasError || _file.isUploading)))) {
                                if (isProductFileInValid) onShowBlockImage();
                                setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
                                return
                            }
                            if (productFiles.length == 0) {
                                onShowBlockImage();
                                setErrorMessage(formatMessage({ defaultMessage: 'Hình ảnh sản phẩm yêu cầu tối thiểu 1 ảnh' }))
                                return
                            }

                            if (!!productImageOrigin && productImageOrigin.hasError) {
                                onShowBlockImage();
                                setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ.' }))
                                return
                            }

                            if (productFiles.some(__ => !!__.isUploadError) || productVideFiles.some(__ => !!__.isUploadError) || productSizeChart?.hasError || productImageOrigin?.hasError) {
                                onShowBlockImage();
                                setErrorMessage(formatMessage({ defaultMessage: 'Hình ảnh/Video tải lên không thỏa mãn. Xin vui lòng tải lại hình ảnh/video.' }));
                                return
                            }

                            if (productFiles.some(__ => !!__.isUploading) || productVideFiles.some(__ => !!__.isUploading) || !!productSizeChart?.isUploading || !!productImageOrigin?.isUploading) {
                                onShowBlockImage();
                                setErrorMessage(formatMessage({ defaultMessage: 'Hình ảnh/Video đang tải lên. Xin vui lòng thử lại sau.' }));
                                return
                            }
                        }
                        setErrorMessage(false)
                        if (_refCalled.current) {
                            return
                        }
                        _refCalled.current = true
                        createProduct(values, false, rest)
                        _refCalled.current = false

                    }}>{formatMessage({ defaultMessage: 'Lưu lại' })}</button>
                    <AuthorizationWrapper keys={['product_create_store_product']}>
                        <button className="btn btn-primary" type="submit" onClick={async (e) => {
                            e.preventDefault();
                            let error = await validateForm(values);

                            if (variantsCombo?.length == 0) {
                                setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng thêm ít nhất 1 sản phẩm trong combo' }));
                                return;
                            }

                            const existErrBlockDescription = Object.keys(error)?.some(_err => _err.startsWith('description'));
                            if (existErrBlockDescription) onShowBlockDescription();

                            if (Object.values(error).length != 0) {
                                handleSubmit()
                                setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
                                return;
                            } else {
                                if (isProductFileInValid || (values?.is_has_sell_info && attributesSelected.length > 0 && attributesSelected[0].values.some(_value => !!productAttributeFiles[_value.code] && productAttributeFiles[_value.code].files.length != 0 && productAttributeFiles[_value.code].files.some(_file => _file.hasError || _file.isUploading)))) {
                                    if (isProductFileInValid) onShowBlockImage();
                                    setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
                                    return
                                }
                                if (productFiles.length == 0) {
                                    onShowBlockImage();
                                    setErrorMessage(formatMessage({ defaultMessage: 'Hình ảnh sản phẩm yêu cầu tối thiểu 1 ảnh' }))
                                    return
                                }
                                if (!!productImageOrigin && productImageOrigin.hasError) {
                                    onShowBlockImage();
                                    setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ.' }))
                                    return
                                }

                                if (productFiles.some(__ => !!__.isUploadError) || productVideFiles.some(__ => !!__.isUploadError) || productSizeChart?.hasError || productImageOrigin?.hasError) {
                                    onShowBlockImage();
                                    setErrorMessage(formatMessage({ defaultMessage: 'Hình ảnh/Video tải lên không thỏa mãn. Xin vui lòng tải lại hình ảnh/video.' }));
                                    return
                                }

                                if (productFiles.some(__ => !!__.isUploading) || productVideFiles.some(__ => !!__.isUploading) || !!productSizeChart?.isUploading || !!productImageOrigin?.isUploading) {
                                    onShowBlockImage();
                                    setErrorMessage(formatMessage({ defaultMessage: 'Hình ảnh/Video đang tải lên. Xin vui lòng thử lại sau.' }));
                                    return
                                }
                            }
                            setErrorMessage(false)
                            if (_refCalled.current) {
                                return
                            }
                            _refCalled.current = true
                            _refPayload.current = values
                            // createProduct(values, true, rest)

                            setShowChooseStore(true)
                            _refCalled.current = false
                        }} disabled={optionsStore.length == 0} >{formatMessage({ defaultMessage: 'Lưu và tạo sản phẩm sàn' })}</button>
                    </AuthorizationWrapper>
                </div>
            </Form>
        </div>
        <div className="col-3">
            <Card className="sticky" data-sticky="true" data-margin-top="80" >
                <CardBody>
                    <h6 className="mb-4" style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Thông tin sản phẩm' })}</h6>
                    <div className="ml-10">
                        <Link to='productInfo' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-180} duration={500}>
                            <h6 style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Thông tin cơ bản' })}</h6>
                        </Link>
                        <Link to='productAssets' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-80} duration={500}>
                            <h6 style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Hình ảnh & video' })}</h6>
                        </Link>
                        <Link to='productDescription' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-80} duration={500}>
                            <h6 style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Mô tả sản phẩm' })}</h6>
                        </Link>
                        <Link to='productShipping' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-280} duration={500}>
                            <h6 style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Vận chuyển' })}</h6>
                        </Link>
                    </div>
                    <h6 className="mb-4" style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Thông tin hàng hóa' })}</h6>
                    <div className="ml-10">
                        <Link to='productInventory' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-180} duration={500}>
                            <h6 style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Thông tin kho' })}</h6>
                        </Link>
                        <Link to='productInfoCombo' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-180} duration={500}>
                            <h6 style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Thông tin combo' })}</h6>
                        </Link>
                    </div>
                </CardBody>
            </Card>
        </div>
        <LoadingDialog show={loading} />
        <ChooseStoreDialog show={showChooseStore}
            onHide={() => setShowChooseStore(false)}
            options={optionsStore} idProductCreated={idProductCreated}
            onChoosed={_channel => {
                createProduct(_refPayload.current, true, null, _channel)
            }}
        />
    </div>
}
