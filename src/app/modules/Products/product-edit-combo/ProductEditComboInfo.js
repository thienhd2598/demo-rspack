/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import { Form } from "formik";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import ProductBasicInfo from "../product-basic-info";
import ProductSellInfo from "../product-sell-info";
import { useProductsUIContext } from "../ProductsUIContext";
import ProductImages from "../product-images";
import ProductDescription from "../product-description";
import ProductShipping from "../product-shipping";
import { useIntl } from "react-intl";
import { Element, Link, animateScroll } from 'react-scroll';
import { queryCheckExistGtin, queryCheckExistSku, queryCheckExistSkuMain, validatePriceVariant } from "../ProductsUIHelpers";
import LoadingDialog from "../product-edit/LoadingDialog";
import { useMutation } from "@apollo/client";

import productCreate from '../../../../graphql/mutate_productCreate'
import ProductStep from "../product-step";
import mutate_productUpdate from "../../../../graphql/mutate_productUpdate";
import _ from 'lodash'
import { calcKLLogistic } from "../../../../utils";
import ChooseOptionSync from "../product-edit/ChooseOptionSync";
import mutate_scProductSyncUp from "../../../../graphql/mutate_scProductSyncUp";
import { convertToRaw } from 'draft-js';
import ProductInventory from "../product-inventory";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import mutate_scHandleSmeProductDeleted from "../../../../graphql/mutate_scHandleSmeProductDeleted";
import ProductInfoCombo from "../product-info-combo";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";

const Sticky = require('sticky-js');


