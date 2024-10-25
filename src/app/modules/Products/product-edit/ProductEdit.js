/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import { Formik } from "formik";
import React, { useState, useEffect, useMemo } from "react";
import { useProductsUIContext } from "../ProductsUIContext";
import { useSubheader } from "../../../../_metronic/layout/_core/MetronicSubheader";
import { ProductNewInfo } from "./ProductNewInfo";
import ProductAffiliate from '../product-affiliate/ProductAffiliate';
import { ProductNewChannel } from "./ProductNewChannel";
import * as Yup from "yup";
import { useQuery } from "@apollo/client";
import query_sme_catalog_product_by_pk from "../../../../graphql/query_sme_catalog_product_by_pk";
import { ATTRIBUTE_VALUE_TYPE, CONVERSION_CALCULATION } from "../ProductsUIHelpers";
import { RouterPrompt } from "../../../../components/RouterPrompt";
import { Helmet } from 'react-helmet-async';
import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import _, { sum } from "lodash";
import ModalProductConnect from "../products-list/dialog/ModalProductConnect";
import { useIntl } from "react-intl";
import { ConfirmDialog } from '../../Order/order-detail/ConfirmDialog'
import { useSelector } from 'react-redux';

import {
  Card,
  CardBody,
} from "../../../../_metronic/_partials/controls";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import InfoProduct from "../../../../components/InfoProduct";
import HoverImage from "../../../../components/HoverImage";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";



