/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import { Form, useFormikContext } from "formik";
import React, { useState, useMemo, useCallback, useRef } from "react";
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
import { useMutation, useQuery } from "@apollo/client";
import { convertToRaw } from 'draft-js';
import productCreate from '../../../../graphql/mutate_productCreate'
import ProductStep from "../product-step";
import _ from 'lodash'
import { calcKLLogistic, randomString } from "../../../../utils";
import ChooseStoreDialog from './ChooseStoreDialog'
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import ProductInventory from "../product-inventory";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
import ProductExpireInfo from "../product-expire-info";

const Sticky = require('sticky-js');


export function ProductNewInfo({
  history,
  setStep,
  formikProps,
}) {
  const {
    handleSubmit,
    values,
    validateForm,
    setFieldValue,
    ...rest
  } = formikProps;
  const { setFieldTouched } = useFormikContext();
  const { formatMessage } = useIntl()
  const {
    productEditSchema,
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
    variantsUnit,
    smeCatalogStores,
    productSizeChart,
    productImageOrigin,
    btnRefCollapseDescription,
    openBlockDescription,
    btnRefCollapseImage,
    openBlockImage,
    isUnit,
    setIsUnit
  } = useProductsUIContext();
  const _refCalled = useRef(false)
  const _refPayload = useRef()

  const [idProductCreated, setIdProductCreated] = useState()
  const [showChooseStore, setShowChooseStore] = useState()

  const [create, { loading }] = useMutation(productCreate, {
    refetchQueries: ['sme_catalog_product', 'sme_catalog_product_tags'],
    awaitRefetchQueries: true
  })
  const [errorMessage, setErrorMessage] = useState("");
  console.log('values', values)
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

    //
    let tier_variations = [];
    (values?.is_has_sell_info ? attributesSelected : []).filter(_att => !_att.isInactive).forEach(_attribute => {
      (_attribute.values || []).forEach((_value, index) => {

        let attributeFiles = productAttributeFiles[_value.code] || { files: [] }

        tier_variations.push({
          attribute_id: String(_attribute.id),
          attribute_value: _value.v,
          isCustom: _attribute.isCustom || false,
          ref_index: _value.code,
          attribute_assets: (attributeFiles.files || []).map((_file, index) => ({ asset_id: _file.id, url: _file.source, positionShow: index })),
          position: index
        })
      })
    })

    let promiseCheckExistSku = [];
    let promiseCheckExistSkuLocal = [];
    let promiseCheckExistGtin = [];
    let promiseCheckExistGtinLocal = [];
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
    });

    let newVariantsUnit = summaryVariantsUnit?.map((unit, index) => {
      const variantSame = unit?.isGroupAll
        ? variants?.find(variant => variant?.code == values[`attribute-unit-${unit?.id}-${unit?.code}`]?.value)
        : variants?.find(variant => variant?.code == values[`attribute-unit-${unit?.id}`]?.value);

      const totalStockOnHandVariant = smeCatalogStores?.reduce(
        (result, store) => {
          result += values[`variant-${variantSame?.code}-${store?.value}-stockOnHand`] || 0;
          return result;
        }, 0
      );
      const description_unit = !!values[`main-unit`] && !!values[`name-unit-${unit?.id}`] && !!values[`ratio-unit-${unit?.id}`]
        ? formatMessage({ defaultMessage: '1 {nameUnit} = {ratioUnit} {mainUnit}' }, {
          mainUnit: values[`main-unit`],
          nameUnit: values[`name-unit-${unit?.id}`],
          ratioUnit: values[`ratio-unit-${unit?.id}`]
        })
        : null;

      return {
        attributes: variantSame?.attributes || [],
        price: !!variantSame ? values[`variant-${unit?.id}-${variantSame?.code}-price`] || null : values[`variant-${unit?.id}-price`] || null,
        // costPrice: !!variantSame ? values[`variant-${unit?.id}-${variantSame?.code}-costPrice`] || null : values[`variant-${unit?.id}-costPrice`] || null,
        priceMinimum: !!variantSame ? values[`variant-${unit?.id}-${variantSame?.code}-priceMinimum`] || null : values[`variant-${unit?.id}-priceMinimum`] || null,
        // vatRate: !!variantSame ? values[`variant-${unit?.id}-${variantSame?.code}-vatRate`] || null : values[`variant-${unit?.id}-vatRate`] || null,
        gtin: !!variantSame ? (values[`variant-${unit?.id}-${variantSame?.code}-gtin`] || values[`unit_variant-${unit?.id}-${variantSame?.code}-sku`] || '') : (values[`variant-${unit?.id}-gtin`] || values[`unit_variant-${unit?.id}-sku`] || ''),
        stockOnHand: totalStockOnHandVariant,
        stockWarning: typeof values.stockWarning == 'number' ? values.stockWarning : null,
        sku: !!variantSame ? values[`unit_variant-${unit?.id}-${variantSame?.code}-sku`] : values[`unit_variant-${unit?.id}-sku`],
        position: index,
        visible: true,
        name: variantSame?.name,
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


    let newvariants = (values?.is_has_sell_info ? variants : []).map((_variant, index) => {

      promiseCheckExistSku.push(queryCheckExistSku(null, values[`variant-${_variant.code}-sku`] || ''))
      promiseCheckExistSkuLocal.push(variants.some((_vv) => _vv.code != _variant.code && values[`variant-${_vv.code}-sku`] == values[`variant-${_variant.code}-sku`]))
      promiseCheckExistGtin.push(queryCheckExistGtin(null, values[`variant-${_variant.code}-gtin`] || ''))
      promiseCheckExistGtinLocal.push(variants.some((_vv) => !!values[`variant-${_variant.code}-gtin`] && _vv.code != _variant.code && values[`variant-${_vv.code}-gtin`] == values[`variant-${_variant.code}-gtin`]))
      // totalStockOnHandVariant += (values[`variant-${_variant.code}-stockOnHand`] || 0);
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
        gtin: values[`variant-${_variant.code}-gtin`] || values[`variant-${_variant.code}-sku`] || '',
        // vatRate: values[`variant-${_variant.code}-vatRate`] || null,
        stockOnHand: totalStockOnHandVariant,
        stockWarning: typeof values.stockWarning == 'number' ? values.stockWarning : null,
        sku: values[`variant-${_variant.code}-sku`],
        position: index,
        visible: true,
        name: _variant.name,
        unitInfo: {
          description: "1",
          isMain: 1,
          name: !values[`switch-unit`] ? (values[`variant-${_variant.code}-unit`] || '') : (values['main-unit'] || ''),
          ratio: 1,
          ratio_type: 1
        },
        warehouses: smeCatalogStores?.map(store => ({
          stockOnHand: values[`variant-${_variant.code}-${store?.value}-stockOnHand`] || 0,
          warehouse_id: store?.value
        }))
      }
    });


    if (newvariants.length == 0) {
      newvariants.push({
        attributes: [],
        price: values.price || null,
        // costPrice: values.costPrice || null,
        priceMinimum: values.priceMinimum || null,
        gtin: values.gtin || values.origin_sku || '',
        stockWarning: typeof values.stockWarning == 'number' ? values.stockWarning : null,
        // vatRate: typeof values.vatRate == 'number' ? values.vatRate : null,
        stockOnHand: totalStockOnHand,
        sku: values.origin_sku,
        position: 0,
        visible: true,
        name: values.name,
        unitInfo: {
          description: "1",
          isMain: 1,
          name: !values[`switch-unit`] ? (values[`unit`] || '') : (values['main-unit'] || ''),
          ratio: 1,
          ratio_type: 1
        },
        warehouses: smeCatalogStores?.map(store => ({
          stockOnHand: values[`${store?.value}-stockOnHand`] || 0,
          warehouse_id: store?.value
        }))
      })

      let resCheckGtin = await queryCheckExistGtin(null, values['gtin']);
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

      let resCheckGtin = await Promise.all(promiseCheckExistGtin);
      let objvariantGtinBoolean = {}
      resCheckGtin.forEach((_value, index) => {
        if (_value || promiseCheckExistGtinLocal[index]) {
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
    }
    //
    let custom_attributes = (values?.is_has_sell_info ? attributesSelected : []).filter(_att => !_att.isInactive).filter(_attribute => _attribute.isCustom).map((_attribute, index) => {
      return {
        name: _attribute.name,
        display_name: _attribute.display_name,
        options: (_attribute.values || []).map(_value => _value.v),
        ref_index: String(_attribute.id),
        position: index
      }
    })

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
        name_seo: values.seoName,
        is_lot: !!values['is_lot'],
        serial_type: values['serial_type'] || null,
        is_expired_date: !!values['is_expired_date'],
        catalog_category_id: values['catalog_category_id'] || null,
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
        size_height: values.height,
        size_length: values.length,
        size_width: values.width,
        weight: values.weight,
      },
      store_id: smeCatalogStores[0]?.value,
      product_images: productFiles.map((_file, index) => ({ asset_id: _file.id, url: _file.source, positionShow: index })),
      product_videos: productVideFiles.map((_file, index) => ({ asset_id: _file.id, url: _file.source, positionShow: index })),
      variants: newvariants?.concat(newVariantsUnit),
      tags,
      tier_variations,
      custom_attributes,
      product_size_chart: !!productSizeChart && !!productSizeChart.id ? { asset_id: productSizeChart.id, url: productSizeChart.source, positionShow: 0 } : null,
      product_image_origin: !!productImageOrigin && !!productImageOrigin.id ? { asset_id: productImageOrigin.id, url: productImageOrigin.source, positionShow: 0 } : null
    }

    setFieldValue(`__changed__`, false);

    let { data, errors } = await create({
      variables: {
        productInput: productBody
      }
    })

    if (!!data) {
      if (isSave) {
        setIdProductCreated(data?.productCreate.product_id)
        history.push({
          pathname: '/product-stores/new',
          state: {
            channel: channel,
            idProductCreated: data?.productCreate.product_id
          }
        })
      } else {
        history.push('/products/list')
      }
      setIsUnit(false)
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
          <ProductBasicInfo />
        </Element>
        {values?.is_expired_date &&<Element id="productExpireInfo">
          <ProductExpireInfo />
        </Element>}
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
        <Element id='productSellInfo'>
          <ProductSellInfo isCreating={true} />
        </Element>
        {!values?.is_has_sell_info && <Element id='productInventory'>
          <ProductInventory />
        </Element>}
        <div className='d-flex justify-content-end' >
          <button className="btn btn-secondary mr-2" style={{ width: 150 }} onClick={e => {
            e.preventDefault()
            history.push('/products/list')
          }} >{formatMessage({ defaultMessage: 'Hủy bỏ' })}</button>
          <button className="btn btn-secondary mr-2" style={{ width: 150 }} type="submit" onClick={async (e) => {
            e.preventDefault();
            console.log('value post', values)
            let error = await validateForm(values)

            console.log('==============error===============', Object.keys(error))

            if (Object.keys(error)?.some(_err => _err.startsWith('ratio-unit') || _err.startsWith('name-unit') || _err.startsWith('variant-'))) {
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
            if (!values?.is_has_sell_info || !values['switch-unit']) {
              Object.keys(error).forEach(_key => {
                let existVariant = _key.startsWith('variant') ||
                  _key.startsWith('att') ||
                  _key.startsWith('name-unit') ||
                  _key.startsWith('ratio-unit')
                if (existVariant) delete error[_key];
                return;
              })
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
                    setErrorMessage(formatMessage({ defaultMessage: `Vui lòng nhập đủ hình ảnh của từng giá trị phân loại hoặc để trống toàn bộ hình ảnh của các giá trị phân loại trong nhóm name` }, { name: attributesSelected[0].display_name }))
                    return
                  }
                }
              }

            }
            setErrorMessage(false)
            if (_refCalled.current) {
              return
            }
            _refCalled.current = true
            createProduct(values, false, rest)
            _refCalled.current = false

          }}>
            {formatMessage({ defaultMessage: 'Lưu lại' })}
          </button>

          <AuthorizationWrapper keys={['product_create_store_product']}>
            <button className="btn btn-primary" type="submit" onClick={async (e) => {
              e.preventDefault();
              let error = await validateForm(values);

              if (
                values?.is_has_sell_info
                && Object.keys(error)?.some(_err => _err.startsWith('origin_sku'))
              ) {
                delete error['origin_sku'];
              }

              if (!values?.is_has_sell_info) {
                Object.keys(error).forEach(_key => {
                  let existVariant = _key.startsWith('variant') || _key.startsWith('att');
                  if (existVariant) delete error[_key];
                  return;
                })
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
                      setErrorMessage(formatMessage({ defaultMessage: `Vui lòng nhập đủ hình ảnh của từng giá trị phân loại hoặc để trống toàn bộ hình ảnh của các giá trị phân loại trong nhóm {name}` }, { name: attributesSelected[0].display_name }))
                      return
                    }
                  }
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
    <div className="col-2">
      <Card className="sticky" data-sticky="true" data-margin-top="80" >
        <CardBody>
          <h6 className="row mb-4" style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Thông tin sản phẩm' })}</h6>
          <div className="ml-8">
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
          <h6 className="row mb-4" style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Thông tin hàng hóa' })}</h6>
          <div className="ml-8">
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
