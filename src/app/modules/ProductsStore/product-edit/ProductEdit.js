/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import { Formik } from "formik";
import React, { useState, useEffect, useMemo } from "react";
import { useProductsUIContext } from "../ProductsUIContext";
import { useSubheader } from "../../../../_metronic/layout/_core/MetronicSubheader";
import { ProductNewInfo } from "./ProductNewInfo";
import * as Yup from "yup";
import { useQuery } from "@apollo/client";
import query_sc_product from "../../../../graphql/query_sc_product";
import { ATTRIBUTE_VALUE_TYPE } from "../ProductsUIHelpers";
import { RouterPrompt } from "../../../../components/RouterPrompt";
import { Nav, Tab } from "react-bootstrap";
import { Helmet } from 'react-helmet-async';
import {
  Card,
  CardBody,
} from "../../../../_metronic/_partials/controls";

import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import _ from "lodash";
import dayjs from "dayjs";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import query_sme_catalog_product_by_pk_tonkho from "../../../../graphql/query_sme_catalog_product_by_pk_tonkho";
import ProductConnectDialog from "../products-list/dialog/ProductConnectDialog";
import gql from 'graphql-tag';
import client from "../../../../apollo";
import InfoProduct from "../../../../components/InfoProduct";
import { useIntl } from 'react-intl';
import HoverImage from "../../../../components/HoverImage";
import { useSelector } from "react-redux";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";

const query_sme_catalog_product_by_pk = gql`
query sme_catalog_product_by_pk($id: uuid!, $skip: Boolean = false) {
  sme_catalog_product_by_pk(id: $id) {
    is_combo
  }
}`;