export function ProductEdit({
  history,
  match,
}) {
  const [idProductCreated, setIdProductCreated] = useState()
  const {
    productEditSchema,
    categorySelected,
    setCategorySelected,
    attributesSelected,
    productFiles,
    productVideFiles,
    productAttributeFiles,
    warrantiesList,
    setProductFiles,
    setProductVideFiles,
    smeCatalogStores,
    setAttributesSelected,
    setCustomAttributes,
    setVariantsUnit,
    setProductAttributeFiles,
    resetAll, setIsEditProduct,
    setCurrentProduct,
    setProductSizeChart,
    setIsUnit,
    setProductImageOrigin
  } = useProductsUIContext();
  const { formatMessage } = useIntl()
  const { setBreadcrumbs, setTitle } = useSubheader()
  const [idsProductsConnected, setIdsProductsConnected] = useState([]);
  const [smeProductIdSelect, setSmeProductIdSelect] = useState(0);
  const [completedQuery, setCompletedQuery] = useState(false)
  const user = useSelector((state) => state.auth.user);
  const { data: productCreated, loadingDetail, refetch, error } = useQuery(query_sme_catalog_product_by_pk, {
    variables: {
      id: match.params.id
    },
    onCompleted: () => {
      setCompletedQuery(true)
    }
  })
  console.log(productCreated)
  useEffect(() => {
    setBreadcrumbs([
      {
        title: formatMessage({ defaultMessage: 'Sửa sản phẩm thường' }),
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

      const smeVariantsMain = productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.filter(variant => !variant?.variant_unit && variant?.product_status_id == null);
      const smeVariantsUnit = productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.filter(variant => !!variant?.variant_unit && variant?.product_status_id == null);


      let main_unit_name = smeVariantsMain?.[0]?.unit || ''

      if (smeVariantsUnit?.length) {
        setIsUnit(true)
      }

      let codesVariantMain = {}; //cache de variant_unit khong phai tim nua

      (smeVariantsMain || []).forEach(_variant => {
        let codes = [];

        // _.sortBy((_variant.attributes || []), ___atttibute => (___atttibute?.product_attribute_value_id || 0)).forEach((_attribute, ___index) => {
        _.sortBy((_variant.attributes || []), ___atttibute => (___atttibute?.id || 0)).forEach((_attribute, ___index) => {
          codes.push(_attribute.sme_catalog_product_attribute_value?.ref_index);

          _attributeValueForm = {
            ..._attributeValueForm,
            [`att-${_attribute.sme_catalog_product_attribute_value?.product_attribute_custom_id || _attribute.sme_catalog_product_attribute_value?.product_attribute_id}-${_attribute.sme_catalog_product_attribute_value?.ref_index}`]: _attribute.sme_catalog_product_attribute_value?.name,
            [`att-${_attribute.sme_catalog_product_attribute_value?.product_attribute_custom_id || _attribute.sme_catalog_product_attribute_value?.product_attribute_id}-${_attribute.sme_catalog_product_attribute_value?.ref_index}-editing`]: true, //field dung de disable khong cho xoá khi sửa sp
          }

          if (!_productAttributeFiles[_attribute.sme_catalog_product_attribute_value?.ref_index]) {
            _productAttributeFiles = {
              ..._productAttributeFiles,
              [_attribute.sme_catalog_product_attribute_value?.ref_index]: {
                files: (_.sortBy((_attribute.sme_catalog_product_attribute_value?.assets || []), 'position_show')).map(_asset => {
                  return {
                    id: _asset.asset_id,
                    source: _asset.asset_url
                  }
                }),
                attribute_value: _attribute.sme_catalog_product_attribute_value?.name,
                attribute_id: _attribute.sme_catalog_product_attribute_value?.product_attribute_custom_id || _attribute.sme_catalog_product_attribute_value?.product_attribute_id,
                isCustom: false
              }
            }
          }

          let hasNew = true;
          _attributeSelected = _attributeSelected.map(_att => {

            if (!!_attribute.sme_catalog_product_attribute_value?.sme_catalog_product_custom_attribute) {
              if (_att.isCustom && _att.id == _attribute.sme_catalog_product_attribute_value?.sme_catalog_product_custom_attribute.id) {
                hasNew = false;
                return {
                  ..._att,
                  values: _att.values.some(_vvv => _vvv.code == _attribute.sme_catalog_product_attribute_value?.ref_index) ? _att.values : _att.values.concat([{
                    v: _attribute.sme_catalog_product_attribute_value?.name,
                    code: _attribute.sme_catalog_product_attribute_value?.ref_index,
                    position: _attribute.sme_catalog_product_attribute_value?.position || 0,
                  }])
                }
              }
              return _att;
            }
            if (!_att.isCustom && _att.id == _attribute.sme_catalog_product_attribute_value?.op_catalog_product_attribute.id) {
              hasNew = false;
              return {
                ..._att,
                values: _att.values.some(_vvv => _vvv.code == _attribute.sme_catalog_product_attribute_value?.ref_index) ? _att.values : _att.values.concat([{
                  v: _attribute.sme_catalog_product_attribute_value?.name,
                  code: _attribute.sme_catalog_product_attribute_value?.ref_index,
                  position: _attribute.sme_catalog_product_attribute_value?.position || 0,
                }])
              }
            }
            return _att;
          })

          if (hasNew) {
            if (!!_attribute.sme_catalog_product_attribute_value?.op_catalog_product_attribute) {
              _attributeSelected.push({
                ..._attribute.sme_catalog_product_attribute_value?.op_catalog_product_attribute,
                values: [{
                  v: _attribute.sme_catalog_product_attribute_value?.name,
                  code: _attribute.sme_catalog_product_attribute_value?.ref_index,
                  position: _attribute.sme_catalog_product_attribute_value?.position || 0,
                }]
              })

            }
            if (!!_attribute.sme_catalog_product_attribute_value?.sme_catalog_product_custom_attribute) {
              _attributeSelected.push({
                ..._attribute.sme_catalog_product_attribute_value?.sme_catalog_product_custom_attribute,
                input_type: ATTRIBUTE_VALUE_TYPE.TEXT,
                isCustom: true,
                values: [{
                  v: _attribute.sme_catalog_product_attribute_value?.name,
                  code: _attribute.sme_catalog_product_attribute_value?.ref_index,
                  position: _attribute.sme_catalog_product_attribute_value?.position || 0,
                }]
              })
            }

          }
        });

        //sort lại values trong attribute
        // _attributeSelected = _attributeSelected.map(_att => {
        //   let newValues = [...(_att.values || [])];
        //   newValues.sort((_v1, _v2) => _v1.position - _v2.position)
        //   return {
        //     ..._att,
        //     values: newValues
        //   }
        // });

        codes = codes.join('-');

        codesVariantMain[_variant.id] = codes

        //Note: Cần filter tạo mapping với các unit có main_variant_id = _variant.id
        const mappingPrice = (smeVariantsUnit || []).filter(__variantUnit => __variantUnit?.variant_unit?.main_variant_id == _variant.id).reduce((result, unit) => {
          result[`variant-${unit?.variant_unit?.id}-${codes}-costPrice`] = unit?.cost_price;
          result[`variant-${unit?.variant_unit?.id}-${codes}-price`] = unit?.price;
          result[`variant-${unit?.variant_unit?.id}-${codes}-priceMinimum`] = unit?.price_minimum;

          return result;
        }, {})

        let stockVariant = smeCatalogStores?.reduce(
          (result, store) => {
            const findedInventory = _variant?.inventories?.find(item => item?.sme_store_id == store?.value);
            result[`variant-${codes}-${store?.value}-stockOnHand`] = findedInventory?.stock_actual;
            result[`variant-${codes}-${store?.value}-stockActual`] = findedInventory?.stock_actual;
            result[`variant-${codes}-${store?.value}-stockAvailable`] = findedInventory?.stock_available;
            result[`variant-${codes}-${store?.value}-stockPreallocate`] = findedInventory?.stock_preallocate;
            result[`variant-${codes}-${store?.value}-stockReserve`] = findedInventory?.stock_reserve;
            result[`variant-${codes}-${store?.value}-stockAllocated`] = findedInventory?.stock_allocated;
            result[`variant-${codes}-${store?.value}-stockShipping`] = findedInventory?.stock_shipping;


            //Tong
            result[`variant-${codes}-totalStockPreallocate`] = (findedInventory?.stock_preallocate || 0)+ (result[`variant-${codes}-totalStockPreallocate`] || 0);
            result[`variant-${codes}-totalStockReserve`] = (findedInventory?.stock_reserve || 0) + (result[`variant-${codes}-totalStockReserve`] || 0);

            return result;
          }, {}
        )

        let result = []

        result[`positive-quantity-${codes}-preallocate-reserve`] = _variant?.inventory?.stock_reserve > 0 && _variant?.inventory?.stock_preallocate > 0

        _attributeValueForm = {
          ..._attributeValueForm,
          ...stockVariant,
          ...mappingPrice,
          ...result,
          [`variant-${codes}-active`]: true,
          [`variant-${codes}-id`]: _variant.id,
          [`variant-${codes}-linked`]: _variant?.sc_variant_linked,
          [`variant-${codes}-sku`]: _variant.sku,
          [`variant-${codes}-unit`]: _variant?.unit,
          [`variant-${codes}-price`]: _variant.price,
          // [`variant-${codes}-vatRate`]: _variant.vat_rate,
          [`variant-${codes}-gtin`]: _variant.gtin || _variant.sku,
          [`variant-${codes}-costPrice`]: _variant.cost_price,
          [`variant-${codes}-priceMinimum`]: _variant.price_minimum,
          [`variant-${codes}-stockOnHand`]: _variant.stock_on_hand,
          [`variant-${codes}-visible`]: (_variant.status == 10),
        }
      });


      const variantsUnit = smeVariantsUnit?.reduce((result, variant) => {
        const idUnit = variant?.variant_unit?.id;

        let codes = codesVariantMain[variant?.variant_unit?.main_variant_id];

        let stockVariant = smeCatalogStores?.reduce(
          (result, store) => {
            const findedInventory = variant?.inventories?.find(item => item?.sme_store_id == store?.value);
            result[`variant-${idUnit}-${store?.value}-stockOnHand`] = findedInventory?.stock_actual;
            result[`variant-${idUnit}-${store?.value}-stockActual`] = findedInventory?.stock_actual;
            result[`variant-${idUnit}-${store?.value}-stockAvailable`] = findedInventory?.stock_available;
            result[`variant-${idUnit}-${store?.value}-stockPreallocate`] = findedInventory?.stock_preallocate;
            result[`variant-${idUnit}-${store?.value}-stockReserve`] = findedInventory?.stock_reserve;
            result[`variant-${idUnit}-${store?.value}-stockAllocated`] = findedInventory?.stock_allocated;
            result[`variant-${idUnit}-${store?.value}-stockShipping`] = findedInventory?.stock_shipping;

            return result;
          }, {}
        )

        result[`changePrice`] = false
        result[`variant-${idUnit}-active`] = true
        result[`name-unit-${idUnit}`] = variant?.variant_unit?.name;
        result[`ratio-unit-${idUnit}`] = variant?.variant_unit?.ratio;
        result[`description-unit-${idUnit}`] = formatMessage({ defaultMessage: '1 {nameUnit} = {ratioUnit} {mainUnit}' }, {
          mainUnit: main_unit_name,
          nameUnit: variant?.variant_unit?.name,
          ratioUnit: variant?.variant_unit?.ratio
        });
        result[`attribute-unit-${idUnit}`] = { value: codes, label: variant?.name?.replaceAll('+', '-') };
        result[`variant-${codes}-${idUnit}-id`] = variant?.id;
        result[`unit_variant-${idUnit}-sku`] = variant?.sku;
        result[`variant-${idUnit}-gtin`] = variant?.gtin || variant?.sku;
        result[`variant-${idUnit}-price`] = variant?.price;
        // result[`variant-${idUnit}-vatRate`] = variant?.vat_rate;
        result[`variant-${idUnit}-linked`] = variant?.sc_variant_linked;
        result[`variant-${idUnit}-costPrice`] = variant?.cost_price;
        result[`variant-${idUnit}-priceMinimum`] = variant?.price_minimum;
        result[`variant-${idUnit}-stockOnHand`] = variant?.stock_on_hand;

        result[`variant-${idUnit}-${codes}-active`] = true
        result[`unit_variant-${idUnit}-${codes}-sku`] = variant?.sku;
        result[`variant-${idUnit}-${codes}-gtin`] = variant?.gtin || variant?.sku;
        result[`variant-${idUnit}-${codes}-price`] = variant?.price;
        // result[`variant-${idUnit}-${codes}-vatRate`] = variant?.vat_rate;
        result[`variant-${idUnit}-${codes}-linked`] = variant?.sc_variant_linked;
        result[`variant-${idUnit}-${codes}-costPrice`] = variant?.cost_price;
        result[`variant-${idUnit}-${codes}-priceMinimum`] = variant?.price_minimum;
        result[`variant-${idUnit}-${codes}-stockOnHand`] = variant?.stock_on_hand;

        return { ...result, ...stockVariant };
      }, {});

      setVariantsUnit(smeVariantsUnit?.map(variant => {
        let codes = codesVariantMain[variant?.variant_unit?.main_variant_id];

        return {
          id: variant?.variant_unit?.id,
          sme_variant_id: variant?.id,
          codes: [codes]
        }
      }));

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
      if (_customAttributes.length > 0) {
        if (has_asset > 0) {
          if (has_asset == 2) {
            _customAttributes[1].has_asset = true;
          }
        } else {
          _customAttributes[0].has_asset = true;
        }
      }
      setCustomAttributes(_customAttributes)

      _attributeSelected.sort((_1, _2) => _1.id - _2.id)

      has_asset = 0;
      _attributeSelected = _attributeSelected.map(_att => {
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
      if (_attributeSelected.length > 0) {
        if (has_asset > 0) {
          if (has_asset == 2) {
            _attributeSelected[1].has_asset = true;
          }
        } else {
          _attributeSelected[0].has_asset = true;
        }
      }

      setAttributesSelected(_attributeSelected)
      setProductAttributeFiles(_productAttributeFiles)

      if (has_asset == 0) {
        _attributeValueForm['no-attribute-assets'] = true
      }

      let price = productCreated?.sme_catalog_product_by_pk.price || undefined

      let _variant = productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.find(variant => !variant?.variant_unit && variant?.product_status_id == null) || {}
      if (_attributeSelected.length == 0) {
        price = _variant?.price // Neu sản phẩm không có pl, thì price là price của variant đầu tiên
      };
      const originStockOnHand = smeCatalogStores?.reduce(
        (result, store) => {
          const findedInventory = _variant?.inventories?.find(item => item?.sme_store_id == store?.value);
          result[`${store?.value}-stockOnHand`] = findedInventory?.stock_actual;
          result[`${store?.value}-stockActual`] = findedInventory?.stock_actual;
          result[`${store?.value}-stockReserve`] = findedInventory?.stock_reserve;
          result[`${store?.value}-stockPreallocate`] = findedInventory?.stock_preallocate;
          result[`${store?.value}-stockAvailable`] = findedInventory?.stock_available;
          result[`${store?.value}-stockAllocated`] = findedInventory?.stock_allocated;
          result[`${store?.value}-stockShipping`] = findedInventory?.stock_shipping;

          return result;
        }, {}
      )

      _attributeValueForm = {
        ..._attributeValueForm,
        ...originStockOnHand,
        // origin_price: _variant.price,
        // origin_stockOnHand: _variant.stock_on_hand,
        origin_sku: String(_variant?.sku),
        origin_id: String(_variant?.id)
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
      let statusVariantArray = []
      let inventoryStatusVariant = productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.forEach(item => {
        return item?.inventories?.forEach((iven) => {
          statusVariantArray.push({...iven, sku: item.sku, sme_variant_id: item.id})
        })
      })

      console.log('============', productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants)
      return {
        inventoryStatusVariant: statusVariantArray,
        name: productCreated?.sme_catalog_product_by_pk.name,
        seoName: productCreated?.sme_catalog_product_by_pk.name_seo,
        is_lot: productCreated?.sme_catalog_product_by_pk.is_lot,
        serial_type: productCreated?.sme_catalog_product_by_pk.serial_type,
        is_expired_date: productCreated?.sme_catalog_product_by_pk.is_expired_date,
        catalog_category_id: productCreated?.sme_catalog_product_by_pk.catalog_category_id,
        sku: productCreated?.sme_catalog_product_by_pk.sku || '',
        brand_name: productCreated?.sme_catalog_product_by_pk?.brand_name || '',
        stockOnHand: (!!productCreated?.sme_catalog_product_by_pk.stock_on_hand || productCreated?.sme_catalog_product_by_pk.stock_on_hand == 0) ? productCreated?.sme_catalog_product_by_pk.stock_on_hand : undefined,
        price: (smeVariantsMain?.length == 1 && !smeVariantsMain[0]?.attributes?.length) ? price : undefined,
        costPrice: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.find(variant => !variant?.product_status_id && !variant?.variant_unit)?.cost_price || undefined,
        priceMinimum: (smeVariantsMain?.length == 1 && !smeVariantsMain[0]?.attributes?.length) ? productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.find(variant => !variant?.product_status_id && !variant?.variant_unit)?.price_minimum : undefined,
        stockWarning: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.find(variant => !variant?.product_status_id && !variant?.variant_unit)?.stock_warning,
        unit: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.find(variant => !variant?.product_status_id)?.unit,
        // vatRate: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.find(variant => !variant?.variant_unit)?.vat_rate,
        [`main-unit`]: productCreated?.sme_catalog_product_by_pk?.is_multi_unit ? main_unit_name : '',
        [`switch-unit`]: !!productCreated?.sme_catalog_product_by_pk?.is_multi_unit,
        [`edit-switch-unit`]: !!productCreated?.sme_catalog_product_by_pk?.is_multi_unit,
        ...variantsUnit,
        ...(_attributeSelected.length == 0 ? {
          gtin: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.find(variant => !variant?.variant_unit && variant?.product_status_id == null)?.gtin || productCreated?.sme_catalog_product_by_pk.sku || undefined,
        } : {}),
        has_attributes: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.length > 0 && productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.find(variant => !variant?.variant_unit)?.attributes.length > 0,
        is_disabled_add_variant: (productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants || [])?.some(
          _variant => _variant?.inventory?.stock_actual > 0
        ),
        is_has_sell_info: productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.length > 0 && productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.find(variant => !variant?.variant_unit && variant?.product_status_id == null)?.attributes.length > 0,
        has_order: !!productCreated?.sme_catalog_product_by_pk?.has_order,
        product_tags: tags,
        video_url: productCreated?.sme_catalog_product_by_pk.video_url || '',
        origin_stock: originStock,
        ...descriptionObj,
        ..._disableFields,
        height: logistics?.size_height || undefined,
        length: logistics?.size_length || undefined,
        width: logistics?.size_width || undefined,
        weight: logistics?.weight,
        ...properties,
        ..._attributeValueForm,
        description_extend,
        expireTime: +productCreated?.sme_catalog_product_by_pk?.expired_warning_days,
        stopSellingTime: +productCreated?.sme_catalog_product_by_pk?.expired_stop_sale_days,
        outboundType: productCreated?.sme_catalog_product_by_pk?.outbound_method
      }
    }
    return {}
  }, [productCreated?.sme_catalog_product_by_pk, completedQuery, smeCatalogStores])

  const isSyncVietful = useMemo(() => {
    return productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.some(
         (variant) => variant.provider_links?.length > 0 && variant.provider_links?.some(provider => provider?.provider_code == 'vietful' && !provider?.sync_error_msg)
       );    
 }, [productCreated])

 const syncedVariants = useMemo(() => {
  return productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.filter(
       (variant) => variant.provider_links?.length > 0 && variant.provider_links?.some(provider => provider?.provider_code == 'vietful' && !provider?.sync_error_msg)
     );    
}, [productCreated])

const syncedUnitVariants = useMemo(() => {
  return productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.filter(
       (variant) => !variant?.product_status_id &&  syncedVariants?.map(item => item?.id)?.includes(variant?.variant_unit?.main_variant_id))    
}, [productCreated])

  const selectedTab = useMemo(
    () => {
      let path = history?.location?.pathname || '';

      if (String(path).endsWith('/affiliate')) {
        return 1;
      }
      return 0;
    }, [history.location.pathname]
  );

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

  if (!!error || (!!completedQuery && !loadingDetail && !productCreated?.sme_catalog_product_by_pk?.sme_catalog_product_variants?.length)) {
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

  const onShowProductConnect = () => {
    setIdsProductsConnected(productCreated?.sme_catalog_product_by_pk?.scProductMapping?.map(_scProduct => _scProduct.sc_product_id))
    setSmeProductIdSelect(match.params.id)
  }

  const _buildInfoProductEdit = () => {
    return (
      <Formik
        initialValues={initialValues}
        validationSchema={Yup.object().shape(productEditSchema)}
        enableReinitialize={true}
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

              <ProductNewInfo history={history}
                isSyncVietful={isSyncVietful}
                syncedVariants={[...syncedVariants, ...syncedUnitVariants]}
                refetch={refetch}
                formikProps={formikProps}
                setIdProductCreated={setIdProductCreated}
                productCreated={productCreated?.sme_catalog_product_by_pk || null}
              />
            </>
          }
        }
      </Formik>
    )
  };

  const _buildProductAffiliateEdit = () => {
    return <ProductAffiliate />
  };

  const dataTab = [
    {
      id: 1,
      link: `/products/edit/${match?.params?.id}`,
      title: formatMessage({ defaultMessage: 'THÔNG TIN SẢN PHẨM KHO' }),
      component: _buildInfoProductEdit()
    },
    {
      id: 2,
      link: `/products/edit/${match?.params?.id}/affiliate`,
      title: formatMessage({ defaultMessage: 'SẢN PHẨM LIÊN KẾT' }),
      component: _buildProductAffiliateEdit()
    },
  ];

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
                !!imgAssets && <HoverImage defaultSize={{ width: 50, height: 50 }} size={{ width: 320, height: 320 }} url={imgAssets?.asset_url} />
              }
            </div>
            <div className="w-100">
              <InfoProduct
                name={productCreated?.sme_catalog_product_by_pk?.name}
                sku={productCreated?.sme_catalog_product_by_pk?.sku}
                url={`#`}
              />

              {/* <span onClick={() => {
                onShowProductConnect()
              }} role="button" className="text-primary mt-2">{productCreated?.sme_catalog_product_by_pk?.scProductMapping?.length} liên kết</span> */}
              <AuthorizationWrapper keys={["product_store_connect_view"]}>
              <span
                className={`${productCreated?.sme_catalog_product_by_pk?.scProductMapping?.length ? 'text-primary cursor-pointer' : "text-secondary-custom"} ` + 'fs-12'}
                onClick={() => {
                  if(user?.is_subuser && !['product_store_connect_view']?.some(key => user?.permissions?.includes(key))) {
                    return
                  }
                  if (productCreated?.sme_catalog_product_by_pk?.scProductMapping?.length === 0) return;
                  onShowProductConnect()

                }}
              >
                {productCreated?.sme_catalog_product_by_pk?.scProductMapping?.length || 0} {formatMessage({ defaultMessage: 'liên kết' })}
              </span>
              </AuthorizationWrapper>
            </div>
          </div>
          {/* <ul className="nav">
            {
              dataTab.map(
                (_tab, index) => (
                  <li className="nav-item" key={`tab-product-edit-${index}`}>
                    <a
                      className={`nav-link ${selectedTab === index ? 'active' : ''}`}
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
          </ul> */}
        </CardBody>
      </Card>
      {/* {dataTab[selectedTab].component} */}
      {_buildInfoProductEdit()}
    </>
  );
}
