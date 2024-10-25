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
import LoadingDialog from "./LoadingDialog";
import { useMutation } from "@apollo/client";

import productCreate from '../../../../graphql/mutate_productCreate'
import ProductStep from "../product-step";
import mutate_productUpdate from "../../../../graphql/mutate_productUpdate";
import _ from 'lodash'
import { calcKLLogistic } from "../../../../utils";
import ChooseOptionSync from "./ChooseOptionSync";
import mutate_scProductSyncUp from "../../../../graphql/mutate_scProductSyncUp";
import { convertToRaw } from 'draft-js';
import ProductInventory from "../product-inventory";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import mutate_scHandleSmeProductDeleted from "../../../../graphql/mutate_scHandleSmeProductDeleted";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
import ProductExpireInfo from "../product-expire-info";

const Sticky = require('sticky-js');


export function ProductNewInfo({
  history,
  isSyncVietful,
  syncedVariants,
  formikProps,
  productCreated,
  refetch
}) {
  console.log(syncedVariants)
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
    openBlockImage,
    variantsUnit,
    isUnit,
    setIsUnit
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
  let newProductCreated = useMemo(() => {
    let newProductVariant = productCreated?.sme_catalog_product_variants.filter(item => item?.product_status_id == null)
    return {
      ...productCreated,
      sme_catalog_product_variants: newProductVariant?.length ? newProductVariant: []
    }
  }, [productCreated])

  useMemo(() => {
    if (!!newProductCreated) {
      (newProductCreated?.sme_catalog_product_variants || []).forEach(_variant => {
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

  console.log('values', values)
  // console.log('ProductNewInfo', variantsUnit)

  const isProductFileInValid = productFiles.some(_file => !!_file.file)
    || Object.values(productAttributeFiles).filter(_file => attributesSelected.length > 0 && attributesSelected[0].id == _file.attribute_id).some(_file => !!_file.file)
    || productVideFiles.some(__ => !!values[`upload-video-error-${__.id}`])
  const updateProduct = async (values, syncOption) => {
    setFieldValue(`__changed__`, false)
    if (values['description_extend_count'] > 0 && values['description_extend_count'] < 100 && values['description_extend_img_count'] == 0) {
      setErrorMessage(formatMessage({ defaultMessage: 'Mô tả kèm hình ảnh yêu cầu tối thiểu có 1 hình ảnh hoặc 100 ký tự.' }))
      setFieldValue('description_extend_error', true)
      setTimeout(() => {
        handleSubmit()
      }, 100);
      return
    }


    //Check sku tong
    let resCheckSKUTong = await queryCheckExistSkuMain(newProductCreated.id, values.sku);
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
    if (values['is_has_sell_info']) {
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
    }

    let allAttributes = _.flatten((newProductCreated.sme_catalog_product_variants || []).map(_variant => _variant.attributes));
    let tier_variations_delete = allAttributes.filter(_attribute => !tier_variations.some(_tier => _tier.ref_index == _attribute.sme_catalog_product_attribute_value?.ref_index)).map(_attribute => _attribute.sme_catalog_product_attribute_value?.id)
    //  
    let promiseCheckExistSku = [];
    let promiseCheckExistSkuLocal = [];
    let promiseCheckExistGtin = [];
    let promiseCheckExistGtinLocal = [];
    let hasVariantVisible = false;

    const totalStockOnHand = smeCatalogStores?.reduce(
      (result, store) => {
        result += values[`${store?.value}-stockOnHand`] || 0;
        return result;
      }, 0
    );

    const summaryVariantsUnit = !values[`switch-unit`] ? [] : variantsUnit?.flatMap(unit => {
      if (unit?.isGroupAll) {
        return variants?.map(variant => ({
          ...unit,
          code: variant?.code
        }))
      }
      return unit;
    })

    // Case nhiều đơn vị tính: mỗi đơn vị tính sẽ sinh ra 1 variant
    let newVariantsUnit = summaryVariantsUnit?.map(unit => {


      const variantSame = unit?.isGroupAll
        ? variants?.find(variant => variant?.code == values[`attribute-unit-${unit?.id}-${unit?.code}`]?.value)
        : variants?.find(variant => variant?.code == values[`attribute-unit-${unit?.id}`]?.value);

      const totalStockOnHandVariant = smeCatalogStores?.reduce(
        (result, store) => {
          result += values[`variant-${store?.value}-${unit?.id}-stockOnHand`] || 0;
          return result;
        }, 0
      );

      const description_unit = !!values[`main-unit`] && !!values[`name-unit-${unit?.id}`] && !!values[`ratio-unit-${unit?.id}`]
        ? formatMessage({ defaultMessage: '1 {nameUnit} = {ratioUnit} {mainUnit}' }, {
          ratioUnit: values[`ratio-unit-${unit?.id}`],
          nameUnit: values[`name-unit-${unit?.id}`],
          mainUnit: values[`main-unit`],
        })
        : null;

      let _unitGtin = !!variantSame ? (values[`variant-${unit?.id}-${variantSame?.code}-gtin`] || values[`unit_variant-${unit?.id}-${variantSame?.code}-sku`] || '') : (values[`variant-${unit?.id}-gtin`] || values[`unit_variant-${unit?.id}-sku`] || '')
      let _unitSku = !!variantSame ? values[`unit_variant-${unit?.id}-${variantSame?.code}-sku`] : values[`unit_variant-${unit?.id}-sku`]
      promiseCheckExistSku.push({
        key: `${unit?.id}-${variantSame?.code}`,
        query: queryCheckExistSku(newProductCreated.id, _unitSku)
      })
      promiseCheckExistGtin.push({
        key: `${unit?.id}-${variantSame?.code}`,
        query: queryCheckExistGtin(newProductCreated.id, _unitGtin)
      })

      return {
        ...(!!unit?.sme_variant_id ? {
          id: unit?.sme_variant_id
        } : {}),
        attributes: variantSame?.attributes || [],
        price: !!variantSame ? values[`variant-${unit?.id}-${variantSame?.code}-price`] || null : values[`variant-${unit?.id}-price`] || null,
        // costPrice: !!variantSame ? values[`variant-${unit?.id}-${variantSame?.code}-costPrice`] || null : values[`variant-${unit?.id}-costPrice`] || null,
        priceMinimum: !!variantSame ? values[`variant-${unit?.id}-${variantSame?.code}-priceMinimum`] || null : values[`variant-${unit?.id}-priceMinimum`] || null,
        gtin: _unitGtin,
        sku: _unitSku,
        // vatRate: !!variantSame ? values[`variant-${unit?.id}-${variantSame?.code}-vatRate`] : values[`variant-${unit?.id}-vatRate`] || null,
        stockOnHand: totalStockOnHandVariant,
        stockWarning: typeof values.stockWarning == 'number' ? values.stockWarning : null,
        position: 10,
        visible: true,
        name: variantSame?.name || values?.name,
        unitInfo: {
          description: description_unit,
          isMain: 0,
          name: values[`name-unit-${unit?.id}`] || '',
          ratio: values[`ratio-unit-${unit?.id}`],
          ratio_type: 1
        },
        warehouses: smeCatalogStores?.map(store => {
          const stockStore = !!variantSame?.code ? values[`variant-unit-${unit?.id}-${variantSame?.code}-stockOnHand`]?.find(item => item?.storeId == store?.value) : values[`variant-unit-${unit?.id}-stockOnHand`]?.find(item => item?.storeId == store?.value)
          return {
            warehouse_id: stockStore?.storeId,
            stockOnHand: stockStore?.stockOnHand
          }
        })
      }
    })
    let newvariants = []
    // Case nhiều nhóm phân loại
    newvariants = variants.map((_variant, index) => {
      promiseCheckExistSku.push({
        key: _variant.code,
        query: queryCheckExistSku(newProductCreated.id, values[`variant-${_variant.code}-sku`] || '')
      })
      promiseCheckExistSkuLocal.push(variants.some((_vv) => _vv.code != _variant.code && values[`variant-${_vv.code}-sku`] == values[`variant-${_variant.code}-sku`]))
      promiseCheckExistGtin.push({
        key: _variant.code,
        query: queryCheckExistGtin(newProductCreated.id, values[`variant-${_variant.code}-gtin`] || '')
      })
      promiseCheckExistGtinLocal.push(variants.some((_vv) => !!values[`variant-${_variant.code}-gtin`] && _vv.code != _variant.code && values[`variant-${_vv.code}-gtin`] == values[`variant-${_variant.code}-gtin`]))
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
      //đoạn tìm lastVariant bị sai với case nhiều ĐVT, vì 2 ĐVT có cùng nhóm phân loại. đây là ĐVT chính, nên cần filter thêm
      let lastVariant = (newProductCreated.sme_catalog_product_variants || []).find(_lastVariant => {
        //DVT phu thi return
        if (!!_lastVariant?.variant_unit) {
          return false
        }
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
        // costPrice: values[`variant-${_variant.code}-costPrice`] || null,
        priceMinimum: values[`variant-${_variant.code}-priceMinimum`] || null,
        // vatRate: values[`variant-${_variant.code}-vatRate`] || null,
        gtin: values[`variant-${_variant.code}-gtin`] || values[`variant-${_variant.code}-sku`] || '',
        stockOnHand: totalStockOnHandVariant,
        stockWarning: typeof values.stockWarning == 'number' ? values.stockWarning : null,
        sku: values[`variant-${_variant.code}-sku`],
        position: 1,
        id: lastVariant?.id,
        visible: true,
        name: _variant.name,
        unitInfo: {
          description: "1",
          isMain: 1,
          name: !values[`switch-unit`] ? (values[`variant-${_variant.code}-unit`] || ''):( values['main-unit'] || ''),
          ratio: 1,
          ratio_type: 1
        },
        warehouses: smeCatalogStores?.map(store => ({
          warehouse_id: store?.value,
          stockOnHand: values[`variant-${_variant.code}-${store?.value}-stockOnHand`]
        }))
      }
    });

    // Case 0 có nhóm phân loại
    if (!values['is_has_sell_info']) {
      let idRoot = null;
      if (newProductCreated.sme_catalog_product_variants[0].attributes.length == 0) {
        const variantNotUnit = newProductCreated.sme_catalog_product_variants?.find(item => !item?.variant_unit);
        idRoot = variantNotUnit?.id;
      }
      newvariants = [];
      console.log(values[`switch-unit`])
      console.log(values[`unit`])
      newvariants.push({
        id: idRoot,
        attributes: [],
        price: values.price || null,
        // costPrice: values.costPrice || null,
        priceMinimum: values.priceMinimum || null,
        stockOnHand: totalStockOnHand,
        gtin: values.gtin || values.origin_sku || '',
        stockWarning: typeof values.stockWarning == 'number' ? values.stockWarning : null,
        // vatRate: typeof values.vatRate == 'number' ? values.vatRate : null,
        sku: values.origin_sku,
        position: 0,
        visible: true,
        name: values.name,
        unitInfo: {
          description: "1",
          isMain: 1,
          name: !values[`switch-unit`] ? (values[`unit`] || ''): (values[`main-unit`] || ''),
          ratio: 1,
          ratio_type: 1
        },
        warehouses: smeCatalogStores?.map(store => ({
          warehouse_id: store?.value,
          stockOnHand: values[`${store?.value}-stockOnHand`]
        }))
      });

      // Total variants


      let resCheckGtin = await queryCheckExistGtin(newProductCreated.id, values['gtin']);
      if (resCheckGtin && !!values['gtin']) {
        setFieldValue(`variant-gtin_boolean`, { gtin: true })
        setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
        return;
      }
    } else {
      // if (totalStockOnHandVariant != values['stockOnHand']) {
      //   setErrorMessage('Vui lòng kiểm tra lại số liệu tồn kho. Tổng tồn kho phân loại sản phẩm phải bằng tổng tồn kho của sản phẩm')
      //   return;
      // }

      let resCheckSku = await Promise.all(promiseCheckExistSku.map(__ => __.query));
      let objvariantSkuBoolean = {}
      resCheckSku.forEach((_value, index) => {
        if (_value) {
          objvariantSkuBoolean = {
            ...objvariantSkuBoolean,
            [promiseCheckExistSku[index].key]: true
          }
        }
      });
      promiseCheckExistSkuLocal.forEach((_value, index) => {
        if (_value) {
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

      let resCheckGtin = await Promise.all(promiseCheckExistGtin.map(__ => __.query));
      console.log({ resCheckGtin })
      let objvariantGtinBoolean = {}
      resCheckGtin.forEach((_value, index) => {
        if (_value) {
          objvariantGtinBoolean = {
            ...objvariantGtinBoolean,
            [promiseCheckExistGtin[index].key]: true
          }
        }
      });
      promiseCheckExistGtinLocal.forEach((_value, index) => {
        if (_value) {
          objvariantGtinBoolean = {
            ...objvariantGtinBoolean,
            [variants[index].code]: true
          }
        }
      });
      if (Object.keys(objvariantGtinBoolean).length > 0) {
        setFieldValue(`variant-gtin_boolean`, objvariantGtinBoolean)
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
    let custom_attributes = (values['is_has_sell_info'] ? attributesSelected : []).filter(_att => !_att.isInactive).filter(_attribute => _attribute.isCustom).map((_attribute, index) => {
      return {
        name: _attribute.name,
        display_name: _attribute.display_name,
        options: (_attribute.values || []).map(_value => _value.v),
        ref_index: _attribute.ref_index || String(_attribute.id),
        position: index
      }
    })
    let custom_attributes_delete = (newProductCreated.sme_catalog_product_attributes_custom || []).filter(_attribute => {
      return !custom_attributes.some(_att => _attribute.ref_index == _att.ref_index)
    }).map(_attribute => _attribute.id);
    //
    let logistics = newProductCreated.sme_catalog_product_ship_package_infos[0];
    //
    let product_assets_delete = (newProductCreated.sme_catalog_product_assets || []).filter(_assets => {
      return !productFiles.some(_file => _file.id == _assets.asset_id) && !productVideFiles.some(_file => _file.id == _assets.asset_id) && !Object.values(productAttributeFiles).some(_file => _file.id == _assets.asset_id)
    })

    let product_images = productFiles.map((_file, index) => ({ id: _file.sme_id, asset_id: _file.id, url: _file.source, positionShow: index }));
    let product_videos = productVideFiles.map((_file, index) => ({ id: _file.sme_id, asset_id: _file.id, url: _file.source, positionShow: index }));

    newvariants = [...newvariants, ...newVariantsUnit];

    let variants_update = newvariants.filter(_variant => !!_variant.id).map((_variant) => _.omit(_variant, 'warehouses'));
    let variants_add = newvariants.filter(_variant => !_variant.id).map((_variant) => ({ ..._variant }))
    let variants_delete = _.difference((newProductCreated.sme_catalog_product_variants || []).map(_var => _var.id), variants_update.map(_var => _var.id));

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


    let productBody = {
      id: newProductCreated.id,
      info: {
        name: values.name,
        description: values.description,
        is_lot: !!values['is_lot'],
        serial_type: values['serial_type'] || null,
        is_expired_date: !!values['is_expired_date'],
        catalog_category_id: values['catalog_category_id'] || null,
        brand_name: values.brand_name,
        name_seo: values.seoName,
        description_html: values.description_html,
        video_url: values.video_url,
        description_short: values.description_short,
        sku: values.sku,
        stockOnHand: totalStockOnHand,
        price: values.price || null,
        description_extend: JSON.stringify(description_extend),
        expired_warning_days: !!values[`is_expired_date`] ? +values['expireTime'] || 0 : 0,
        expired_stop_sale_days: !!values[`is_expired_date`] ? +values['stopSellingTime'] || 0 : 0, 
        outbound_method: !!values[`is_expired_date`] ? `${values['outboundType']}` || 'FIFO' : 'FIFO'
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
      tier_variations,
      tier_variations_delete: tier_variations_delete.length > 0 ? tier_variations_delete : [],
      custom_attributes,
      // warranties,
      custom_attributes_delete: custom_attributes_delete.length > 0 ? custom_attributes_delete : [],
      variants_delete
    }

    // return;

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
      await setFieldValue(`__changed__`, false)
      if (!!syncOption) {
        let res = await syncUp({
          variables: {
            sme_product_id: newProductCreated.id,
            merge_flags: syncOption
          }
        })
      }
      history.push('/products/list')
      setIsUnit(false)
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
    <div className="col-10">
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
          <ProductBasicInfo isEdit={true} isSyncVietful={isSyncVietful}/>
        </Element>
        {values?.is_expired_date &&<Element id="productExpireInfo">
          <ProductExpireInfo isEdit={true} isSyncVietful={isSyncVietful}/>
        </Element>}
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
        <Element id='productSellInfo'  >
          <ProductSellInfo isCreating={false} refetch={refetch} isSyncVietful={isSyncVietful} syncedVariants={syncedVariants}/>
        </Element>
        {!values?.is_has_sell_info && <Element id='productInventory'>
          <ProductInventory isCreating={false} isSyncVietful={isSyncVietful} syncedVariants={syncedVariants}/>
        </Element>}
        <div className='d-flex justify-content-end' >
          <button className="btn btn-secondary mr-2" style={{ width: 150 }} onClick={e => {
            e.preventDefault()
            history.push('/products/list')
          }} >{formatMessage({ defaultMessage: 'Hủy bỏ' })}</button>
          <AuthorizationWrapper keys={['product_edit']}>
            <button className="btn btn-primary" style={{ width: 150 }} type="submit" onClick={async (e) => {
              e.preventDefault();

              setFieldValue('__changed__', false)

              let error = await validateForm(values);
              console.log('error', error, Object.values(error).length)
              if (Object.keys(error)?.some(_err => _err.startsWith('variant-'))) {
                handleSubmit()
                setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
                return;
              }
              if (
                values?.is_has_sell_info
                && Object.keys(error)?.some(_err => _err.startsWith('origin_sku'))
              ) {
                delete error['origin_sku'];
              }

              if (values?.is_has_sell_info || values['switch-unit']) {
                Object.keys(error).forEach(_key => {
                  let existVariant = _key.startsWith('variant')
                  if (existVariant) delete error[_key];
                  return;
                })
              }

              if (!values?.is_has_sell_info) {
                Object.keys(error).forEach(_key => {
                  let existVariant = _key.startsWith('variant') || _key.startsWith('att') ;
                  if (existVariant) delete error[_key];
                  return;
                })
              }

              const existErrBlockDescription = Object.keys(error)?.some(_err => _err.startsWith('description'));
              if (existErrBlockDescription) onShowBlockDescription();

              console.log('error', JSON.stringify(error), Object.values(error).length, isProductFileInValid)
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
              if (!!values?.is_has_sell_info) {
                if (attributesSelected?.length == 0) {
                  setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng thêm nhóm phân loại' }));
                  return;
                }

                let checkNullVariant = attributesSelected?.length > 0
                  && attributesSelected?.some(_attr => !_attr?.values || _attr?.values?.length == 0 || _attr?.values?.every(_value => !_value?.v));

                if (checkNullVariant) {
                  setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập ít nhất 1 giá trị phân loại' }));
                  return;
                }

                if (attributesSelected.length > 0 && attributesSelected[0].values.some(_value => !!productAttributeFiles[_value.code] && productAttributeFiles[_value.code].files.length != 0)) {
                  let filterError = attributesSelected[0].values.filter(_value => !productAttributeFiles[_value.code] || productAttributeFiles[_value.code].files.length == 0).map(____ => ____.v)
                  if (filterError.length > 0) {
                    setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đủ hình ảnh của từng giá trị phân loại hoặc để trống toàn bộ hình ảnh của các giá trị phân loại trong nhóm {name}' }, { name: attributesSelected[0].display_name }))
                    return
                  }
                }
              }

              setErrorMessage(false)

              if (!!newProductCreated) {
                if (!newProductCreated?.scProductMapping || newProductCreated?.scProductMapping?.length == 0) {
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
    <div className="col-2">
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
            <Link to='productSellInfo' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-80} duration={500}>
              <h6 style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Phân loại sản phẩm' })}</h6>
            </Link>
            {!values?.is_has_sell_info && <Link to='productInventory' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-180} duration={500}>
              <h6 style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Thông tin kho' })}</h6>
            </Link>}
          </div>
        </CardBody>
      </Card>
    </div>
    <LoadingDialog show={loading || loadingCreate || loadingSyncup} />
    <ChooseOptionSync
      show={showConfirm}
      productMapping={newProductCreated?.scProductMapping || []}
      onHide={() => setShowConfirm(false)}
      onChoosed={(syncOption) => {
        updateProduct(_refValueUpdate.current, syncOption)
      }}
    />
  </div>
}
