/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import { Form } from "formik";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import ProductBasicInfo from "../product-basic-info";
import ProductSellInfo from "../product-sell-info";
import { useProductsUIContext } from "../ProductsUIContext";
import ProductImages from "../product-images";
import ProductDescription from "../product-description";
import ProductShipping from "../product-shipping";
import { ProductSellVariants } from '../product-sell-info';
import { useIntl } from "react-intl";
import { Element, Link, animateScroll } from 'react-scroll';
import { ATTRIBUTE_VALUE_TYPE, queryCheckExistSku, validatePriceVariant } from "../ProductsUIHelpers";
import LoadingDialog from "./LoadingDialog";
import { useMutation } from "@apollo/client";
import productCreate from '../../../../graphql/mutate_productCreate'
import ProductStep from "../product-step";
import mutate_productUpdate from "../../../../graphql/mutate_productUpdate";
import _ from 'lodash'
import { calcKLLogistic, processDescriptionTiktok } from "../../../../utils";
import dayjs from "dayjs";
import mutate_scUpdateProduct from "../../../../graphql/mutate_scUpdateProduct";
import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";

const Sticky = require('sticky-js');


export function ProductNewInfo({
  history,
  setStep,
  formikProps,
  disableAction,
  storeInactive
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
    scWarehouses,
    productVideFiles,
    productAttributeFiles,
    smeProduct,
    logisticChannels,
    currentChannel,
    properties,
    categorySelected,
    productEditing,
    productSizeChart,
    setProductSizeChart,
    productImageOrigin,
    special_type,
    btnRefCollapseDescription,
    openBlockDescription,
    btnRefCollapseImage,
    openBlockImage
  } = useProductsUIContext();
  const [update, { loading: loadingUpdate }] = useMutation(mutate_scUpdateProduct, {
    refetchQueries: ['ScGetSmeProducts', 'ScTags'],
    awaitRefetchQueries: true
  })
  const [errorMessage, setErrorMessage] = useState("");

  useMemo(() => {
    if (!!errorMessage) {
      animateScroll.scrollToTop();
    }
  }, [errorMessage])
  useEffect(() => {
    requestAnimationFrame(() => {
      new Sticky('.sticky')
    })
    return () => {
      setFieldValue('__changed__', false)
    }
  }, []);

  const isProductFileInValid = productFiles.some(_file => !!_file.file || _file.hasError) || Object.values(productAttributeFiles).some(_file => !!_file.file)
  const updateProduct = async (values, isSave, form) => {

    if (((special_type == 1 && currentChannel?.connector_channel_code == 'shopee') || currentChannel?.connector_channel_code == 'tiktok') && values['description_extend_count'] < 100 && values['description_extend_img_count'] == 0) {
      setErrorMessage(formatMessage({ defaultMessage: 'Mô tả kèm hình ảnh yêu cầu tối thiểu có 1 hình ảnh hoặc 100 ký tự' }))
      setFieldValue('description_extend_error', true)
      return
    }


    //Check so luong sp kho
    // [19/11/2022] - A Huy confirm close case check 
    // if (!!smeProduct?.sme_catalog_product_variants && _.sumBy((smeProduct?.sme_catalog_product_variants || []), 'stock_on_hand') < _.sumBy(variants, __variant => values[`variant-${__variant.code}-stockOnHand`] || 0)) {
    //   setErrorMessage('Số lượng sản phẩm trên sàn đang lớn hơn số lượng sản phẩm thực tế ở kho. Bạn vui lòng kiểm tra lại.')
    //   return
    // }

    let ref_logistic_channel_id = (logisticChannels[currentChannel?.connector_channel_code] || []).filter(_logisticGroup => !!values[`channel-logistic-${_logisticGroup.ref_channel_id}`]).map(_logisticGroup => String(_logisticGroup.ref_channel_id))
    let ref_logistic_disable_channel_id = (logisticChannels[currentChannel?.connector_channel_code] || []).filter(_logisticGroup => !values[`channel-logistic-${_logisticGroup.ref_channel_id}`]).map(_logisticGroup => String(_logisticGroup.ref_channel_id))
    if (currentChannel?.connector_channel_code == 'shopee' && ref_logistic_channel_id.length == 0) {
      setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng kích hoạt ít nhất 1 đơn vị vận chuyển cho sản phẩm của bạn.' }))
      return
    }

    // let promiseCheckExistSku = [];
    let hasVariantVisible = false;
    let totalStockOnHandVariant = 0;
    //  
    let newvariants = (values?.is_has_sell_info ? variants : []).map((_variant, index) => {
      if (values[`variant-${_variant.code}-visible`])
        hasVariantVisible = values[`variant-${_variant.code}-visible`]
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
        status: (currentChannel?.connector_channel_code == 'tiktok' || values[`variant-${_variant.code}-visible`]) ? 10 : 0,
        ...(!!values[`variant-${_variant.code}-lastid`] ? { id: values[`variant-${_variant.code}-lastid`] } : {})
      }
    });

    //
    if (newvariants.length == 0) {
      totalStockOnHandVariant = values.stockOnHand
      newvariants.push({
        ...(!!values[`variant-noattribute-lastid`] ? { id: values[`variant-noattribute-lastid`] } : {}),
        attribute_values: [],
        price: values.price,
        price_minimum: values.price_minimum,
        ...(!currentChannel?.enable_multi_warehouse ? {
          sellable_stock: values.stockOnHand,
        } : {}),
        sku: values.origin_sku,
        position: 0,
        status: 10,
        name: values.name,
        warehouse_inventories: scWarehouses?.map(wh => ({
          stock_on_hand: values[`${wh?.value}-stockOnHand`] || 0,
          warehouse_id: wh?.value
        })),
      })
    } else {
      if (!hasVariantVisible && currentChannel?.connector_channel_code != 'tiktok') {
        setErrorMessage(formatMessage({ defaultMessage: 'Cần chọn hiện tối thiểu 1 sku.' }))
        return;
      }
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
      //   setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ'}))
      //   return;
      // }
    }
    let variant_attributes = (values?.is_has_sell_info ? attributesSelected : []).filter(_att => !_att.isInactive).filter(_attribute => _attribute.isCustom).map((_attribute, _index) => {
      return {
        position: _index,
        variant_attribute_index: _attribute.ref_index || String(_attribute.id),
        sme_variant_attribute_id: !!_attribute.sme_variant_attribute_id ? String(_attribute.sme_variant_attribute_id) : null,
        name: _attribute.display_name,
        values: (_attribute.values || []).map((_value, __index) => {
          let lastAssets = productEditing?.variantAttributeValues?.find(_attValue => _attValue.ref_index == _value.code)
          let attributeFiles = productAttributeFiles[_value.code] || { files: [] }
          console.log('lastAssets?.scVariantValueAssets', productEditing, lastAssets?.scVariantValueAssets, attributeFiles)
          let assets_add = (attributeFiles.files || []).map((_file, index) => ({ asset_id: _file.id, url: _file.source, type: 1, position: index, ...(!!_file.scId ? { id: _file.scId } : {}) }))
          let assets_delete = lastAssets?.scVariantValueAssets?.filter(_ass => !attributeFiles?.files?.some(_file => _ass.sme_asset_id == _file.id)).map(_ass => parseInt(_ass.id))
          return {
            variant_attribute_value_index: String(_value.code),
            sme_variant_attribute_value_id: _value.sme_variant_attribute_value_id,
            value: _value.v,
            position: __index,
            assets_add: assets_add?.length > 0 ? assets_add : null,
            assets_delete: assets_delete?.length > 0 ? assets_delete : null,
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
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT) {
          product_attributes.push({ attribute_id: _property.id, attribute_value: String(_value.value), unit: unit?.value || null })
        }
        if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT_CUSTOM_VALUE) {
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
    if (!!productImageOrigin?.template_image_url) {
      startPosition = 1
    }

    let product_images = productFiles.map((_file, index) => {
      let lastFile = (productEditing?.productAssets || []).find(__ => __.sme_asset_id == _file.id)
      //check nếu không thay đổi thì ko truyền file đó lên
      if (!!lastFile && (lastFile.origin_image_url || lastFile.sme_url) == _file.source && lastFile.position == (startPosition + index) && lastFile.template_image_url == _file.template_image_url) {
        return null
      }
      return {
        asset_id: _file.id, url: _file.merged_image_url || _file.source, type: 1,
        origin_image_url: _file.source, template_image_url: _file.template_image_url,
        position: startPosition + index, ...(!!_file.scId ? { id: _file.scId } : {})
      }
    }).filter(__ => !!__);


    if (!!productSizeChart && !!productSizeChart.id && (!!categorySelected?.support_size_chart || (currentChannel?.connector_channel_code === 'tiktok' && categorySelected?.size_chart_required)) && (currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok')) {
      //check nếu không thay đổi thì ko truyền file đó lên
      let lastFile = (productEditing?.productAssets || []).find(__ => __.type == 3)
      if (!lastFile || lastFile.sme_url != productSizeChart.source || lastFile.sme_asset_id != productSizeChart.id || productFiles.length + startPosition != lastFile.position)
        product_images.push({
          asset_id: productSizeChart.id, url: productSizeChart.merged_image_url || productSizeChart.source,
          origin_image_url: productSizeChart.source, template_image_url: productSizeChart.template_image_url,
          type: 3, position: productFiles.length + startPosition,
          ...(!!productSizeChart.scId ? { id: productSizeChart.scId } : {})
        })
    }

    if (!!productImageOrigin && !!productImageOrigin.id) {
      //check nếu không thay đổi thì ko truyền file đó lên
      let lastFile = (productEditing?.productAssets || []).find(__ => __.type == 4)
      if (!lastFile || productImageOrigin?.template_image_url != lastFile?.template_image_url || (lastFile.origin_image_url || lastFile.sme_url) != productImageOrigin.source || lastFile.sme_asset_id != productImageOrigin.id || (!!productImageOrigin?.template_image_url ? 0 : productFiles.length) != lastFile.position)
        product_images.push({
          asset_id: productImageOrigin.id, url: productImageOrigin.merged_image_url || productImageOrigin.source,
          origin_image_url: productImageOrigin.source, template_image_url: productImageOrigin.template_image_url,
          type: 4, position: !!productImageOrigin?.template_image_url ? 0 : productFiles.length,
          ...(!!productImageOrigin.scId ? { id: productImageOrigin.scId } : {})
        })
    }

    let product_videos = productVideFiles.map((_file, index) => ({ asset_id: _file.id, url: _file.source, type: 2, position: index, ...(!!_file.scId ? { id: _file.scId } : {}) }));
    let product_assets_delete = productEditing?.productAssets?.
      filter(_ass => !productFiles.some(_file => _file.id == _ass.sme_asset_id)
        && !productVideFiles.some(_file => _file.id == _ass.sme_asset_id)
        && productSizeChart?.id != _ass.sme_asset_id
        && productImageOrigin?.id != _ass.sme_asset_id
      ).map(_ass => parseInt(_ass.id));
    const variant_attributes_value = variant_attributes?.reduce(
      (result, val) => {
        return [...result, ...val?.values]
      }, []
    );
    const variant_attributes_value_delete = productEditing?.variantAttributeValues
      ?.filter(_variant => !variant_attributes_value?.some(_val => _val?.variant_attribute_value_index == _variant?.ref_index))
      ?.map(_variant => _variant?.id);

    let variant_attributes_delete = (productEditing.productVariantAttributes || []).filter(_att => !variant_attributes.some(_vatt => _vatt.variant_attribute_index == _att.ref_index)).map(_att => String(_att.id))

    let product_attributes_delete = (productEditing.productAttributeValues || []).filter(_att => !product_attributes.some(_patt => _patt.attribute_id == _att.op_sc_product_attribute_id)).map(_att => parseInt(_att.id));
    let product_attributes_add = product_attributes.filter(_patt => !(productEditing.productAttributeValues || []).some(_att => _patt.attribute_id == _att.op_sc_product_attribute_id))
    let product_attributes_update = product_attributes.filter(_patt => (productEditing.productAttributeValues || []).some(_att => _patt.attribute_id == _att.op_sc_product_attribute_id))

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
      id: productEditing?.id,
      info: {
        name: values.name,
        description: values.description || '',
        brand_id: parseInt(values.brand.value),
        category_id: categorySelected.id,
        description_html: currentChannel?.connector_channel_code == 'tiktok' ? await processDescriptionTiktok(values.description_html) : values.description_html,
        short_description: values.description_short,
        sku: values.sku,
        stock_on_hand: totalStockOnHandVariant,
        price: values.price,
        price_minimum: values.price_minimum,
        ...(values.type_video === 'url' || currentChannel?.connector_channel_code != 'lazada' ? {
          video: values.video_url || "",
        } : {
          video: "",
        }),
        is_cod_open: values.is_cod_open ? 1 : 0,
        description_extend,
        ...(currentChannel.special_type == 1 ? { special_type: 1 } : {})
      },
      tags_add: tags,
      tags_delete: values.current_product_tags,
      is_valid_logistic: 1,
      logistics: {
        package_height: (currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok') ? Math.round(values.height) : values.height,
        package_length: (currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok') ? Math.round(values.length) : values.length,
        package_width: (currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok') ? Math.round(values.width) : values.width,
        package_weight: (currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok') ? Math.round(values.weight) : values.weight,
      },
      product_assets_delete: product_assets_delete?.length > 0 ? product_assets_delete : null,
      product_images_add: product_images?.length > 0 ? product_images : null,
      ...(values.type_video === 'video' || currentChannel?.connector_channel_code != 'lazada' ? {
        product_videos_add: product_videos?.length > 0 ? product_videos : null,
      } : {
        product_videos_add: null
      }),
      ref_logistic_channel_id,
      ref_logistic_disable_channel_id,
      product_attributes_delete: product_attributes_delete?.length > 0 ? product_attributes_delete : null,
      product_attributes_update: product_attributes_update?.length > 0 ? product_attributes_update : null,
      product_attributes_add: product_attributes_add?.length > 0 ? product_attributes_add : null,

      variant_attributes: variant_attributes?.length > 0 ? variant_attributes : null,
      variant_attributes_delete: variant_attributes_delete?.length > 0 ? variant_attributes_delete : null,
      variant_attribute_value_delete: variant_attributes_value_delete,
      variants_add: newvariants.filter(_variant => !_variant.id)?.map(_variant => {
        return {..._variant,

        }
      }),
      variants_update: newvariants.filter(_variant => {
        if (!_variant.id) {
          return false
        }
        let currentVariant = productEditing?.productVariants?.find(__v => __v.id == _variant.id)
        if (!currentVariant) {
          return false;
        }
        return _variant.price != currentVariant.price ||
          _variant.price_minimum != currentVariant.price_minimum ||
          _variant.sellable_stock != currentVariant.stock_on_hand ||
          _variant.sku != currentVariant.sku ||
          _.difference(
            _variant?.warehouse_inventories,
            currentVariant?.variantInventoris?.map(iv => ({ stock_on_hand: iv?.stock_on_hand, warehouse_id: iv?.sc_warehouse_id }))
          )?.length > 0 ||
          _variant.name != currentVariant.name ||
          _variant.status != currentVariant.status
      }),
      variants_delete: [...(productEditing.productVariants || []).filter(_variant => !newvariants.some(_vv => _vv.id == _variant.id)).map(_att => parseInt(_att.id))]
        .concat(!newvariants.some(_varrr => _varrr.id == values[`variant-noattribute-lastid`]) && !!values[`variant-noattribute-lastid`] ? [values[`variant-noattribute-lastid`]] : []),

    }

    console.log({ productBody, productEditing });
    // console.log(JSON.stringify(productBody))
    setFieldValue(`__changed__`, false);

    let { data, errors } = await update({
      variables: {
        sc_product_data: productBody,
        sync_status: isSave ? 1 : 0
      }
    })

    if (!!errors) {
      setErrorMessage(errors[0].message)
    } else {
      if (!data?.scUpdateProduct?.success) {
        setErrorMessage(data?.scUpdateProduct?.message)
        return
      }
      if (isSave || productEditing?.status != 2) {
        if (currentChannel?.connector_channel_code == 'shopee') {
          history.push('/product-stores/list?channel=shopee')
        }
        if (currentChannel?.connector_channel_code == 'lazada') {
          history.push('/product-stores/list?channel=lazada')
        }
        if (currentChannel?.connector_channel_code == 'tiktok') {
          history.push('/product-stores/list?channel=tiktok')
        }
      } else {
        if (currentChannel?.connector_channel_code == 'shopee') {
          history.push('/product-stores/draf?channel=shopee')
        }
        if (currentChannel?.connector_channel_code == 'lazada') {
          history.push('/product-stores/draf?channel=lazada')
        }
        if (currentChannel?.connector_channel_code == 'tiktok') {
          history.push('/product-stores/draf?channel=tiktok')
        }
      }
    }

  };

  const onShowBlockDescription = () => {
    if (btnRefCollapseDescription?.current && !openBlockDescription)
      btnRefCollapseDescription.current.click();
  }

  const onShowBlockImage = () => {
    if (btnRefCollapseImage?.current && !openBlockImage)
      btnRefCollapseImage.current.click();
  }

  return <div className="row " data-sticky-container style={{ background: '#eaebf4' }}>
    <div className="col-9">
      <Form>
        {disableAction && (
          <div className="alert alert-danger d-flex align-items-center p-5 mb-10">
            {/* <span className="svg-icon svg-icon-2hx svg-icon-primary me-3">...</span> */}

            <div className="d-flex flex-column">
              <h6 className="mb-2">{formatMessage({ defaultMessage: 'Đã ẩn hoặc khóa trên sàn' })}</h6>
              <span>{formatMessage({ defaultMessage: 'Do sản phẩm đã ẩn hoặc bị khóa trên sàn nên không thể chỉnh sửa được sản phẩm này.' })}</span>
            </div>
          </div>
        )}
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
          <ProductBasicInfo isEdit={true} />
        </Element>
        <Element id='productAssets'  >
          <ProductImages />
        </Element>
        <Element id='productDescription'  >
          <ProductDescription />
        </Element>
        <Element id='productShipping'  >
          <ProductShipping isEdit={true} storeInactive={storeInactive} />
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
          <ProductSellInfo />
        </Element>
        {!productEditing?.is_virtual && <div className='d-flex justify-content-end mb-8' >
          <button className="btn btn-secondary mr-2" style={{ width: 150 }} onClick={e => {
            e.preventDefault()
            history.push('/product-stores/list')
          }} >
            {formatMessage({ defaultMessage: 'Hủy bỏ' })}
          </button>
          <AuthorizationWrapper keys={['product_store_draft_edit', "product_store_edit"]}> 
            {
              //check with UPBASE-2765
              currentChannel?.connector_channel_code != 'tiktok' && <button className="btn btn-info  mr-2" style={{ width: 150 }} type="submit"
                disabled={storeInactive || disableAction}
                onClick={async (e) => {
                  e.preventDefault();

                  //Recheck sku
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


                  let error = await validateForm(values);

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

                  console.log('error', error, values)
                  if (Object.values(error).length != 0) {
                    handleSubmit()
                    setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
                    return;
                  } else {
                    if (isProductFileInValid || (values?.is_has_sell_info && attributesSelected.length > 0 && attributesSelected[0].values.some(_value => !!productAttributeFiles[_value.code] && productAttributeFiles[_value.code].files.length != 0 && productAttributeFiles[_value.code].files.some(_file => _file.hasError || _file.isUploading)))) {
                      setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
                      return
                    }
                    console.log('attributesSelected', attributesSelected)
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
                    // if (!productSizeChart && !!categorySelected?.support_size_chart) {
                    //   setErrorMessage('Bảng quy đổi kích cỡ không được để trống')
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

                      if (attributesSelected?.length > 0 && attributesSelected[0]?.values?.some(_value => !!productAttributeFiles[_value.code] && productAttributeFiles[_value.code]?.files?.length != 0)) {
                        let filterError = attributesSelected[0]?.values?.filter(_value => !productAttributeFiles[_value.code] || productAttributeFiles[_value.code]?.files?.length == 0).map(____ => ____.v)
                        if (filterError?.length > 0) {
                          setErrorMessage(formatMessage({ defaultMessage: `Vui lòng nhập đủ hình ảnh của từng giá trị phân loại hoặc để trống toàn bộ hình ảnh của các giá trị phân loại trong nhóm {name}` }, { name: attributesSelected[0]?.display_name }))
                          return
                        }
                      }
                    }
                  }
                  setErrorMessage(false)

                  updateProduct(values, false, rest)

                }}>
                {formatMessage({ defaultMessage: 'Cập nhật' })}
              </button>
            }
            <button className="btn btn-primary" style={{ width: 150 }} type="submit"
              disabled={storeInactive || disableAction}
              onClick={async (e) => {
                e.preventDefault();

                //Recheck sku
                let arrskus = _.groupBy(variants.map(_variant => ({ code: _variant.code, sku: values[`variant-${_variant.code}-sku`] })), 'sku');
                let skuErrors = {};
                Object.values(arrskus).filter(_ar => _ar.length > 1).forEach(_var => {
                  _var.forEach(_item => {
                    skuErrors[_item.code] = true
                  });
                });
                setFieldValue('size-chart-required', true)
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

                console.log('error', error, values)
                if (Object.values(error).length != 0) {
                  handleSubmit()
                  setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }))
                  return;
                } else {
                  if (isProductFileInValid || (attributesSelected.length > 0 && attributesSelected[0].values.some(_value => !!productAttributeFiles[_value.code] && productAttributeFiles[_value.code].files.length != 0 && productAttributeFiles[_value.code].files.some(_file => _file.hasError || _file.isUploading)))) {
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
                  // if (!productSizeChart && !!categorySelected?.support_size_chart) {
                  //   setErrorMessage('Bảng quy đổi kích cỡ không được để trống')
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

                    if (attributesSelected.length > 0 && attributesSelected[0].values.some(_value => !!productAttributeFiles[_value.code] && productAttributeFiles[_value.code].files.length != 0)) {
                      let filterError = attributesSelected[0].values.filter(_value => !productAttributeFiles[_value.code] || productAttributeFiles[_value.code].files.length == 0).map(____ => ____.v)
                      if (filterError.length > 0) {
                        setErrorMessage(formatMessage({ defaultMessage: 'Vui lòng nhập đủ hình ảnh của từng giá trị phân loại hoặc để trống toàn bộ hình ảnh của các giá trị phân loại trong nhóm {name}' }, { name: attributesSelected[0].display_name }))
                        return
                      }
                    }
                  }

                }
                setErrorMessage(false)

                updateProduct(values, true, rest)

              }} >
              {formatMessage({ defaultMessage: 'Lưu và đăng bán' })}
            </button>
          </AuthorizationWrapper>
        </div>}
      </Form>
    </div>
    <div className="col-3">
      <Card className="sticky" data-sticky="true" data-margin-top="80" >
        <CardBody>
          <h6 className="mb-4" style={{ fontWeight: 'unset' }}>
            {formatMessage({ defaultMessage: 'Thông tin sản phẩm' })}
          </h6>
          <div className="ml-10">
            <Link to='productInfo' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-180} duration={500}>
              <h6 style={{ fontWeight: 'unset' }} >
                {formatMessage({ defaultMessage: 'Thông tin cơ bản' })}
              </h6>
            </Link>
            <Link to='productAssets' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-150} duration={500}>
              <h6 style={{ fontWeight: 'unset' }} >
                {formatMessage({ defaultMessage: 'Hình ảnh & video' })}
              </h6>
            </Link>
            <Link to='productDescription' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-120} duration={500}>
              <h6 style={{ fontWeight: 'unset' }} >
                {formatMessage({ defaultMessage: 'Mô tả sản phẩm' })}
              </h6>
            </Link>
            <Link to='productShipping' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-80} duration={500}>
              <h6 style={{ fontWeight: 'unset' }} >
                {formatMessage({ defaultMessage: 'Vận chuyển' })}
              </h6>
            </Link>
          </div>
          <h6 className="mb-4" style={{ fontWeight: 'unset' }} >
            {formatMessage({ defaultMessage: 'Thông tin hàng hóa' })}
          </h6>
          <div className="ml-10">
            <Link to='productSellInfo' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-180} duration={500}>
              <h6 style={{ fontWeight: 'unset' }} >
                {formatMessage({ defaultMessage: 'Phân loại sản phẩm' })}
              </h6>
            </Link>
            {!!values['is_has_sell_info'] && variants.length > 0 && <Link to='productSellInfoVariants' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-100} duration={500}>
              <h6 style={{ fontWeight: 'unset' }} >
                {formatMessage({ defaultMessage: 'Sản phẩm phân loại' })}
              </h6>
            </Link>}
          </div>
        </CardBody>
      </Card>
    </div>
    <LoadingDialog show={loadingUpdate} />
  </div>
}