export function ProductEditComboInfo({
    history,
    formikProps,
    productCreated,
    isSyncVietful
}) {
    const [showConfirm, setShowConfirm] = useState(false);
    const _refValueUpdate = useRef();
    const {
        handleSubmit,
        values,
        validateForm,
        setFieldValue,
        ...rest
    } = formikProps
    const { formatMessage } = useIntl()
    const {
        productEditSchema,
        attributesSelected,
        variantsCombo,
        variants,
        productFiles,
        productVideFiles,
        productAttributeFiles,
        resetAll,
        smeCatalogStores,
        setCurrentStep,
        productSizeChart,
        productImageOrigin,
        btnRefCollapseDescription,
        openBlockDescription,
        btnRefCollapseImage,
        openBlockImage
    } = useProductsUIContext();
    const [create, { loading }] = useMutation(productCreate, {
        refetchQueries: ['sme_catalog_product'],
        awaitRefetchQueries: true
    })

    const [syncUp, { loading: loadingSyncup }] = useMutation(mutate_scProductSyncUp)
    const [scHandleSmeProductDeleted] = useMutation(mutate_scHandleSmeProductDeleted)
    const [update, { loading: loadingCreate }] = useMutation(mutate_productUpdate, {
        refetchQueries: ['sme_catalog_product', 'sme_catalog_product_by_pk', 'sme_catalog_product_tags'],
        awaitRefetchQueries: true
    })
    const [errorMessage, setErrorMessage] = useState("");


    useMemo(() => {
        if (!!productCreated) {
            (productCreated?.sme_catalog_product_variants || []).forEach(_variant => {
                (_variant.attributes || []).forEach(_attribute => {
                    setFieldValue(`att-${_attribute.sme_catalog_product_attribute_value?.product_attribute_custom_id || _attribute.sme_catalog_product_attribute_value?.product_attribute_id}-${_attribute.sme_catalog_product_attribute_value?.ref_index}`, _attribute.sme_catalog_product_attribute_value?.name)
                });

            });
        }
    }, [productCreated])

    useMemo(() => {
        if (!!errorMessage) {
            animateScroll.scrollToTop();
        }
    }, [errorMessage])
    useEffect(() => {
        setCurrentStep(1)
        requestAnimationFrame(() => {
            new Sticky('.sticky')
        })
        return () => {
            setFieldValue('__changed__', false)
        }
    }, []);

    const isProductFileInValid = productFiles.some(_file => !!_file.file)
        || Object.values(productAttributeFiles).filter(_file => attributesSelected.length > 0 && attributesSelected[0].id == _file.attribute_id).some(_file => !!_file.file)
        || productVideFiles.some(__ => !!values[`upload-video-error-${__.id}`])


    const updateProduct = async (values, syncOption) => {

        if (values['description_extend_count'] > 0 && values['description_extend_count'] < 100 && values['description_extend_img_count'] == 0) {
            setErrorMessage(formatMessage({ defaultMessage: 'Mô tả kèm hình ảnh yêu cầu tối thiểu có 1 hình ảnh hoặc 100 ký tự.' }))
            setFieldValue('description_extend_error', true)
            setTimeout(() => {
                handleSubmit()
            }, 100);
            return
        }


        //Check sku tong
        let resCheckSKUTong = await queryCheckExistSkuMain(productCreated.id, values.sku);
        if (resCheckSKUTong && !!values.sku) {
            setFieldValue(`variant-sku_boolean`, { sku: true })
            setTimeout(() => {
                handleSubmit()
            }, 100);
            setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
            return;
        }

        //
        let tier_variations = [];
        attributesSelected.filter(_att => !_att.isInactive).forEach(_attribute => {
            (_attribute.values || []).forEach((_value, index) => {

                let attributeFiles = productAttributeFiles[_value.code] || { files: [] }

                tier_variations.push({
                    attribute_id: _attribute.ref_index || String(_attribute.id),
                    attribute_value: _value.v,
                    isCustom: _attribute.isCustom || false,
                    ref_index: _value.code,
                    attribute_assets: (attributeFiles.files || []).map((_file, index) => ({ asset_id: _file.id, url: _file.source, positionShow: index })),
                    position: index
                })
            })
        })

        let allAttributes = _.flatten((productCreated.sme_catalog_product_variants || []).map(_variant => _variant.attributes));
        let tier_variations_delete = allAttributes.filter(_attribute => !tier_variations.some(_tier => _tier.ref_index == _attribute.sme_catalog_product_attribute_value?.ref_index)).map(_attribute => _attribute.sme_catalog_product_attribute_value?.id)
        //  
        let promiseCheckExistSku = [];
        let promiseCheckExistSkuLocal = [];
        let hasVariantVisible = false;

        const totalStockOnHand = smeCatalogStores?.reduce(
            (result, store) => {
                result += values[`${store?.value}-stockOnHand`] || 0;
                return result;
            }, 0
        );

        let newvariants = variants.map((_variant, index) => {
            promiseCheckExistSku.push(queryCheckExistSku(productCreated.id, values[`variant-${_variant.code}-sku`] || ''))
            promiseCheckExistSkuLocal.push(variants.some((_vv) => _vv.code != _variant.code && values[`variant-${_vv.code}-sku`] == values[`variant-${_variant.code}-sku`]))
            // totalStockOnHandVariant += (values[`variant-${_variant.code}-stockOnHand`] || 0);
            if (values[`variant-${_variant.code}-visible`])
                hasVariantVisible = values[`variant-${_variant.code}-visible`]

            let keyAttribute = _variant.attributes.map(_att => _att.attribute_value_ref_index)
            keyAttribute.sort((a, b) => {
                if (a < b) { return -1; }
                if (a > b) { return 1; }
                return 0;
            })
            keyAttribute = keyAttribute.join('-')
            let lastVariant = (productCreated.sme_catalog_product_variants || []).find(_lastVariant => {
                let lastKeyAttribute = _lastVariant.attributes.map(_att => _att.sme_catalog_product_attribute_value?.ref_index)
                lastKeyAttribute.sort((a, b) => {
                    if (a < b) { return -1; }
                    if (a > b) { return 1; }
                    return 0;
                })
                return lastKeyAttribute.join('-') == keyAttribute
            })

            const totalStockOnHandVariant = smeCatalogStores?.reduce(
                (result, store) => {
                    result += values[`variant-${_variant.code}-${store?.value}-stockOnHand`] || 0;
                    return result;
                }, 0
            );

            return {
                attributes: _variant.attributes,
                price: values[`variant-${_variant.code}-price`] || null,
                costPrice: values[`variant-${_variant.code}-costPrice`] || null,
                priceMinimum: values[`variant-${_variant.code}-priceMinimum`] || null,
                gtin: values[`variant-${_variant.code}-gtin`] || values[`variant-${_variant.code}-sku`] || '',
                stockOnHand: totalStockOnHandVariant,
                stockWarning: typeof values.stockWarning == 'number' ? values.stockWarning : null,
                sku: values[`variant-${_variant.code}-sku`],
                position: index,
                id: lastVariant?.id,
                visible: true,
                name: _variant.name
            }
        });
        //
        if (newvariants.length == 0) {
            let idRoot = null;
            if ((productCreated.sme_catalog_product_variants || []).length == 1 && productCreated.sme_catalog_product_variants[0].attributes.length == 0) {
                idRoot = productCreated.sme_catalog_product_variants[0].id;
            }

            newvariants.push({
                id: idRoot,
                attributes: [],
                price: values.price || null,
                costPrice: values.costPrice || null,
                priceMinimum: values.priceMinimum || null,
                stockOnHand: totalStockOnHand,
                gtin: values.gtin || values.origin_sku || '',
                stockWarning: typeof values.stockWarning == 'number' ? values.stockWarning : null,
                vatRate: typeof values.vatRate == 'number' ? values.vatRate : null,
                sku: values.origin_sku,
                position: 0,
                visible: true,
                name: values.name
            })


            // let resCheckSku = await queryCheckExistSkuMain(productCreated.id, values['sku']);
            // if (resCheckSku) {
            //   setFieldValue(`variant-sku_boolean`, { origin_sku: true })
            //   setErrorMessage('Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ')
            //   return;
            // }
        } else {
            // if (totalStockOnHandVariant != values['stockOnHand']) {
            //   setErrorMessage('Vui lòng kiểm tra lại số liệu tồn kho. Tổng tồn kho phân loại sản phẩm phải bằng tổng tồn kho của sản phẩm')
            //   return;
            // }

            let resCheckSku = await Promise.all(promiseCheckExistSku);
            let objvariantSkuBoolean = {}
            resCheckSku.forEach((_value, index) => {
                if (_value || promiseCheckExistSkuLocal[index]) {
                    objvariantSkuBoolean = {
                        ...objvariantSkuBoolean,
                        [variants[index].code]: true
                    }
                }
            });
            if (Object.keys(objvariantSkuBoolean).length > 0) {
                setFieldValue(`variant-sku_boolean`, objvariantSkuBoolean)
                setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
                setTimeout(() => {
                    handleSubmit()
                }, 100);
                return;
            }
            // if (!hasVariantVisible) {
            //   setErrorMessage('Cần chọn hiện tối thiểu 1 sku.')
            //   return;
            // }
        }
        //
        let custom_attributes = attributesSelected.filter(_att => !_att.isInactive).filter(_attribute => _attribute.isCustom).map((_attribute, index) => {
            return {
                name: _attribute.name,
                display_name: _attribute.display_name,
                options: (_attribute.values || []).map(_value => _value.v),
                ref_index: _attribute.ref_index || String(_attribute.id),
                position: index
            }
        })
        let custom_attributes_delete = (productCreated.sme_catalog_product_attributes_custom || []).filter(_attribute => {
            return !custom_attributes.some(_att => _attribute.ref_index == _att.ref_index)
        }).map(_attribute => _attribute.id);
        //
        let logistics = productCreated.sme_catalog_product_ship_package_infos[0];
        //
        let product_assets_delete = (productCreated.sme_catalog_product_assets || []).filter(_assets => {
            return !productFiles.some(_file => _file.id == _assets.asset_id) && !productVideFiles.some(_file => _file.id == _assets.asset_id) && !Object.values(productAttributeFiles).some(_file => _file.id == _assets.asset_id)
        })

        let product_images = productFiles.map((_file, index) => ({ id: _file.sme_id, asset_id: _file.id, url: _file.source, positionShow: index }));
        let product_videos = productVideFiles.map((_file, index) => ({ id: _file.sme_id, asset_id: _file.id, url: _file.source, positionShow: index }));

        let variants_update = newvariants.filter(_variant => !!_variant.id);
        let variants_add = newvariants.filter(_variant => !_variant.id).map((_variant) => ({ ..._variant }))

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
        } catch (error) { };

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

        let variants_delete = _.difference((productCreated.sme_catalog_product_variants || []).map(_var => _var.id), variants_update.map(_var => _var.id));

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

        let productBody = {
            id: productCreated.id,
            combo_items,
            info: {
                name: values.name,
                name_seo: values.seoName,
                is_lot: !!values['is_lot'],
                serial_type: values['serial_type'] || null,
                is_expired_date: !!values['is_expired_date'],
                catalog_category_id: values['catalog_category_id'] || null,
                description: values.description,
                brand_name: values.brand_name,
                description_html: values.description_html,
                video_url: values.video_url,
                description_short: values.description_short,
                sku: values.sku,
                stockOnHand: totalStockOnHand,
                price: values.price || null,
                description_extend: JSON.stringify(description_extend),
            },
            logistics: {
                id: logistics?.id,
                size_height: values?.height,
                size_length: values?.length,
                size_width: values?.width,
                weight: values?.weight || null,
            },
            product_size_chart: !!productSizeChart && !!productSizeChart.id ? { asset_id: productSizeChart.id, url: productSizeChart.source, positionShow: 0 } : null,
            product_image_origin: !!productImageOrigin && !!productImageOrigin.id ? { asset_id: productImageOrigin.id, url: productImageOrigin.source, positionShow: 0 } : null,
            product_assets_delete: product_assets_delete.length > 0 ? product_assets_delete.map(_assets => _assets.id) : [],
            product_images: product_images.length > 0 ? product_images : [],
            product_videos: product_videos.length > 0 ? product_videos : [],
            variants_update: variants_update,
            variants_add: variants_add,
            tags,
            tier_variations: [],
            tier_variations_delete: [],
            custom_attributes: [],
            custom_attributes_delete: [],
            variants_delete: []
        }

        console.log(JSON.stringify(productBody))
        setFieldValue(`__changed__`, false)
        let { data, errors } = await update({
            variables: {
                productUpdateInput: productBody
            }
        })

        if (variants_delete.length > 0) {
            scHandleSmeProductDeleted({
                variables: {
                    list_sme_product_id: [],
                    list_sme_variant_id: variants_delete,
                }
            })
        }

        if (!!data?.productUpdate?.product_id && data?.productUpdate?.product_id != 0) {
            if (!!syncOption) {

                console.log({
                    sme_product_id: productCreated.id,
                    merge_flags: syncOption
                })

                let res = await syncUp({
                    variables: {
                        sme_product_id: productCreated.id,
                        merge_flags: syncOption
                    }
                })
            }
            history.push('/products/list')
        } else {
            setFieldValue(`__changed__`, true)
            setErrorMessage(data?.productUpdate?.message || errors[0].message)
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
                    <ProductBasicInfo isCombo={true} isSyncVietful={isSyncVietful}/>
                </Element>
                <Element id='productAssets'  >
                    <ProductImages />
                </Element>
                <Element id='productDescription'  >
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
                    <ProductInventory isCombo isSyncVietful={isSyncVietful}/>
                </Element>
                <Element id='productInfoCombo'>
                    <ProductInfoCombo />
                </Element>
                <div className='d-flex justify-content-end' >
                    <button className="btn btn-secondary mr-2" style={{ width: 150 }} onClick={e => {
                        e.preventDefault()
                        history.push('/products/list')
                    }} >{formatMessage({ defaultMessage: 'Hủy bỏ' })}</button>
                    <AuthorizationWrapper keys={['product_edit']}>
                        <button className="btn btn-primary" style={{ width: 150 }} type="submit" onClick={async (e) => {
                            e.preventDefault();

                            let error = await validateForm(values);

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

                                if (productFiles.some(__ => !!__.isUploadError) || productVideFiles.some(__ => !!__.isUploadError) || productSizeChart?.hasError || productImageOrigin?.hasError) {
                                    onShowBlockImage();
                                    setErrorMessage(formatMessage({ defaultMessage: 'Hình ảnh/Video tải lên không thỏa mãn. Xin vui lòng tải lại hình ảnh/video.' }));
                                    return
                                }

                                if (!!productImageOrigin && productImageOrigin.hasError) {
                                    onShowBlockImage();
                                    setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ.' }))
                                    return
                                }

                                if (productFiles.some(__ => !!__.isUploading) || productVideFiles.some(__ => !!__.isUploading) || !!productSizeChart?.isUploading || !!productImageOrigin?.isUploading) {
                                    onShowBlockImage();
                                    setErrorMessage(formatMessage({ defaultMessage: 'Hình ảnh/Video đang tải lên. Xin vui lòng thử lại sau.' }));
                                    return
                                }
                                // if (!productSizeChart) {
                                //   setErrorMessage('Bảng quy đổi kích cỡ không được để trống')
                                //   return
                                // }
                            }

                            setErrorMessage(false)

                            if (!!productCreated) {
                                if (!productCreated?.scProductMapping || productCreated?.scProductMapping?.length == 0) {
                                    updateProduct(values, null)
                                } else {
                                    setShowConfirm(true)
                                    _refValueUpdate.current = values;
                                }
                            }

                        }} >{formatMessage({ defaultMessage: 'Lưu lại' })}</button>
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
        <LoadingDialog show={loading || loadingCreate || loadingSyncup} />
        <ChooseOptionSync
            show={showConfirm}
            productMapping={productCreated?.scProductMapping || []}
            onHide={() => setShowConfirm(false)}
            onChoosed={(syncOption) => {
                updateProduct(_refValueUpdate.current, syncOption)
            }}
        />
    </div>
}
