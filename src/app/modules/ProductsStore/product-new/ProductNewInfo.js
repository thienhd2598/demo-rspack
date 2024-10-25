/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import { Form } from "formik";
import React, { useState, useMemo, useCallback } from "react";
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import ProductBasicInfo from "../product-basic-info";
import ProductSellInfo from "../product-sell-info";
import { useProductsUIContext } from "../ProductsUIContext";
import ProductImages from "../product-images";
import ProductDescription from "../product-description";
import ProductShipping from "../product-shipping";
import { useIntl } from "react-intl";
import { Element, Link, animateScroll } from 'react-scroll';
import { queryCheckExistSku, validatePriceVariant } from "../ProductsUIHelpers";
import LoadingDialog from "./LoadingDialog";
import { useMutation } from "@apollo/client";

import productCreate from '../../../../graphql/mutate_scProductCreate'
import ProductStep from "../product-step";
import mutate_productUpdate from "../../../../graphql/mutate_productUpdate";
import _ from 'lodash'
import { calcKLLogistic, processDescriptionTiktok } from "../../../../utils";
import { ATTRIBUTE_VALUE_TYPE } from "../ProductsUIHelpers";
import { useSelector } from "react-redux";
import mutate_scProductSyncUpOnly from "../../../../graphql/mutate_scProductSyncUpOnly";
import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';

import dayjs from 'dayjs'
import { OverlayTrigger, Tooltip } from "react-bootstrap";
const Sticky = require('sticky-js');