export function ProductEdit({
  history,
  match,
}) {
  const { formatMessage } = useIntl();
  const [step, setStep] = useState(0);
  const [isShowConnect, setShowConnect] = useState(false);
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
    scWarehouses,
    setProductFiles,
    setProductVideFiles,
    setAttributesSelected,
    setCustomAttributes,
    setProductAttributeFiles,
    resetAll,
    setCurrentChannel,
    setProductEditing,
    setSmeProduct,
    setProductSizeChart,
    setProductImageOrigin,
    setspecial_type
  } = useProductsUIContext();
  const user = useSelector((state) => state.auth.user);
  const { setBreadcrumbs } = useSubheader()
  const { data: productCreated, loadingDetail } = useQuery(query_sc_product, {
    variables: {
      id: parseInt(match.params.id)
    },
    fetchPolicy: 'network-only'
  })
  console.log('productCreated', productCreated)

  const { data: productSme } = useQuery(query_sme_catalog_product_by_pk_tonkho, {
    variables: {
      id: productCreated?.sc_product?.sme_product_id,
    },
    skip: !productCreated?.sc_product?.sme_product_id,
    fetchPolicy: 'network-only'
  })


  useEffect(() => {
    if (!!productSme?.sme_catalog_product_by_pk) {
      setSmeProduct(productSme?.sme_catalog_product_by_pk)
    }
  }, [productSme])
  useEffect(() => {
    setBreadcrumbs([
      {
        title: formatMessage({ defaultMessage: 'Sửa sản phẩm sàn' })
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
    if (!!productCreated?.sc_product) {
      let ___store = productCreated?.sc_stores?.find(_ss => _ss.id == productCreated?.sc_product?.store_id)
      setProductEditing(productCreated?.sc_product)
      setspecial_type(productCreated?.sc_product?.special_type || ___store?.special_type || 0)
      setCurrentChannel({
        value: productCreated?.sc_product.store_id,
        enable_multi_warehouse: ___store?.enable_multi_warehouse,
        connector_channel_code: productCreated?.sc_product.connector_channel_code,
        special_type: ___store?.special_type || 0
      })
      setProductFiles(_.sortBy((productCreated?.sc_product?.productAssets || []).filter(_asset => _asset.type == 1), 'position').map(_asset => {
        return {
          id: _asset.sme_asset_id,
          source: _asset.origin_image_url || _asset.sme_url,
          scId: _asset.id,
          // isMergeOption: 1,
          source_draft: _asset.origin_image_url || _asset.sme_url,
          merged_image_url: _asset.sme_url,
          template_image_url: _asset.template_image_url,
        }
      }));

      let videoFileProduct = (_.sortBy((productCreated?.sc_product?.productAssets || []).filter(_asset => _asset.type == 2), 'position').map(_asset => {
        return {
          id: _asset.sme_asset_id,
          source: _asset.sme_url,
          scId: _asset.id,
          isDefault: true,
          platform_message: _asset.platform_message,
          uploaded_at: _asset.uploaded_at,
          platform_processed_at: _asset.platform_processed_at,
          synced_up_at: _asset.synced_up_at,
        }
      }))

      setProductVideFiles(videoFileProduct);

      let sizeCharts = (productCreated?.sc_product?.productAssets || []).filter(_asset => _asset.type == 3).map(_asset => {
        return {
          id: _asset.sme_asset_id,
          source: _asset.sme_url,
          scId: _asset.id
        }
      })
      if (sizeCharts.length > 0) {
        setProductSizeChart(sizeCharts[0]);
      }
      let imageOrigin = (productCreated?.sc_product?.productAssets || []).filter(_asset => _asset.type == 4).map(_asset => {
        return {
          id: _asset.sme_asset_id,
          source: _asset.origin_image_url || _asset.sme_url,
          scId: _asset.id,
          // isMergeOption: 1,
          source_draft: _asset.origin_image_url || _asset.sme_url,
          merged_image_url: _asset.sme_url,
          template_image_url: _asset.template_image_url,
        }
      })
      if (imageOrigin.length > 0) {
        setProductImageOrigin(imageOrigin[0]);
      }


      let _customAttributes = (productCreated?.sc_product?.productVariantAttributes || []).map(_attribute => {
        return {
          position: _attribute.position || 0,
          attribute_type: 1,
          display_name: _attribute.name,
          name: _attribute.name,
          sme_variant_attribute_id: _attribute.sme_variant_attribute_id,
          // id: _attribute.sc_attribute_id || _attribute.id, //sửa lỗi khi fill vào combobox để chọn lại thuộc tính, #UPBASE-2743
          id:  _attribute.id, //sửa lỗi khi fill vào combobox để chọn lại thuộc tính, #UPBASE-2743
          input_type: ATTRIBUTE_VALUE_TYPE.TEXT,
          isCustom: true,
          values: [],
          ref_index: _attribute.ref_index,
          sc_attribute_id: !!_attribute.sc_attribute_id ? String(_attribute.sc_attribute_id) : null,
          raw_id: _attribute.id
        }
      });
      _customAttributes.sort((a, b) => a.position - b.position)
      // console.log('_customAttributes_customAttributes', [..._customAttributes])

      let _attributeValueForm = {};
      let _productAttributeFiles = {};
      let _disableFields = {
        // ['disable-edit-attribute']: !!productCreated?.sc_product?.sme_product_id
        ['disable-edit-attribute']: true
      };

      let variantAttributeValues = [...(productCreated?.sc_product?.variantAttributeValues || [])];
      variantAttributeValues.sort((_v1, _v2) => _v1.position - _v2.position)
      variantAttributeValues.forEach(_attValue => {
        let variantAssets = productCreated?.sc_product?.connector_channel_code != 'lazada' ? _attValue?.scVariantValueAssets?.slice(0, 1) : _attValue?.scVariantValueAssets;
        _productAttributeFiles = {
          ..._productAttributeFiles,
          [_attValue.ref_index]: {
            files: (variantAssets || []).map(_asset => {
              return {
                id: _asset.sme_asset_id,
                source: _asset.sme_url,
                scId: _asset.id
              }
            }),
            attribute_value: _attValue.value,
            attribute_id: _attValue.sc_variant_attribute_id,
            isCustom: false
          }
        }

        _customAttributes = _customAttributes.map(_att => {
          if (_att.raw_id == _attValue.sc_variant_attribute_id) {
            _attributeValueForm[`att-${_att.id}-${_attValue.ref_index}`] = _attValue.value
            return {
              ..._att,
              values: (_att.values || []).concat([{
                v: _attValue.value, 
                code: String(_attValue.ref_index),
                sme_variant_attribute_value_id: String(_attValue.sme_variant_attribute_value_id),
                sc_attribute_group_id: _attValue?.sc_attribute_group_id,
                sc_option_id: _attValue?.sc_option_id,
                ref_attribute_group_id: _attValue?.ref_attribute_group_id,
              }])
            }
          }
          return _att
        })
      });

      console.log('_productAttributeFiles', _productAttributeFiles);
      (productCreated?.sc_product?.productAttributeValues || []).forEach(_attValue => {
        if (!!_attValue.unit) {
          _attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}-unit`] = { label: _attValue.unit, value: _attValue.unit }
        }

        if (_attValue.input_type == ATTRIBUTE_VALUE_TYPE.TEXT
          || _attValue.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC
          || _attValue.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_FLOAT
          || _attValue.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC_INT) {
          _attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}`] = _attValue.value
        }
        if (_attValue.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT) {
          _attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}`] = {
            label: _attValue.value,
            value: String(_attValue.sc_option_id)
          }
        }
        if (_attValue.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT_CUSTOM_VALUE) {
          if (!!_attValue.sc_option_id) {
            _attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}`] = {
              label: _attValue.value,
              value: String(_attValue.sc_option_id)
            }
          } else {
            _attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}`] = {
              label: !!_attValue.unit && !_attValue.value.endsWith(_attValue.unit) ? `${_attValue.value}${_attValue.unit}` : _attValue.value,
              value: !!_attValue.unit && !_attValue.value.endsWith(_attValue.unit) ? `${_attValue.value}${_attValue.unit}` : _attValue.value,
              __isNew__: true,
              raw_v: _attValue.value,
              raw_u: _attValue.unit
            }
          }
        }
        if (_attValue.input_type == ATTRIBUTE_VALUE_TYPE.DATE
          || _attValue.input_type == ATTRIBUTE_VALUE_TYPE.DATE_MONTH
          || _attValue.input_type == ATTRIBUTE_VALUE_TYPE.TIMESTAMP) {
          _attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}`] = dayjs.unix(_attValue.value).toDate()
        }
        if (_attValue.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT) {
          if (!_attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}`]) {
            _attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}`] = [{
              label: _attValue.value,
              value: String(_attValue.sc_option_id)
            }]
          } else {
            _attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}`].push({
              label: _attValue.value,
              value: String(_attValue.sc_option_id)
            })
          }
        }
        if (_attValue.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT_CUSTOM_VALUE) {
          if (!!_attValue.sc_option_id) {
            if (!_attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}`]) {
              _attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}`] = [{
                label: _attValue.value,
                value: String(_attValue.sc_option_id),
                __isNew__: false
              }]
            } else {
              _attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}`].push({
                label: _attValue.value,
                value: String(_attValue.sc_option_id),
                __isNew__: false
              })
            }
          } else {
            if (!_attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}`]) {
              _attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}`] = [{
                label: !!_attValue.unit && !_attValue.value.endsWith(_attValue.unit) ? `${_attValue.value}${_attValue.unit}` : _attValue.value,
                value: !!_attValue.unit && !_attValue.value.endsWith(_attValue.unit) ? `${_attValue.value}${_attValue.unit}` : _attValue.value,
                __isNew__: true,
                raw_v: _attValue.value,
                raw_u: _attValue.unit
              }]
            } else {
              _attributeValueForm[`property-${_attValue.op_sc_product_attribute_id}`].push({
                label: !!_attValue.unit && !_attValue.value.endsWith(_attValue.unit) ? `${_attValue.value}${_attValue.unit}` : _attValue.value,
                value: !!_attValue.unit && !_attValue.value.endsWith(_attValue.unit) ? `${_attValue.value}${_attValue.unit}` : _attValue.value,
                __isNew__: true,
                raw_v: _attValue.value,
                raw_u: _attValue.unit
              })
            }
          }
        }
      });

      (productCreated?.sc_product?.productVariants || []).forEach(_variant => {
        let sc_product_attributes_value = JSON.parse(_variant.sc_product_attributes_value || "[]");
        // console.log('_customAttributes', _customAttributes, sc_product_attributes_value)
        let _codesss = _customAttributes?.map(_attribute => {
          return (_attribute.values.find(_value => sc_product_attributes_value.some(_code => _code == _value.code)) || { code: "" }).code
        })

        const warehouseVariantInventories = scWarehouses?.reduce(
          (result, wh) => {
            const stockOnHandWarehouse = _variant?.variantInventoris?.find(iv => iv?.sc_warehouse_id == wh?.value)?.stock_on_hand || 0

            result[`variant-${_codesss.join('-')}-${wh?.value}-stockOnHand`] = stockOnHandWarehouse;
            return result;
          }, {}
        );

        _attributeValueForm = {
          ..._attributeValueForm,
          ...warehouseVariantInventories,
          [`variant-${_codesss.join('-')}-price`]: _variant.price,
          [`variant-${_codesss.join('-')}-priceMinimum`]: _variant.price_minimum,
          [`variant-${_codesss.join('-')}-sku`]: _variant.sku,
          [`variant-${_codesss.join('-')}-stockOnHand`]: _variant.sellable_stock,
          [`variant-${_codesss.join('-')}-stockReverse`]: _variant.reverse_stock,
          [`variant-${_codesss.join('-')}-visible`]: _variant.status == 10 ? true : false,
          [`variant-${_codesss.join('-')}-lastid`]: _variant.id,
          [`variant-${_codesss.join('-')}-merge_price`]: !!_variant.merge_price,
          [`variant-${_codesss.join('-')}-merge_stock`]: !!_variant.merge_stock,
          [`variant-${_codesss.join('-')}-sme_product_variant_id`]: _variant.sme_product_variant_id,
          [`variant-${_codesss.join('-')}-disable-stock`]: !!_variant.sme_product_variant_id && !!_variant?.is_enable_link_inventory && productCreated?.sc_product?.status != 2,
          [`variant-noattribute-lastid`]: sc_product_attributes_value.length == 0 ? _variant.id : undefined,
          [`variant-noattribute-sme_product_variant_id`]: sc_product_attributes_value.length == 0 ? _variant.sme_product_variant_id : undefined,
        }

        if (productCreated?.sc_product?.connector_channel_code === 'lazada') {
          _disableFields = {
            ..._disableFields,
            [`disable-lzd-sku-${_codesss.join('-')}`]: true,
          }
        }

        _disableFields = {
          ..._disableFields,
          [`disable-sku-${_codesss.join('-')}`]: !!_variant.sme_product_variant_id,
        }
      })

      let warehouseInventories = {};
      if (productCreated?.sc_product?.productVariants?.length == 1) {
        const inventories = scWarehouses?.reduce(
          (result, wh) => {
            const stockOnHand = productCreated?.sc_product?.productVariants[0]?.variantInventoris?.find(iv => iv?.sc_warehouse_id == wh?.value)?.stock_on_hand || 0

            result[`${wh?.value}-stockOnHand`] = stockOnHand;
            return result;
          }, {}
        );
        warehouseInventories = {
          ...warehouseInventories,
          ...inventories
        }
      }

      let hasAttributeHasAssets = false;
      _customAttributes = _customAttributes.map(_att => {
        _att.values.forEach(_value => {
          _disableFields = {
            ..._disableFields,
            [`disable-att-value-${_att.id}-${_value.code}`]: true,
            [`disable-delete-att-${_att.id}`]: true
          }
        });
        if (Object.values(_productAttributeFiles).some(_file => _file.attribute_id == _att.raw_id && _file.files?.length > 0)) {
          hasAttributeHasAssets = true;
          return {
            ..._att,
            has_asset: true
          }
        }
        return _att
      })
      if (!hasAttributeHasAssets) {
        _disableFields = {
          ..._disableFields,
          [`no-attribute-assets`]: true
        }
        if (_customAttributes.length > 0)
          _customAttributes[0].has_asset = true
      }

      console.log("_customAttributes", { _customAttributes })
      setCustomAttributes(_customAttributes)
      setAttributesSelected([..._customAttributes])
      setProductAttributeFiles(_productAttributeFiles)

      //shipping
      let ref_logistic_channel_ids = {};
      (productCreated?.sc_product?.ref_logistic_channel_id || []).forEach(element => {
        ref_logistic_channel_ids[`channel-logistic-${element}`] = true
      });

      let descriptionObj = {
        description: productCreated?.sc_product.description || "",
        description_short: productCreated?.sc_product.short_description || "",
        description_html: productCreated?.sc_product.description_html.replaceAll(`"`, `'`) || "",
        description_html_init: productCreated?.sc_product.description_html.replaceAll(`"`, `'`) || "",
        description_short_init: productCreated?.sc_product?.short_description || '',
      }


      let description_extend = EditorState.createEmpty()
      if (productCreated?.sc_product?.description_extend) {
        try {
          let hasItem = false;
          const blocksFromHtml = htmlToDraft(_.flatten(productCreated?.sc_product?.description_extend.map(__ => {
            if (__.field_type == 'text') {
              hasItem = true;
              return (__.text || '').split('\n').map(__ => `<p>${__}</p>`)
            }
            if (!!__.image_info) {
              return [`${!!hasItem ? '' : '<p></p>'}<img src="${__.image_info.sme_url || __.image_info.image_url}" alt="${__.image_info.sme_url || __.image_info.image_url}" style="height: auto;width: 100%"/><p></p>`]
            }
            return null
          })).filter(__ => !!__).join(''));

          const contentState = ContentState.createFromBlockArray(blocksFromHtml.contentBlocks, blocksFromHtml.entityMap);
          description_extend = EditorState.createWithContent(contentState)
        } catch (error) {
          console.log('error', error)
        }
      } else {
        try {
          const blocksFromHtml = htmlToDraft(`<p>${productCreated?.sc_product.description || ""}</p>`);
          const contentState = ContentState.createFromBlockArray(blocksFromHtml.contentBlocks, blocksFromHtml.entityMap);
          description_extend = EditorState.createWithContent(contentState)
        } catch (error) {

        }
      }

      let tags = productCreated?.sc_product?.scProductTag?.map(
        (_tag) => ({
          value: _tag?.id,
          label: _tag?.tag_name
        })
      ) || [];

      const origin_warehouse = scWarehouses?.find(wh => wh?.isDefault);

      return {
        name: productCreated?.sc_product.name || "",
        sku: productCreated?.sc_product.sku || "",
        price: productCreated?.sc_product?.productVariants?.[0]?.price || 0,
        price_minimum: productCreated?.sc_product?.productVariants?.[0]?.price_minimum || null,
        origin_sku: productCreated?.sc_product?.productVariantAttributes?.length == 0 ? productCreated?.sc_product?.productVariants?.[0]?.sku : '',
        product_tags: tags,
        current_product_tags: tags?.map(_tag => _tag?.value) || [],
        has_attributes: productCreated?.sc_product?.productVariants?.length > 0 && productCreated?.sc_product?.productVariantAttributes?.length > 0,
        enable_multi_warehouse: ___store?.enable_multi_warehouse,
        is_has_sell_info: productCreated?.sc_product?.productVariants?.length > 0 && productCreated?.sc_product?.productVariantAttributes?.length > 0,
        stockOnHand: productCreated?.sc_product?.productVariants?.[0]?.sellable_stock || 0,
        stockReverse: productCreated?.sc_product?.productVariants?.[0]?.reverse_stock,
        video_url: productCreated?.sc_product.video || '',
        ...(productCreated?.sc_product.connector_channel_code === 'lazada' ? {
          type_video: (videoFileProduct?.length > 0 || !productCreated?.sc_product.video) ? 'video' : 'url',
        } : {}),
        ...descriptionObj,
        origin_warehouse,
        height: productCreated?.sc_product?.package_height || 0,
        length: productCreated?.sc_product?.package_length || 0,
        width: productCreated?.sc_product?.package_width || 0,
        weight: productCreated?.sc_product?.package_weight || 0,
        ...ref_logistic_channel_ids,
        brand: {
          value: parseInt(productCreated?.sc_product?.sc_brand_id),
          label: productCreated?.sc_product?.ref_brand_name || "No Brand",
        },
        ...warehouseInventories,
        ..._attributeValueForm,
        ..._disableFields,
        description_extend,
        is_disable_stock: !!productCreated?.sc_product?.productVariants?.[0]?.sme_product_variant_id && !!productCreated?.sc_product?.productVariants?.[0]?.is_enable_link_inventory && productCreated?.sc_product?.status != 2,
        is_cod_open: productCreated?.sc_product.is_cod_open == 1,
        isEdit: true
      }
    }
    return {}
  }, [productCreated, scWarehouses])

  let [_assetImage, _store] = useMemo(() => {
    let ___store = productCreated?.sc_stores?.find(_ss => _ss.id == productCreated?.sc_product?.store_id)
    let __chanel = productCreated?.op_connector_channels?.find(_ss => _ss.code == productCreated?.sc_product?.connector_channel_code)
    if (!!___store) {
      ___store = {
        ...___store,
        logo_asset_url: __chanel?.logo_asset_url
      }
    }
    if (!productCreated?.sc_product) {
      return [null, ___store];
    }
    try {
      let imgOrigin = (productCreated?.sc_product?.productAssets || []).find(_asset => _asset.type == 4)
      return [!!imgOrigin && !!imgOrigin.template_image_url ? imgOrigin : (productCreated?.sc_product?.productAssets || []).filter(_asset => _asset.type == 1)[0], ___store]
    } catch (error) {
      return [null, ___store]
    }
  }, [productCreated]);

  console.log(`>>>>>>INITIAL>>>>>>`, initialValues)

  const _buildProducNewInfo = (formikProps) => {
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
      <ProductNewInfo history={history}
        setStep={setStep}
        formikProps={formikProps}
        setIdProductCreated={setIdProductCreated}
        productCreated={productCreated?.sc_product || null}
        disableAction={productCreated?.sc_product?.status === 3}
        storeInactive={_store?.status != 1}
      />
    </>
  };

  const _buildProductLink = (formikProps) => {
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
      {/* <ProductConnect
        history={history}
        showConnect={isShowConnect}
        onShowConnect={() => setShowConnect(true)}
        onHideConnect={() => setShowConnect(false)}
        scId={productCreated?.sc_product?.id}
        dataAttributeSc={productCreated?.sc_product?.productVariantAttributes || []}
      /> */}
    </>
  }

  const dataTab = [
    {
      id: 1,
      link: `/product-stores/edit/${match?.params?.id}`,
      title: formatMessage({ defaultMessage: 'THÔNG TIN SẢN PHẨM TRÊN SÀN' }),
      component: _buildProducNewInfo
    },
    {
      id: 2,
      link: `/product-stores/edit/${match?.params?.id}/link`,
      title: formatMessage({ defaultMessage: 'SẢN PHẨM LIÊN KẾT' }),
      component: _buildProductLink
    }
  ]

  const selectedTab = useMemo(
    () => {
      let path = history?.location?.pathname || '';
      if (String(path).endsWith('/link')) {
        return 1;
      }
      return 0;
    }, [history.location.pathname]
  );

  const helmetRender = useMemo(
    () => {
      if (!productCreated?.sc_product?.name) return null;

      return (
        <Helmet
          titleTemplate={`${productCreated?.sc_product?.name} - UpBase`}
          defaultTitle={`${productCreated?.sc_product?.name} - UpBase`}
        >
          <meta name="description" content={`${productCreated?.sc_product?.name} - UpBase`} />
        </Helmet>
      )
    }, [productCreated?.sc_product?.name]
  );

  if (loadingDetail || Object.keys(initialValues).length == 0)
    return (
      <div className="row" data-sticky-container style={{ justifyContent: 'center', alignItems: 'center' }} >
        <span className="spinner spinner-primary" style={{ marginTop: 20 }} ></span>
      </div>
    )

  return (
    <>
      {helmetRender}
      <Card >
        <CardBody style={{ padding: '1rem' }} >
          <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}>
            <div style={{
              backgroundColor: '#F7F7FA',
              width: 50, height: 50,
              borderRadius: 8,
              overflow: 'hidden',
              minWidth: 50
            }} className='mr-6' >
              {
                !!_assetImage && <HoverImage placement='right' defaultSize={{ width: 50, height: 50 }} url={_assetImage?.sme_url} size={{ width: 320, height: 320 }} />
              }
            </div>
            <div className="w-100">
              <InfoProduct
                name={productCreated?.sc_product?.name}
                sku={productCreated?.sc_product?.sku}
                url={`#`}
              />

              <p className="d-flex mb-2" style={_store?.status == 1 ? { fontSize: 12, alignItems: 'center' } : { opacity: 0.5, fontSize: 12, alignItems: 'center' }}><img style={{ width: 12, height: 12 }} src={_store?.logo_asset_url} className="mr-2" /><span >{_store?.name}</span></p>
             <AuthorizationWrapper keys={['product_store_connect_view']}>
              <div style={{ display: 'flex', alignItems: 'center' }} >
                {
                  productCreated?.sc_product?.sme_product_id ?
                    <a
                      className='px-2 mr-4'
                      style={{ backgroundColor: '#ff5629', fontSize: 12, color: 'white', borderRadius: 2 }}
                      onClick={e => {
                        if(user?.is_subuser && !['product_store_connect_view']?.some(key => user?.permissions?.includes(key))) {
                          return
                      }
                        e.preventDefault();

                        client.query({
                          query: query_sme_catalog_product_by_pk,
                          fetchPolicy: 'network-only',
                          variables: {
                            id: productCreated?.sc_product?.sme_product_id
                          }
                        }).then(value => {
                          if (value?.data?.sme_catalog_product_by_pk?.is_combo) {
                            history.push(`/products/edit-combo/${productCreated?.sc_product?.sme_product_id}`)
                          } else {
                            history.push(`/products/edit/${productCreated?.sc_product?.sme_product_id}`)
                          }
                        })
                          .catch(err => {
                            history.push(`/products/edit/${productCreated?.sc_product?.sme_product_id}`)
                          })
                      }}
                    >
                      {formatMessage({ defaultMessage: 'Đã liên kết kho' })}
                    </a>
                    :
                    <span className='px-2 mr-6' style={{ backgroundColor: '#888484', fontSize: 12, color: 'white', borderRadius: 2 }} >{formatMessage({ defaultMessage: 'Chưa liên kết kho' })}</span>
                }
                {!productCreated?.sc_product?.sme_product_id && <span
                  className="text-primary mr-6 cursor-pointer"
                  onClick={() => setShowConnect(true)}
                >
                  {formatMessage({ defaultMessage: 'Liên kết' })}
                </span>}
                <span className={productCreated?.sc_product?.status == 10 ? 'text-success' : (productCreated?.sc_product?.status == 4 ? 'text-danger' : 'text-secondary')}>{productCreated?.sc_product?.platform_text_status || ''}</span>
              </div>
            </AuthorizationWrapper>
            </div>
          </div>
          {/* <div style={{ display: 'flex' }}>
            {
              dataTab.map(
                (_tab, index) => (
                  <li className="nav-item" key={`tab-product-store-${index}`} style={{ listStyle: 'none' }}>
                    <a
                      className={`nav-link ${selectedTab === index ? 'active' : ''}`}
                      style={selectedTab === index ? { color: 'rgb(255, 86, 41)' } : { color: "black" }}
                      href=""
                      onClick={e => {
                        e.preventDefault();
                        history.push(_tab.link);
                      }}
                    >
                      {_tab.title}
                    </a>
                  </li>
                )
              )
            }
          </div> */}
        </CardBody>
      </Card>
      <div className="card card-custom gutter-b">
        <Formik
          initialValues={initialValues}
          validationSchema={Yup.object().shape(productEditSchema, [['length', 'height'], ['width', 'length'], ['width', 'height']])}
          enableReinitialize
        >
          {
            (formikProps) => {
              const changed = formikProps.values['__changed__']
              return dataTab[selectedTab].component(formikProps)
            }
          }
        </Formik>
      </div>
      <ProductConnectDialog
        show={isShowConnect}
        onHide={() => setShowConnect(false)}
        scId={productCreated?.sc_product?.id}
      />
    </>
  );
}
