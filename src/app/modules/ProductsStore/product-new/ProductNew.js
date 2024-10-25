/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import { Formik } from "formik";
import React, { useState, useEffect, useMemo } from "react";
import { useProductsUIContext } from "../ProductsUIContext";
import { useSubheader } from "../../../../_metronic/layout/_core/MetronicSubheader";
import { ProductNewInfo } from "./ProductNewInfo";
import * as Yup from "yup";
import { useQuery } from "@apollo/client";
import query_sme_catalog_product_by_pk from "../../../../graphql/query_sme_catalog_product_by_pk";
import useUnsavedChangesWarning from "../../../../hooks/useUnsavedChangesWarning";
import { RouterPrompt } from "../../../../components/RouterPrompt";
import ProductSelectSME from "./ProductSelectSME";
import { ATTRIBUTE_VALUE_TYPE } from "../ProductsUIHelpers";
import _ from 'lodash'
import { Modal } from "react-bootstrap";
import query_scGetLogisticChannelByChannel from "../../../../graphql/query_scGetLogisticChannelByChannel";
import { Link } from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import htmlToDraft from 'html-to-draftjs';
import { useIntl } from 'react-intl';
import ProductSelectAttributeSME from "./ProductSelectAttributeSME";

export function ProductNew({
  history,
}) {
  const { formatMessage } = useIntl();
  const {
    categorySelected,
    resetAll,
    productEditSchema,
    smeProduct,
    currentChannel,
    scWarehouses,
    setProductFiles,
    setProductVideFiles,
    setCustomAttributes,
    setProductAttributeFiles,
    setAttributesSelected,
    setSmeProduct, setCurrentChannel,
    setProductSizeChart,
    setProductImageOrigin,
    setspecial_type,
    isCheckMapAttribute,
    creationMethod,
    smeCatalogStores
  } = useProductsUIContext();
  const [waittingInit, setWaittingInit] = useState(!!categorySelected)
  const { setBreadcrumbs } = useSubheader()
  const [messShowAlertLogistic, setMessShowAlertLogistic] = useState('')

  const { data: productCreated } = useQuery(query_sme_catalog_product_by_pk, {
    variables: {
      id: history?.location?.state?.idProductCreated,
      skip: !history?.location?.state?.idProductCreated,

    },
    fetchPolicy: 'cache-and-network',
  })

  const { data: dataLogistic, loading: loadingLogistic } = useQuery(query_scGetLogisticChannelByChannel, {
    variables: {
      connector_channel_code: history?.location?.state?.channel?.connector_channel_code,
      store_id: history?.location?.state?.channel?.value
    },
    fetchPolicy: 'network-only',
    skip: !history?.location?.state?.idProductCreated
  })

  useEffect(() => {
    if (!!history?.location?.state?.idProductCreated && !loadingLogistic && history?.location?.state?.channel?.connector_channel_code == 'shopee' && !dataLogistic?.scGetLogisticChannel?.logistics?.some(_logisticGroup => !!_logisticGroup.shop_enabled)) {
      setMessShowAlertLogistic(dataLogistic?.scGetLogisticChannel?.message)
    }
  }, [dataLogistic, loadingLogistic, history?.location?.state?.idProductCreated, history?.location?.state?.channel?.connector_channel_code])

  useEffect(() => {
    if (!!productCreated?.sme_catalog_product_by_pk) {
      setSmeProduct(productCreated?.sme_catalog_product_by_pk)
      setCurrentChannel(history?.location?.state?.channel)
    }
  }, [productCreated, history?.location?.state?.channel])

  useEffect(() => {
    if (!!currentChannel) {
      setspecial_type(currentChannel.special_type || 0)
    }
  }, [currentChannel])

  useEffect(() => {
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
      document.removeEventListener('keypress', listener)
    }
  }, [])

  useEffect(() => {
    resetAll()
    setWaittingInit(true)
    console.log('history.location.state1', history.location.state)
    return () => resetAll()
  }, [history.location.state])
  // console.log('history.location.state', history.location.state, waittingInit, smeProduct)
  // console.log('productCreated', productCreated)

  useMemo(() => {
    // setDirty(true)
    if (waittingInit) {
      setTimeout(() => {
        setWaittingInit(false)
      }, 100);
    }
  }, [waittingInit])

  const _initialValues = useMemo(() => {
    console.log(`>>>>INITIAL VALUES>>>>`, scWarehouses, smeProduct, currentChannel, smeCatalogStores);
    // if (!!smeProduct) {

    const smeStoreIdDefault = smeCatalogStores?.find(store => !!store?.isDefault)?.value;
    let logistics = !!smeProduct?.sme_catalog_product_ship_package_infos ? smeProduct?.sme_catalog_product_ship_package_infos[0] : null;
    let properties = {};
    setProductFiles(_.sortBy((smeProduct?.sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 0), 'position_show').map(_asset => {
      return {
        id: _asset.id,
        source: _asset.asset_url,
        source_draft: _asset.asset_url,
      }
    }));

    let videoFileProduct = _.sortBy((smeProduct?.sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 1), 'position_show').map(_asset => {
      return {
        id: _asset.asset_id,
        source: _asset.asset_url
      }
    });

    setProductVideFiles(videoFileProduct);

    let sizeCharts = (smeProduct?.sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 2).map(_asset => {
      return {
        id: _asset.asset_id,
        source: _asset.asset_url,
        sme_id: _asset.id
      }
    })
    if (sizeCharts.length > 0) {
      setProductSizeChart(sizeCharts[0]);
    }


    let imageOrigin = (smeProduct?.sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 3).map(_asset => {
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

    let _customAttributes = (smeProduct?.sme_catalog_product_attributes_custom || []).map(_attribute => {
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
      ['disable-edit-attribute']: false
    };


    (smeProduct?.sme_catalog_product_variants?.filter(variant => !variant?.variant_unit && !variant?.product_status_id) || []).forEach(_variant => {
      let codes = [];

      _.sortBy((_variant.attributes || []), ___atttibute => (___atttibute?.product_attribute_value_id || 0)).forEach((_attribute, ___index) => {
        codes.push(_attribute.sme_catalog_product_attribute_value.ref_index);

        _attributeValueForm = {
          ..._attributeValueForm,
          [`att-${_attribute.sme_catalog_product_attribute_value.product_attribute_custom_id || _attribute.sme_catalog_product_attribute_value.product_attribute_id}-${_attribute.sme_catalog_product_attribute_value.ref_index}`]: _attribute.sme_catalog_product_attribute_value.name,
          [`att-${_attribute.sme_catalog_product_attribute_value.product_attribute_custom_id || _attribute.sme_catalog_product_attribute_value.product_attribute_id}-${_attribute.sme_catalog_product_attribute_value.ref_index}-editing`]: true, //field dung de disable khong cho xoá khi sửa sp
        }

        if (!_productAttributeFiles[_attribute.sme_catalog_product_attribute_value.ref_index]) {
          let sortAttributeAssets = _.sortBy((_attribute.sme_catalog_product_attribute_value.assets || []), 'position_show');
          let variantAssets = currentChannel?.connector_channel_code != 'lazada' ? sortAttributeAssets?.slice(0, 1) : sortAttributeAssets;
          _productAttributeFiles = {
            ..._productAttributeFiles,
            [_attribute.sme_catalog_product_attribute_value.ref_index]: {
              files: variantAssets.map(_asset => {
                return {
                  id: _asset.asset_id,
                  source: _asset.asset_url
                }
              }),
              attribute_value: _attribute.sme_catalog_product_attribute_value.name,
              attribute_id: _attribute.sme_catalog_product_attribute_value.product_attribute_custom_id || _attribute.sme_catalog_product_attribute_value.product_attribute_id,
              isCustom: false
            }
          }
        }

        let hasNew = true;
        _attributeSelected = _attributeSelected.map(_att => {

          if (!!_attribute.sme_catalog_product_attribute_value.sme_catalog_product_custom_attribute) {
            if (_att.isCustom && _att.id == _attribute.sme_catalog_product_attribute_value.sme_catalog_product_custom_attribute.id) {
              hasNew = false;
              return {
                ..._att,
                sme_variant_attribute_id: _att.id,
                sme_variant_attribute_name: _att.display_name,
                values: (_att.values.some(_vvv => _vvv.code == _attribute.sme_catalog_product_attribute_value.ref_index) ? _att.values : _att.values.concat([{
                  v: _attribute.sme_catalog_product_attribute_value.name,
                  id: _attribute.sme_catalog_product_attribute_value.id,
                  code: _attribute.sme_catalog_product_attribute_value.ref_index,
                  position: _attribute.sme_catalog_product_attribute_value.position || 0,
                }])).map(_vvv => {
                  return {
                    ..._vvv,
                    sme_variant_attribute_value_id: !!_vvv.id ? String(_vvv.id) : null,
                    sme_variant_attribute_value_name: _vvv.v,
                  }
                })
              }
            }
            return _att;
          }
          if (!_att.isCustom && _att.id == _attribute.sme_catalog_product_attribute_value.op_catalog_product_attribute.id) {
            hasNew = false;
            return {
              ..._att,
              values: (_att.values.some(_vvv => _vvv.code == _attribute.sme_catalog_product_attribute_value.ref_index) ? _att.values : _att.values.concat([{
                id: _attribute.sme_catalog_product_attribute_value.id,
                v: _attribute.sme_catalog_product_attribute_value.name,
                code: _attribute.sme_catalog_product_attribute_value.ref_index,
                position: _attribute.sme_catalog_product_attribute_value.position || 0,
              }])).map(_vvv => {
                return {
                  ..._vvv,
                  sme_variant_attribute_value_id: !!_vvv.id ? String(_vvv.id) : null,
                  sme_variant_attribute_value_name: _vvv.v,
                }
              })
            }
          }
          return _att;
        })

        if (hasNew) {
          if (!!_attribute.sme_catalog_product_attribute_value.op_catalog_product_attribute) {
            _attributeSelected.push({
              ..._attribute.sme_catalog_product_attribute_value.op_catalog_product_attribute,
              sme_variant_attribute_id: _attribute.sme_catalog_product_attribute_value.op_catalog_product_attribute.id,
              sme_variant_attribute_name: _attribute.sme_catalog_product_attribute_value.op_catalog_product_attribute.display_name,
              values: [{
                v: _attribute.sme_catalog_product_attribute_value.name,
                id: _attribute.sme_catalog_product_attribute_value.id,
                code: _attribute.sme_catalog_product_attribute_value.ref_index,
                position: _attribute.sme_catalog_product_attribute_value.position || 0,
              }].map(_vvv => {
                return {
                  ..._vvv,
                  sme_variant_attribute_value_id: !!_vvv.id ? String(_vvv.id) : null,
                  sme_variant_attribute_value_name: _vvv.v,
                }
              })
            })

          }
          if (!!_attribute.sme_catalog_product_attribute_value.sme_catalog_product_custom_attribute) {
            _attributeSelected.push({
              ..._attribute.sme_catalog_product_attribute_value.sme_catalog_product_custom_attribute,
              sme_variant_attribute_id: _attribute.sme_catalog_product_attribute_value.sme_catalog_product_custom_attribute.id,
              sme_variant_attribute_name: _attribute.sme_catalog_product_attribute_value.sme_catalog_product_custom_attribute.display_name,
              input_type: ATTRIBUTE_VALUE_TYPE.TEXT,
              isCustom: true,
              values: [{
                v: _attribute.sme_catalog_product_attribute_value.name,
                id: _attribute.sme_catalog_product_attribute_value.id,
                code: _attribute.sme_catalog_product_attribute_value.ref_index,
                position: _attribute.sme_catalog_product_attribute_value.position || 0,
              }].map(_vvv => {
                return {
                  ..._vvv,
                  sme_variant_attribute_value_id: !!_vvv.id ? String(_vvv.id) : null,
                  sme_variant_attribute_value_name: _vvv.v,
                }
              })
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

      const stockOnHandSmeVariant = _variant?.inventories?.find(iv => !!iv?.sme_store?.is_default)?.stock_actual;
      const warehouseInventories = scWarehouses?.reduce(
        (result, wh) => {
          result[`variant-${codes}-${wh?.value}-stockOnHand`] = wh?.isDefault
            ? stockOnHandSmeVariant
            : 0;

          return result;
        }, {}
      );

      _attributeValueForm = {
        ..._attributeValueForm,
        ...warehouseInventories,
        [`variant-${codes}-price`]: _variant.price,
        [`variant-${codes}-priceMinimum`]: _variant.price_minimum,
        [`variant-${codes}-sku`]: _variant.sku,
        [`variant-${codes}-stockOnHand`]: stockOnHandSmeVariant,
        [`variant-${codes}-visible`]: (_variant.status == 10),
        [`variant-${codes}-sme_product_variant_id`]: _variant.id,
        [`variant-noattribute-sme_product_variant_id`]: codes.length == 0 ? _variant.id : undefined,
      }

      _disableFields = {
        ..._disableFields,
        [`disable-sku-${codes}`]: true
      }

    });

    console.log('smeProduct', smeProduct)


    _customAttributes = _customAttributes.map(_att => {
      if (Object.values(_productAttributeFiles).some(_file => _file.attribute_id == _att.id && _file.files?.length > 0)) {
        return {
          ..._att,
          has_asset: true
        }
      }
      return _att
    })
    if (_customAttributes.length > 0) {
      if (!_customAttributes.some(_att => !!_att.has_asset)) {
        _customAttributes[0].has_asset = true;
      }
    }
    setCustomAttributes(_customAttributes)

    _attributeSelected = _attributeSelected.map(_att => {
      _att.values.forEach(_value => {
        _disableFields = {
          ..._disableFields,
          [`disable-att-value-${_att.id}-${_value.code}`]: true,
          [`disable-att-value-${_att.id}`]: true
        }
      });

      if (Object.values(_productAttributeFiles).some(_file => _file.attribute_id == _att.id && _file.files?.length > 0)) {
        return {
          ..._att,
          has_asset: true
        }
      }
      return _att
    })

    if (_attributeSelected.length > 0) {
      if (!_attributeSelected.some(_att => !!_att.has_asset)) {
        _attributeSelected[0].has_asset = true;
      }
    }
    setAttributesSelected(_attributeSelected)


    setProductAttributeFiles(_productAttributeFiles)

    if (_attributeSelected.length == 0) {
      const stockOnHandSmeVariant = smeProduct?.sme_catalog_product_variants[0]?.inventories?.find(iv => !!iv?.sme_store?.is_default)?.stock_actual;

      const warehouseInventories = scWarehouses?.reduce(
        (result, wh) => {
          result[`${wh?.value}-stockOnHand`] = wh?.isDefault
            ? stockOnHandSmeVariant
            : 0;

          return result;
        }, {}
      );
      _attributeValueForm = {
        ..._attributeValueForm,
        ...warehouseInventories,
        origin_price: smeProduct?.price,
        origin_stockOnHand: smeProduct?.stock_on_hand,
        // origin_sku: String(smeProduct?.sku),
      }
    }

    let descriptionObj = {
      description: ((currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok') ? smeProduct?.description : smeProduct?.description_short) || '',
      description_html: smeProduct?.description_html || '',
      description_html_init: smeProduct?.description_html || '',
      description_short: smeProduct?.description_short || '',
      description_short_init: smeProduct?.description_short || '',
    }

    let description_extend = EditorState.createEmpty()
    if (smeProduct?.description_extend) {
      try {
        let obj = JSON.parse(smeProduct?.description_extend)
        if (obj.length == 0) {
          throw Error('empty')
        }
        let hasItem = false;
        const blocksFromHtml = htmlToDraft(_.flatten(obj.map(__ => {
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
        try {
          const blocksFromHtml = htmlToDraft(`<p>${smeProduct?.description || ""}</p>`);
          const contentState = ContentState.createFromBlockArray(blocksFromHtml.contentBlocks, blocksFromHtml.entityMap);
          description_extend = EditorState.createWithContent(contentState)
        } catch (error) {

        }
      }
    } else {
      try {
        const blocksFromHtml = htmlToDraft(`<p>${smeProduct?.description || ""}</p>`);
        const contentState = ContentState.createFromBlockArray(blocksFromHtml.contentBlocks, blocksFromHtml.entityMap);
        description_extend = EditorState.createWithContent(contentState)
      } catch (error) {

      }
    }

    let product_tags = smeProduct?.tags?.map(
      (_tag) => {
        let { title } = _tag?.tag
        return {
          value: title,
          label: title,
          __isNew__: true
        }
      }
    ) || [];

    const origin_warehouse = scWarehouses?.find(wh => wh?.isDefault);

    if (currentChannel) {
      return {
        channel_code: currentChannel?.connector_channel_code,
        name: smeProduct?.name_seo,
        seoName: smeProduct?.name_seo,
        sku: smeProduct?.sku || '',
        stockOnHand: smeProduct?.is_combo
          ? Math.min(
            ...smeProduct?.combo_items?.map(_combo => {
              const amountStockActualDefaultWh = _combo?.combo_item?.inventories?.find(inventory => inventory?.sme_store_id == smeStoreIdDefault)?.stock_actual
              return Math.floor(amountStockActualDefaultWh / _combo?.quantity)
            })
          )
          : (smeProduct?.sme_catalog_product_variants[0]?.inventories?.find(iv => iv?.sme_store_id == smeStoreIdDefault)?.stock_actual || 0),
        origin_sku: smeProduct?.sme_catalog_product_variants?.[0]?.attributes?.length == 0 ? smeProduct?.sme_catalog_product_variants?.[0]?.sku : '',
        price: smeProduct?.price || '',
        price_minimum: smeProduct?.sme_catalog_product_variants?.[0]?.attributes?.length == 0 ? smeProduct?.sme_catalog_product_variants?.[0]?.price_minimum : '',
        video_url: smeProduct?.video_url || '',
        origin_warehouse,
        ...(currentChannel.connector_channel_code === 'lazada' ? {
          type_video: (videoFileProduct?.length > 0 || !smeProduct?.video_url) ? 'video' : 'url',
        } : {}),
        enable_multi_warehouse: currentChannel?.enable_multi_warehouse,
        has_attributes: smeProduct?.sme_catalog_product_variants?.length > 0 && smeProduct?.sme_catalog_product_variants?.[0]?.attributes?.length > 0,
        is_has_sell_info: smeProduct?.sme_catalog_product_variants?.length > 0 && smeProduct?.sme_catalog_product_variants?.[0]?.attributes?.length > 0,
        is_sell_info: smeProduct?.sme_catalog_product_variants?.length > 0,
        is_cod_open: true,
        product_tags,
        ...descriptionObj,
        height: (currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok') ? Math.round(logistics?.size_height || 0) : (logistics?.size_height || 0),
        length: (currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok') ? Math.round(logistics?.size_length || 0) : (logistics?.size_length || 0),
        width: (currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok') ? Math.round(logistics?.size_width || 0) : (logistics?.size_width || 0),
        weight: (currentChannel?.connector_channel_code == 'shopee' || currentChannel?.connector_channel_code == 'tiktok') ? Math.round(logistics?.weight || 0) : (logistics?.weight || 0),
        ...properties,
        ..._attributeValueForm,
        ..._disableFields,
        description_extend,
        __changed__: true
      }
    }


    // }

    return null
  }, [currentChannel, smeProduct, creationMethod, smeCatalogStores, scWarehouses])


  if (waittingInit || (!!history?.location?.state?.channel && !!history?.location?.state?.idProductCreated && !smeProduct)) {
    return (
      <div className="row" data-sticky-container style={{ justifyContent: 'center', alignItems: 'center' }} >
        <span className="spinner spinner-primary" style={{ marginTop: 20 }} ></span>
      </div>
    )
  }

  if (!smeProduct && creationMethod == 0) {
    return <>
      <Helmet
        titleTemplate={`${formatMessage({ defaultMessage: 'Thêm sản phẩm sàn' })} - UpBase`}
        defaultTitle={`${formatMessage({ defaultMessage: 'Thêm sản phẩm sàn' })} - UpBase`}
      >
        <meta name="description" content={`${formatMessage({ defaultMessage: 'Thêm sản phẩm sàn' })} - UpBase`} />
      </Helmet>
      <ProductSelectSME setMessShowAlertLogistic={setMessShowAlertLogistic} />

      <Modal
        show={messShowAlertLogistic.length > 0}
        aria-labelledby="example-modal-sizes-title-sm"
        centered
      >
        <Modal.Body className="overlay overlay-block cursor-default" style={{ textAlign: 'center' }}  >
          <span>{messShowAlertLogistic}</span>
        </Modal.Body>
        <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
          <div className="form-group">
            <button
              type="button"
              onClick={() => { setMessShowAlertLogistic('') }}
              className="btn btn-light btn-elevate mr-3"
              style={{ width: 120 }}
            >
              {formatMessage({ defaultMessage: 'HỦY BỎ' })}
            </button>
            <Link className="btn btn-primary" style={{ width: 120 }} to='/setting/channels' >{formatMessage({ defaultMessage: 'KẾT NỐI LẠI' })}</Link>
          </div>
        </Modal.Footer>
      </Modal >
    </>
  }

  if (!_initialValues) {
    return null
  }
  return (
    <>
      <Helmet
        titleTemplate={`${formatMessage({ defaultMessage: 'Thêm sản phẩm sàn' })} - UpBase`}
        defaultTitle={`${formatMessage({ defaultMessage: 'Thêm sản phẩm sàn' })} - UpBase`}
      >
        <meta name="description" content={`${formatMessage({ defaultMessage: 'Thêm sản phẩm sàn' })} - UpBase`} />
      </Helmet>
      <Formik
        initialValues={_initialValues}
        validationSchema={Yup.object().shape(productEditSchema, [['length', 'height'], ['width', 'length'], ['width', 'height']])}
        enableReinitialize
      >
        {
          (formikProps) => {
            console.log({ formikProps })
            const changed = formikProps.values['__changed__']
            return <>
              <RouterPrompt
                when={changed}
                title={formatMessage({ defaultMessage: "Bạn đang tạo sản phẩm. Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?" })}
                cancelText={formatMessage({ defaultMessage: "KHÔNG" })}
                okText={formatMessage({ defaultMessage: "CÓ, THOÁT" })}
                onOK={() => true}
                onCancel={() => false}
              />
              {(!isCheckMapAttribute && creationMethod == 0) ? (
                <ProductSelectAttributeSME
                  setTouched={formikProps.setTouched}
                />
              ) : (
                <ProductNewInfo history={history}
                  formikProps={formikProps}
                />
              )}
            </>
          }
        }
      </Formik>
      <Modal
        show={messShowAlertLogistic}
        aria-labelledby="example-modal-sizes-title-sm"
        centered
      >
        <Modal.Body className="overlay overlay-block cursor-default" style={{ textAlign: 'center' }}  >
          <span>{formatMessage({ defaultMessage: 'Vui lòng cài đặt phương thức vận chuyển trước khi tạo sản phẩm' })}</span>
        </Modal.Body>
        <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
          <div className="form-group">
            <button
              type="button"
              onClick={() => {
                if (!!history?.location?.state?.idProductCreated) {
                  history.push('/product-stores/list')
                  return
                }
                setMessShowAlertLogistic('')
              }}
              className="btn btn-light btn-elevate mr-3"
              style={{ width: 120 }}
            >
              {formatMessage({ defaultMessage: 'HỦY BỎ' })}
            </button>
            <a
              type="button"
              className="btn btn-primary btn-elevate"
              style={{ width: 120 }}
              href={'https://banhang.shopee.vn/portal/settings/shop/logistics'}
            >
              {formatMessage({ defaultMessage: 'CÀI ĐẶT NGAY' })}
            </a>
          </div>
        </Modal.Footer>
      </Modal >
    </>
  );
}