export function ProductNewInfo({
  history,
  setStep,
  formikProps,
  setIdProductCreated,
}) {
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
    setCurrentProduct,
    currentProduct,
    smeProduct,
    categorySelected,
    currentChannel,
    properties,
    logisticChannels,
    productSizeChart,
    productImageOrigin,
    special_type,
    scWarehouses,
    optionsProductTag,
    btnRefCollapseDescription,
    openBlockDescription,
    btnRefCollapseImage,
    openBlockImage
  } = useProductsUIContext();

  const user = useSelector((state) => state.auth.user);

  const [create, { loading }] = useMutation(productCreate, {
    refetchQueries: ['sme_catalog_product', 'ScTags'],
  })

  const [syncUp, { loading: loadingSyncup }] = useMutation(mutate_scProductSyncUpOnly, {
    refetchQueries: ['ScGetSmeProducts'],
    awaitRefetchQueries: true
  })

  const [errorMessage, setErrorMessage] = useState("");

  useMemo(() => {
    if (!!errorMessage) {
      animateScroll.scrollToTop();
    }
  }, [errorMessage])
  useMemo(() => {
    requestAnimationFrame(() => {
      new Sticky('.sticky')
    })
  }, [])

  console.log({ smeProduct })

  const isProductFileInValid = productFiles.some(_file => !!_file.file) || Object.values(productAttributeFiles).some(_file => !!_file.file)

  const createProduct = async (values, isSave, form) => {
    if (((special_type == 1 && currentChannel?.connector_channel_code == 'shopee') || currentChannel?.connector_channel_code == 'tiktok') && values['description_extend_count'] < 100 && values['description_extend_img_count'] == 0) {
      setErrorMessage(formatMessage({ defaultMessage: 'Mô tả kèm hình ảnh yêu cầu tối thiểu có 1 hình ảnh hoặc 100 ký tự.' }))
      setFieldValue('description_extend_error', true)
      return
    }

    //Check so luong sp kho
    // [19/11/2022] - A Huy confirm close case check 
    // if (_.sumBy((smeProduct?.sme_catalog_product_variants || []), 'stock_on_hand') < _.sumBy(variants, __variant => values[`variant-${__variant.code}-stockOnHand`] || 0)) {
    //   setErrorMessage('Số lượng sản phẩm trên sàn đang lớn hơn số lượng sản phẩm thực tế ở kho. Bạn vui lòng kiểm tra lại.')
    //   return
    // }


    let ref_logistic_channel_id = (logisticChannels[currentChannel?.connector_channel_code] || []).filter(_logisticGroup => !!values[`channel-logistic-${_logisticGroup.ref_channel_id}`]).map(_logisticGroup => String(_logisticGroup.ref_channel_id))
    if (currentChannel?.connector_channel_code == 'shopee' && ref_logistic_channel_id.length == 0) {
      setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng kích hoạt ít nhất 1 đơn vị vận chuyển cho sản phẩm của bạn.' }))
      return
    }

    // let promiseCheckExistSku = [];

    let totalStockOnHandVariant = 0;
    let hasAttributeSmeProduct = smeProduct?.sme_catalog_product_variants?.length > 0 && smeProduct?.sme_catalog_product_variants?.[0]?.attributes.length > 0
    let isDiffAttribute = smeProduct?.sme_catalog_product_variants?.length != variants?.length
      || smeProduct?.sme_catalog_product_variants?.some(_smeVariant => !variants?.some(_variant => _variant?.name == _smeVariant?.name))

    let newvariants = (values?.is_has_sell_info ? variants : []).map((_variant, index) => {
      // promiseCheckExistSku.push(queryCheckExistSku(null, values[`variant-${_variant.code}-sku`] || ''))
      totalStockOnHandVariant += values[`variant-${_variant.code}-stockOnHand`] || 0;
      return {
        attribute_values: _variant.attributes.map(_ref => ({ variant_attribute_value_index: _ref.attribute_value_ref_index })),
        price: values[`variant-${_variant.code}-price`],
        price_minimum: values[`variant-${_variant.code}-priceMinimum`],
        ...(!currentChannel?.enable_multi_warehouse ? {
          sellable_stock: values[`variant-${_variant.code}-stockOnHand`] || 0,
        } : {}),
        sku: values[`variant-${_variant.code}-sku`] || '',
        position: index,
        name: _variant.name,
        warehouse_inventories: scWarehouses?.map(wh => ({
          stock_on_hand: values[`variant-${_variant.code}-${wh?.value}-stockOnHand`] || 0,
          warehouse_id: wh?.value
        })),
        ...(
          //fix cho lỗi https://upbasevn.atlassian.net/browse/UPBASE-4210. Mục đích là cứ tìm thấy variant bên sme tương tứng là truyền sang để link
          !!values[`variant-${_variant.code}-sme_product_variant_id`] //&& !!hasAttributeSmeProduct //&& !isDiffAttribute
            ? { sme_product_variant_id: values[`variant-${_variant.code}-sme_product_variant_id`] }
            : {}
        )
      }
    });

    //
    if (newvariants.length == 0) {
      totalStockOnHandVariant = values.stockOnHand
      newvariants.push({
        attribute_values: [],
        price: values.price,
        price_minimum: values.price_minimum,
        sku: values.origin_sku,
        position: 0,
        name: values.name,
        ...(!currentChannel?.enable_multi_warehouse ? {
          sellable_stock: values.stockOnHand,
        } : {}),
        warehouse_inventories: scWarehouses?.map(wh => ({
          stock_on_hand: values[`${wh?.value}-stockOnHand`] || 0,
          warehouse_id: wh?.value
        })),
        ...(
          !!values[`variant-noattribute-sme_product_variant_id`] && !hasAttributeSmeProduct
            ? { sme_product_variant_id: values[`variant-noattribute-sme_product_variant_id`] }
            : {}
        )
      })
    } else {
      // let resCheckSku = await Promise.all(promiseCheckExistSku);
      // let objvariantSkuBoolean = {}
      // resCheckSku.forEach((_value, index) => {
      //   if (_value) {
      //     objvariantSkuBoolean = {
      //       ...objvariantSkuBoolean,
      //       [variants[index].code]: true
      //     }
      //   }
      // });
      // if (Object.keys(objvariantSkuBoolean).length > 0) {
      //   setFieldValue(`variant-sku_boolean`, objvariantSkuBoolean)
      //   setErrorMessage('Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ')
      //   return;
      // }
    }
    let variant_attributes = (values?.is_has_sell_info ? attributesSelected : []).filter(_att => !_att.isInactive).filter(_attribute => _attribute.isCustom).map((_attribute, _index) => {
      return {
        position: _index,
        variant_attribute_index: String(_index),
        sme_variant_attribute_id: !!_attribute.sme_variant_attribute_id ? String(_attribute.sme_variant_attribute_id) : null,
        name: _attribute.display_name,
        values: (_attribute.values || []).map((_value, __index) => {
          let attributeFiles = productAttributeFiles[_value.code] || { files: [] }

          return {
            variant_attribute_value_index: String(_value.code),
            sme_variant_attribute_value_id: _value.sme_variant_attribute_value_id,
            value: _value.v,
            position: __index,
            assets_add: (attributeFiles.files || []).map((_file, index) => ({ asset_id: _file.id, url: _file.source, type: 1, position: index })),
            ...(_value?.sc_attribute_group_id ? {
              ref_attribute_group_id: _attribute?.currentGroupSelect?.ref_group_id,
              sc_attribute_group_id: _attribute?.currentGroupSelect?.id,
              sc_option_id: _value?.sc_option_id,
            } : {})
          }
        }),
        ...(!!_attribute.sc_attribute_id ? { sc_attribute_id: parseInt(_attribute.sc_attribute_id) } : { sc_attribute_id: null })
      }
    })
    //
    if (newvariants.length > 0) {
      let validVariant = validatePriceVariant(newvariants)
      if (!!validVariant) {
        setErrorMessage(formatMessage({ defaultMessage: "Khoảng giá chênh lệch giữa các phân loại không được vượt quá 5 lần" }))
        return
      } else {
        setErrorMessage(false)
      }
    }
    let product_attributes = [];
    properties.forEach(_property => {
      let _value = values[`property-${_property.id}`];
      let unit = values[`property-${_property.id}-unit`];
      if (_value != undefined && _value != null) {
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.TEXT || _property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC || _property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_FLOAT || _property.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_INT) {
          product_attributes.push({ attribute_id: _property.id, attribute_value: String(_value), unit: unit?.value || null })
        }
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT && !!_value) {
          product_attributes.push({ attribute_id: _property.id, attribute_value: String(_value.value), unit: unit?.value || null })
        }
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT_CUSTOM_VALUE && !!_value) {
          if (_value?.__isNew__) {
            product_attributes.push({
              attribute_id: _property.id,
              attribute_value: "",
              custom_attribute_values: [{ value: String(!!_value.raw_u ? _value.raw_v : _value.value), unit: _value.raw_u || null }],
              unit: _value.raw_u || null
            })
          } else {
            product_attributes.push({
              attribute_id: _property.id,
              attribute_value: !_value?.__isNew__ ? String(_value.value) : "",
              custom_attribute_values: _value?.__isNew__ ? [{ value: String(_value.value) }] : [],
              unit: unit?.value || null
            })
          }
        }
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.DATE || _property.input_type == ATTRIBUTE_VALUE_TYPE.DATE_MONTH || _property.input_type == ATTRIBUTE_VALUE_TYPE.TIMESTAMP) {
          product_attributes.push({ attribute_id: _property.id, attribute_value: String(dayjs(_value).unix()), unit: unit?.value || null })
        }
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT && !!_value && _value.length > 0) {
          product_attributes.push({ attribute_id: _property.id, attribute_value: _value.map(_v => _v.value).join(','), unit: unit?.value || null })
        }
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT_CUSTOM_VALUE && !!_value && _value.length > 0) {
          product_attributes.push({
            attribute_id: _property.id,
            attribute_value: _value.filter(_v => !_v.__isNew__).map(_v => _v.value).join(','),
            custom_attribute_values: _value.filter(_v => _v.__isNew__).map(_v => ({ value: _v.value })),
            unit: unit?.value || null
          })
        }
      }
    });


    let startPosition = 0;
    if (!!productImageOrigin?.merged_image_url) {
      startPosition = 1
    }

    let product_images = productFiles.map((_file, index) => ({
      asset_id: _file.id, url: _file.merged_image_url || _file.source,
      origin_image_url: _file.source, template_image_url: _file.template_image_url,
      type: 1, position: startPosition + index
    }));
    let product_videos = productVideFiles.map((_file, index) => ({ asset_id: _file.id, url: _file.source, type: 2, position: index }));


    if (!!productSizeChart && !!productSizeChart.id && (!!categorySelected?.support_size_chart || (currentChannel?.connector_channel_code === 'tiktok' && categorySelected?.size_chart_required)) && (currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok')) {
      product_images.push({
        asset_id: productSizeChart.id, url: productSizeChart.merged_image_url || productSizeChart.source,
        origin_image_url: productSizeChart.source, template_image_url: productSizeChart.template_image_url,
        type: 3, position: product_images.length + startPosition
      })
    }

    if (!!productImageOrigin && !!productImageOrigin.id) {
      product_images.push({
        asset_id: productImageOrigin.id, url: productImageOrigin.merged_image_url || productImageOrigin.source,
        origin_image_url: productImageOrigin.source, template_image_url: productImageOrigin.template_image_url,
        type: 4, position: !!productImageOrigin.merged_image_url ? 0 : product_images.length
      })
    }


    let description_extend = []
    try {
      if (currentChannel?.connector_channel_code == 'shopee') {
        let rawDes = convertToRaw(values.description_extend.getCurrentContent());
        rawDes.blocks.forEach(__ => {
          if (__.entityRanges.length > 0) {
            description_extend.push({
              field_type: 'image',
              text: __.text,
              image_info: {
                sme_url: rawDes.entityMap[__.entityRanges[0]?.key]?.data?.src
              }
            })
          } else {
            let last = description_extend[description_extend.length - 1]
            if (!!last && last.field_type == 'text') {
              last.text = `${last.text}\n${__.text}`
            } else {
              description_extend.push({
                field_type: 'text',
                text: __.text
              })
            }
          }
        })
      }
    } catch (error) {
      description_extend.push({
        field_type: 'text',
        text: values.description || ""
      })
    }

    let tags = values?.product_tags?.map(
      (_tag) => {
        let { value, label } = _tag;
        if (_tag?.__isNew__) {
          return {
            tag_name: label,
          }
        }
        return {
          id: value,
          tag_name: label,
        }
      }
    ) || [];

    let productBody = {
      info: {
        description_extend,
        name: values.name,
        description: values.description || null,
        brand_id: parseInt(values.brand.value),
        category_id: categorySelected.id,
        description_html: currentChannel?.connector_channel_code == 'tiktok' ? await processDescriptionTiktok(values.description_html) : values.description_html,
        short_description: values.description_short,
        sku: values.sku,
        stock_on_hand: totalStockOnHandVariant,
        price: values.price || null,
        price_minimum: values.price_minimum || null,
        ...(values.type_video === 'url' || currentChannel?.connector_channel_code != 'lazada' ? {
          video: values.video_url || "",
        } : {
          video: "",
        }),
        special_type,
        is_cod_open: values.is_cod_open ? 1 : 0,
      },
      tags,
      is_valid_logistic: 1,
      logistics: {
        package_height: (currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok') ? Math.round(values.height) : values.height,
        package_length: (currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok') ? Math.round(values.length) : values.length,
        package_width: (currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok') ? Math.round(values.width) : values.width,
        package_weight: (currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok') ? Math.round(values.weight) : values.weight,
      },
      product_images: product_images.length > 0 ? product_images : null,
      ...(values.type_video === 'video' || currentChannel?.connector_channel_code != 'lazada' ? {
        product_videos: product_videos?.length > 0 ? product_videos : null,
      } : {
        product_videos: null
      }),
      sme_product_id: smeProduct?.id,
      store_id: currentChannel.value,
      variants: newvariants,
      variant_attributes: variant_attributes.length > 0 && values?.is_has_sell_info ? variant_attributes : null,
      product_attributes: product_attributes.length > 0 ? product_attributes : null,
      ref_logistic_channel_id
    }

    console.log({ productBody });
    setFieldValue(`__changed__`, false)

    let { data, errors } = await create({
      variables: {
        sc_product_data: productBody
      }
    })

    if (!!data) {

      if (!data?.scCreateProduct?.success) {
        setErrorMessage(data?.scCreateProduct?.message)
        return
      }
      if (isSave) {
        let res = await syncUp({
          variables: {
            products: [data.scCreateProduct.product_id]
          }
        })
        if (!!res?.errors) {
          setErrorMessage(errors[0].message)
          setFieldValue(`__changed__`, true)
          return
        }
        history.push(`/product-stores/list?channel=${currentChannel?.connector_channel_code}`)
      } else {
        history.push(`/product-stores/draf?channel=${currentChannel?.connector_channel_code}`)
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
      <p className="mb-4 d-flex mb-1" ><span >{formatMessage({ defaultMessage: 'Gian hàng' })}</span>: <img style={{ width: 20, height: 20, marginLeft: 8 }} src={currentChannel?.logo} className="mr-2" /><span >{currentChannel?.label}</span></p>
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
        <Element id='productAssets'  >
          <ProductImages />
        </Element>
        <Element id='productDescription'  >
          <ProductDescription />
        </Element>
        <Element id='productShipping'  >
          <ProductShipping isEdit={true} />
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
          <ProductSellInfo isCreating={true} />
        </Element>
        <div className='d-flex justify-content-end' >
          <button className="btn btn-secondary mr-2" style={{ width: 150 }} onClick={e => {
            e.preventDefault()
            history.push('/product-stores/list')
          }} >
            {formatMessage({ defaultMessage: 'Hủy bỏ' })}
          </button>
          <button className="btn btn-secondary mr-2" style={{ width: 150 }} type="submit" onClick={async (e) => {
            e.preventDefault();
            
            let arrskus = _.groupBy(variants.map(_variant => ({ code: _variant.code, sku: values[`variant-${_variant.code}-sku`] })), 'sku');
            let skuErrors = {};
            Object.values(arrskus).filter(_ar => _ar.length > 1).forEach(_var => {
              _var.forEach(_item => {
                skuErrors[_item.code] = true
              });
            });
            if (Object.keys(skuErrors).length > 0) {
              setFieldValue(`variant-sku_boolean`, skuErrors)
              setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
              let error = await validateForm(values)
              handleSubmit()
              return;
            }

            let error = await validateForm(values)

            if (values?.is_has_sell_info) {
              Object.keys(error).forEach(_key => {
                let existVariant = _key.startsWith('origin_sku') || _key.startsWith('stockOnHand') || _key.startsWith('price') || _key.startsWith('price_minimum');
                if (existVariant) delete error[_key];
                return;
              })
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

            console.log('error', error)
            if (Object.values(error).length != 0) {
              handleSubmit()
              setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
              return;
            } else {
              if (isProductFileInValid || (values?.is_has_sell_info && attributesSelected.length > 0 && attributesSelected[0].values.some(_value => !!productAttributeFiles[_value.code] && productAttributeFiles[_value.code].files.length != 0 && productAttributeFiles[_value.code].files.some(_file => _file.hasError || _file.isUploading)))) {
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

              if (productFiles.some(__ => !!__.isUploading) || productVideFiles.some(__ => !!__.isUploading) || !!productSizeChart?.isUploading || !!productImageOrigin?.isUploading) {
                onShowBlockImage();
                setErrorMessage(formatMessage({ defaultMessage: 'Hình ảnh/Video đang tải lên. Xin vui lòng thử lại sau.' }));
                return
              }

              if (currentChannel?.connector_channel_code === 'tiktok' && categorySelected?.size_chart_required && !productSizeChart) {
                onShowBlockImage();
                setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập bảng quy đổi kích cỡ' }));
                setFieldValue('size-chart-required', true)
                return;
              }

              // if (!productSizeChart && currentChannel?.connector_channel_code == 'shopee' && !!categorySelected?.support_size_chart) {
              //   setErrorMessage('Bảng quy đổi kích cỡ không được để trống')
              //   return
              // }

              // if (!values?.is_has_sell_info && currentChannel?.connector_channel_code === 'tiktok') {
              //   setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập ít nhất 1 nhóm phân loại' }));
              //   return;
              // }

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
                // if (currentChannel?.connector_channel_code == 'tiktok' && attributesSelected?.length === 0) {
                //   setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập ít nhất 1 nhóm phân loại' }));
                //   return;
                // }

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
            createProduct(values, false, rest)
          }}>
            {formatMessage({ defaultMessage: 'Lưu lại' })}
          </button>
          <button className="btn btn-primary" type="submit" onClick={async (e) => {
            e.preventDefault();

            let arrskus = _.groupBy(variants.map(_variant => ({ code: _variant.code, sku: values[`variant-${_variant.code}-sku`] })), 'sku');
            let skuErrors = {};
            Object.values(arrskus).filter(_ar => _ar.length > 1).forEach(_var => {
              _var.forEach(_item => {
                skuErrors[_item.code] = true
              });
            });
            if (Object.keys(skuErrors).length > 0) {
              setFieldValue(`variant-sku_boolean`, skuErrors)
              setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
              let error = await validateForm(values)
              handleSubmit()
              return;
            }

            let error = await validateForm(values)

            if (values?.is_has_sell_info) {
              Object.keys(error).forEach(_key => {
                let existVariant = _key.startsWith('origin_sku') || _key.startsWith('stockOnHand') || _key.startsWith('price') || _key.startsWith('price_minimum');
                if (existVariant) delete error[_key];
                return;
              })
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

              if (productFiles.some(__ => !!__.isUploading) || productVideFiles.some(__ => !!__.isUploading) || !!productSizeChart?.isUploading || !!productImageOrigin?.isUploading) {
                onShowBlockImage();
                setErrorMessage(formatMessage({ defaultMessage: 'Hình ảnh/Video đang tải lên. Xin vui lòng thử lại sau.' }));
                return
              }

              if (currentChannel?.connector_channel_code === 'tiktok' && categorySelected?.size_chart_required && !productSizeChart) {
                onShowBlockImage();
                setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập bảng quy đổi kích cỡ' }));
                setFieldValue('size-chart-required', true)
                return;
              }
              // if (!values?.is_has_sell_info && currentChannel?.connector_channel_code === 'tiktok') {
              //   setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập ít nhất 1 nhóm phân loại' }));
              //   return;
              // }

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
                // if (currentChannel?.connector_channel_code == 'tiktok' && attributesSelected?.length === 0) {
                //   setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập ít nhất 1 nhóm phân loại' }));
                //   return;
                // }

                if (attributesSelected?.length > 0 && attributesSelected[0]?.values?.some(_value => !!productAttributeFiles[_value.code] && productAttributeFiles[_value.code].files.length != 0)) {
                  let filterError = attributesSelected[0]?.values.filter(_value => !productAttributeFiles[_value.code] || productAttributeFiles[_value.code]?.files?.length == 0).map(____ => ____.v)
                  if (filterError.length > 0) {
                    setErrorMessage(formatMessage({ defaultMessage: `Vui lòng nhập đủ hình ảnh của từng giá trị phân loại hoặc để trống toàn bộ hình ảnh của các giá trị phân loại trong nhóm {name}` }, { name: attributesSelected[0].display_name }))
                    return
                  }
                }
              }

            }
            setErrorMessage(false)
            createProduct(values, true, rest)
          }} >
            {formatMessage({ defaultMessage: 'Lưu và đăng bán' })}
          </button>
        </div>
      </Form>
    </div>
    <div className="col-3">
      <Card className="sticky" data-sticky="true" data-margin-top="80" >
        <CardBody>
          <h6 className="row mb-4" style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Thông tin sản phẩm' })}</h6>
          <div className="ml-8">
            <Link to='productInfo' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-180} duration={500}>
              <h6 style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Thông tin cơ bản' })}</h6>
            </Link>
            <Link to='productAssets' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-150} duration={500}>
              <h6 style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Hình ảnh & video' })}</h6>
            </Link>
            <Link to='productDescription' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-120} duration={500}>
              <h6 style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Mô tả sản phẩm' })}</h6>
            </Link>
            <Link to='productShipping' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-80} duration={500}>
              <h6 style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Vận chuyển' })}</h6>
            </Link>
          </div>
          <h6 className="row mb-4" style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Thông tin hàng hóa' })}</h6>
          <div className="ml-8">
            <Link to='productSellInfo' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-180} duration={500}>
              <h6 style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Phân loại sản phẩm' })}</h6>
            </Link>
            {!!values['is_has_sell_info'] && variants.length > 0 && <Link to='productSellInfoVariants' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-100} duration={500}>
              <h6 style={{ fontWeight: 'unset' }} >{formatMessage({ defaultMessage: 'Sản phẩm phân loại' })}</h6>
            </Link>}
          </div>
        </CardBody>
      </Card>
    </div>
    <LoadingDialog show={loading || loadingSyncup} />
  </div>
}
