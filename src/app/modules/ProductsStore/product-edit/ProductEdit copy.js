import { Form, Formik, useFormikContext } from "formik";
import React, { useState, useRef, useMemo, useEffect } from "react";
import { shallowEqual, useSelector } from "react-redux";
import { Card, CardBody, ModalProgressBar } from "../../../../_metronic/_partials/controls";
import ProductBasicInfo from "../product-basic-info";
import ProductChannels from '../product-channel'
import * as Yup from "yup";
import ProductAttributes from "../product-properties";
import ProductSellInfo from "../product-sell-info";
import { useProductsUIContext } from "../ProductsUIContext";
import ProductImages from "../product-images";
import ProductDescription from "../product-description";
import ProductShipping from "../product-shipping";
import ProductWarranty from "../product-warranty";
import { FormattedMessage, useIntl } from "react-intl";
import { Element, Link, animateScroll } from 'react-scroll';
import { ATTRIBUTE_VALUE_TYPE, validatePriceVariant } from "../ProductsUIHelpers";
import LoadingDialog from "./LoadingDialog";
import { useMutation, useQuery } from "@apollo/client";

import _ from 'lodash'

import productUpdate from '../../../../graphql/mutate_productUpdate'
import sme_catalog_product_by_pk from '../../../../graphql/query_sme_catalog_product_by_pk'
import { Redirect } from "react-router-dom";
import { useSubheader } from "../../../../_metronic/layout";
import { randomString } from "../../../../utils";
import { WARRANTY_TIME, WARRANTY_TYPE } from "../../../../constants";

const Sticky = require('sticky-js');

export function ProductEdit({
  history,
  match,
}) {


  const { setBreadcrumbs } = useSubheader();
  const { data, loading: loadingDetail } = useQuery(sme_catalog_product_by_pk, {
    variables: {
      id: match.params.id
    }
  })
  const [update, { loading, data: dataCreate }] = useMutation(productUpdate, {
    refetchQueries: ['sme_catalog_product', 'sme_catalog_product_by_pk'],
    awaitRefetchQueries: true
  })
  const { formatMessage } = useIntl()

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
    setProductFiles,
    setProductVideFiles,
    setAttributesSelected,
    setCustomAttributes,
    setProductAttributeFiles,
    resetAll, setIsEditProduct
  } = useProductsUIContext();
  const [errorMessage, setErrorMessage] = useState("");


  useEffect(() => {
    setBreadcrumbs([
      {
        title: 'Sửa sản phẩm sàn',
        pathname: '#'
      }
    ])
    return () => resetAll()
  }, [])

  useMemo(() => {
    if (!!errorMessage) {
      animateScroll.scrollToTop();
    }
  }, [errorMessage])

  const initialValues = useMemo(() => {
    if (!!data?.sme_catalog_product_by_pk) {
      setIsEditProduct(true)
      requestAnimationFrame(() => {
        new Sticky('.sticky');

      })

      setCategorySelected(data?.sme_catalog_product_by_pk.category)

      let logistics = data?.sme_catalog_product_by_pk.sme_catalog_product_ship_package_infos[0];
      let properties = {};
      (data?.sme_catalog_product_by_pk?.sme_catalog_product_attribute_values || []).forEach(_value => {
        if (!!_value.op_catalog_product_attribute && _value.op_catalog_product_attribute.attribute_type == 0) {
          if (_value.op_catalog_product_attribute.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT) {
            properties[`upbase-property-${_value.op_catalog_product_attribute.id}`] = {
              label: _value.name,
              value: _value.name,
            }
          } else {
            properties[`upbase-property-${_value.op_catalog_product_attribute.id}`] = _value.name
          }
        }
        if (!!_value.op_catalog_product_attribute && _value.op_catalog_product_attribute.attribute_type == 2) {
          if (_value.op_catalog_product_attribute.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT) {
            properties[`warranty-${_value.op_catalog_product_attribute.id}`] = {
              label: _value.name,
              value: _value.name,
            }
          } else {
            properties[`warranty-${_value.op_catalog_product_attribute.id}`] = _value.name
          }
        }
      });
      setProductFiles((data?.sme_catalog_product_by_pk?.sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 0).map(_asset => {
        return {
          id: _asset.id,
          source: _asset.asset_url,
        }
      }));
      setProductVideFiles((data?.sme_catalog_product_by_pk?.sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 1).map(_asset => {
        return {
          id: _asset.asset_id,
          source: _asset.asset_url
        }
      }));
      let _customAttributes = (data?.sme_catalog_product_by_pk?.sme_catalog_product_attributes_custom || []).map(_attribute => {
        return {
          ..._attribute,
          input_type: ATTRIBUTE_VALUE_TYPE.TEXT,
          isCustom: true,
        }
      });
      let _attributeSelected = [];
      let _attributeValueForm = {};
      let _productAttributeFiles = {};


      (data?.sme_catalog_product_by_pk?.sme_catalog_product_variants || []).forEach(_variant => {
        let codes = [];

        (_variant.attributes || []).forEach(_attribute => {

          codes.push(_attribute.sme_catalog_product_attribute_value.ref_index);

          _attributeValueForm = {
            ..._attributeValueForm,
            [`att-${_attribute.sme_catalog_product_attribute_value.product_attribute_custom_id || _attribute.sme_catalog_product_attribute_value.product_attribute_id}-${_attribute.sme_catalog_product_attribute_value.ref_index}`]: _attribute.sme_catalog_product_attribute_value.name,
          }

          if (!_productAttributeFiles[_attribute.sme_catalog_product_attribute_value.ref_index]) {
            _productAttributeFiles = {
              ..._productAttributeFiles,
              [_attribute.sme_catalog_product_attribute_value.ref_index]: {
                files: (_attribute.sme_catalog_product_attribute_value.assets || []).map(_asset => {
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
                  values: _att.values.some(_vvv => _vvv.code == _attribute.sme_catalog_product_attribute_value.ref_index) ? _att.values : _att.values.concat([{
                    v: _attribute.sme_catalog_product_attribute_value.name,
                    code: _attribute.sme_catalog_product_attribute_value.ref_index,
                    position: _attribute.sme_catalog_product_attribute_value.position || 0,
                  }])
                }
              }
              return _att;
            }
            if (!_att.isCustom && _att.id == _attribute.sme_catalog_product_attribute_value.op_catalog_product_attribute.id) {
              hasNew = false;
              return {
                ..._att,
                values: _att.values.some(_vvv => _vvv.code == _attribute.sme_catalog_product_attribute_value.ref_index) ? _att.values : _att.values.concat([{
                  v: _attribute.sme_catalog_product_attribute_value.name,
                  code: _attribute.sme_catalog_product_attribute_value.ref_index,
                  position: _attribute.sme_catalog_product_attribute_value.position || 0,
                }])
              }
            }
            return _att;
          })

          if (hasNew) {
            if (!!_attribute.sme_catalog_product_attribute_value.op_catalog_product_attribute) {
              _attributeSelected.push({
                ..._attribute.sme_catalog_product_attribute_value.op_catalog_product_attribute,
                values: [{
                  v: _attribute.sme_catalog_product_attribute_value.name,
                  code: _attribute.sme_catalog_product_attribute_value.ref_index,
                  position: _attribute.sme_catalog_product_attribute_value.position || 0,
                }]
              })

            }
            if (!!_attribute.sme_catalog_product_attribute_value.sme_catalog_product_custom_attribute) {
              _attributeSelected.push({
                ..._attribute.sme_catalog_product_attribute_value.sme_catalog_product_custom_attribute,
                input_type: ATTRIBUTE_VALUE_TYPE.TEXT,
                isCustom: true,
                values: [{
                  v: _attribute.sme_catalog_product_attribute_value.name,
                  code: _attribute.sme_catalog_product_attribute_value.ref_index,
                  position: _attribute.sme_catalog_product_attribute_value.position || 0,
                }]
              })
            }

          }
        });


        //sort lại values trong attribute
        _attributeSelected = _attributeSelected.map(_att => {
          let newValues = [...(_att.values || [])];
          newValues.sort((_v1, _v2) => _v1.position - _v2.position)
          return {
            ..._att,
            values: newValues
          }
        });


        codes = codes.join('-')

        _attributeValueForm = {
          ..._attributeValueForm,
          [`variant-${codes}-price`]: _variant.price,
          [`variant-${codes}-sku`]: _variant.sku,
          [`variant-${codes}-stockOnHand`]: _variant.stock_on_hand,
        }

      });

      setCustomAttributes(_customAttributes)
      setAttributesSelected(_attributeSelected)
      setProductAttributeFiles(_productAttributeFiles)

      if (_attributeSelected.length == 0) {
        let _variant = data?.sme_catalog_product_by_pk?.sme_catalog_product_variants[0]
        _attributeValueForm = {
          ..._attributeValueForm,
          origin_price: _variant.price,
          origin_stockOnHand: _variant.stock_on_hand,
          origin_sku: String(_variant.sku),
        }
      }

      return {
        name: data?.sme_catalog_product_by_pk.name,
        description: data?.sme_catalog_product_by_pk.description,
        brand: {
          value: data?.sme_catalog_product_by_pk.brand.id,
          label: data?.sme_catalog_product_by_pk.brand.name
        },
        height: logistics?.size_width,
        length: logistics?.size_length,
        width: logistics?.size_width,
        weight: logistics?.weight,
        ...properties,
        ..._attributeValueForm,
        warranty_type: WARRANTY_TYPE.find(_type => _type.value == data?.sme_catalog_product_by_pk?.warranty_type),
        warranty_time: WARRANTY_TIME.find(_type => _type.value == data?.sme_catalog_product_by_pk?.warranty_time),
        warranty_policy: data?.sme_catalog_product_by_pk?.warranty_policy || '',
      }
    }
    return {}
  }, [data?.sme_catalog_product_by_pk])



  const ProductEditSchema = Yup.object().shape(productEditSchema);

  const isProductFileInValid = productFiles.some(_file => !!_file.file) //|| Objec(productAttributeFiles).some(_file => !!_file.file)

  const updateProduct = async (values, isDraft, form) => {
    console.log('values', values)

    let properties = []
    //
    let tier_variations = [];
    attributesSelected.forEach(_attribute => {
      (_attribute.values || []).forEach((_value, index) => {

        let attributeFiles = productAttributeFiles[_value.code] || { files: [] }

        tier_variations.push({
          attribute_id: String(_attribute.id),
          attribute_value: _value.v,
          isCustom: _attribute.isCustom || false,
          ref_index: _value.code,
          attribute_assets: (attributeFiles.files || []).map(_file => ({ asset_id: _file.id, url: _file.source })),
          position: index
        })
      })
    })

    let allAttributes = _.flatten((data?.sme_catalog_product_by_pk?.sme_catalog_product_variants || []).map(_variant => _variant.attributes));
    let tier_variations_delete = allAttributes.filter(_attribute => !tier_variations.some(_tier => _tier.ref_index == _attribute.sme_catalog_product_attribute_value.ref_index)).map(_attribute => _attribute.sme_catalog_product_attribute_value.id)
    //  
    let newvariants = variants.map((_variant, index) => {
      let keyAttribute = _variant.attributes.map(_att => _att.attribute_value_ref_index)
      keyAttribute.sort((a, b) => a - b)
      keyAttribute = keyAttribute.join('-')
      let lastVariant = (data?.sme_catalog_product_by_pk?.sme_catalog_product_variants || []).find(_lastVariant => {
        let lastKeyAttribute = _lastVariant.attributes.map(_att => _att.sme_catalog_product_attribute_value.ref_index)
        lastKeyAttribute.sort((a, b) => a - b)
        return lastKeyAttribute.join('-') == keyAttribute
      })
      return {
        attributes: _variant.attributes,
        price: values[`variant-${_variant.code}-price`],
        stockOnHand: values[`variant-${_variant.code}-stockOnHand`],
        sku: values[`variant-${_variant.code}-sku`],
        position: index,
        id: lastVariant?.id
      }
    });
    //
    if (newvariants.length == 0) {
      newvariants.push({
        price: values['origin_price'],
        stockOnHand: values['origin_stockOnHand'],
        sku: values['origin_sku'],
        attributes: [],
        position: 0
      })
    }
    //
    let custom_attributes = attributesSelected.filter(_attribute => _attribute.isCustom).map(_attribute => {
      return {
        name: _attribute.name,
        display_name: _attribute.display_name,
        options: (_attribute.values || []).map(_value => _value.v),
        ref_index: String(_attribute.id)
      }
    })
    let custom_attributes_delete = (data?.sme_catalog_product_by_pk?.sme_catalog_product_attributes_custom || []).filter(_attribute => {
      return !custom_attributes.some(_att => _attribute.id == _att.ref_index)
    }).map(_attribute => _attribute.id);
    //
    // let warranties = warrantiesList.map(_warranty => {
    //   if (!values[`warranty-${_warranty.id}`]) {
    //     return null
    //   }
    //   if (_warranty.input_type == ATTRIBUTE_VALUE_TYPE.TEXT || _warranty.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC) {
    //     return {
    //       attribute_id: String(_warranty.id),
    //       ref_index: String(_warranty.id),
    //       attribute_value: values[`warranty-${_warranty.id}`],
    //       isCustom: false,
    //       attribute_assets: []
    //     }
    //   }
    //   if (_warranty.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT) {
    //     return {
    //       attribute_id: String(_warranty.id),
    //       ref_index: String(_warranty.id),
    //       attribute_value: values[`warranty-${_warranty.id}`].value,
    //       isCustom: false,
    //       attribute_assets: []
    //     }
    //   }
    // }).filter(_warranty => !!_warranty)

    //
    let logistics = data?.sme_catalog_product_by_pk.sme_catalog_product_ship_package_infos[0];
    //
    let product_assets_delete = (data?.sme_catalog_product_by_pk?.sme_catalog_product_assets || []).filter(_assets => {
      return !productFiles.some(_file => _file.id == _assets.id) && !productVideFiles.some(_file => _file.id == _assets.id)
    }).map(_assets => _assets.id);
    //
    const warranty = {
      warranty_policy: values['warranty_policy'],
      warranty_time: !!values['warranty_time'] ? values['warranty_time'].value : null,
      warranty_type: !!values['warranty_type'] ? values['warranty_type'].value : null
    }

    let product_images = productFiles.filter(_file => !product_assets_delete.some(_id => _id == _file.id) && !(data?.sme_catalog_product_by_pk?.sme_catalog_product_assets || []).some(_assets => {
      return _file.id == _assets.id
    })).map(_file => ({ asset_id: _file.id, url: _file.source }));
    let product_videos = productVideFiles.filter(_file => !product_assets_delete.some(_id => _id == _file.id) && !(data?.sme_catalog_product_by_pk?.sme_catalog_product_assets || []).some(_assets => {
      return _file.id == _assets.id
    })).map(_file => ({ asset_id: _file.id, url: _file.source }));



    let validVariant = validatePriceVariant(newvariants)
    if (!!validVariant) {
      setErrorMessage(formatMessage({ defaultMessage: "Khoảng giá chênh lệch giữa các phân loại không được vượt quá 5 lần" }))
      return
    } else {
      setErrorMessage(false)
    }

    let productBody = {
      id: match.params.id,
      info: {
        name: values.name,
        description: values.description,
        brand_id: values.brand.value,
        category_id: categorySelected.id,
      },
      logistics: {
        id: logistics?.id,
        size_height: values.height,
        size_length: values.length,
        size_width: values.width,
        weight: values.weight,
      },
      product_assets_delete: product_assets_delete.length > 0 ? product_assets_delete : null,
      product_images: product_images.length > 0 ? product_images : null,
      product_videos: product_videos.length > 0 ? product_videos : null,
      properties,
      variants_update: newvariants.filter(_variant => !!_variant.id),
      variants_add: newvariants.filter(_variant => !_variant.id).map((_variant) => ({ ..._variant })),
      tier_variations,
      tier_variations_delete: tier_variations_delete.length > 0 ? tier_variations_delete : null,
      custom_attributes,
      // warranties,
      custom_attributes_delete: custom_attributes_delete.length > 0 ? custom_attributes_delete : null,
      warranty
    }

    console.log(JSON.stringify(productBody))
    await update({
      variables: {
        productUpdateInput: productBody
      }
    })
  }

  if (loadingDetail)
    return (
      <div className="row" data-sticky-container style={{ justifyContent: 'center', alignItems: 'center' }} >
        <span className="spinner spinner-primary" style={{ marginTop: 20 }} ></span>
      </div>
    )

  if (!!dataCreate) {
    return <Redirect to='/products/list' />
  }
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={ProductEditSchema}
    >
      {({
        handleSubmit,
        values,
        validateForm,
        ...rest
      }) => {

        return (
          <div className="row " data-sticky-container>
            <div className="col-9">
              <Form>
                {
                  !!errorMessage && <div className='bg-danger text-white py-4 px-4  rounded-sm mb-4' >
                    <span>{errorMessage}</span>
                  </div>
                }
                <Element id='productChannel'  >
                  <ProductChannels />
                </Element>
                <Element id='productInfo'  >
                  <ProductBasicInfo />
                </Element>
                {
                  !!values['category'] && <>
                    <Element id='productProperties'  >
                      <ProductAttributes />
                    </Element>
                    <Element id='productSellInfo'  >
                      <ProductSellInfo />
                    </Element>
                    <Element id='productAssets'  >
                      <ProductImages />
                    </Element>
                    <Element id='productDescription'  >
                      <ProductDescription />
                    </Element>
                    <Element id='productShipping'  >
                      <ProductShipping />
                    </Element>
                    <Element id='productWarranty'  >
                      <ProductWarranty />
                    </Element>

                    <div className='d-flex justify-content-end' >
                      <button className="btn btn-outline-info mr-2" style={{ width: 150 }} onClick={e => {
                        e.preventDefault()
                        history.push('/products/list')
                      }} ><FormattedMessage defaultMessage="ABC" /></button>
                      <button className="btn btn-outline-success mr-2" style={{ width: 150 }} type="submit" onClick={async (e) => {
                        e.preventDefault();
                        // setTouched(true)
                        let error = await validateForm(values)
                        console.log('error', error)
                        if (Object.values(error).length != 0) {
                          handleSubmit()
                          setErrorMessage('Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ')
                          return;
                        } else {
                          if (isProductFileInValid) {
                            setErrorMessage('Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ')
                            return
                          }
                          if (productFiles.length == 0 || attributesSelected.some(_attribute => _attribute.has_asset && _attribute.values.some(_value => !productAttributeFiles[_value.code] || productAttributeFiles[_value.code].files.length == 0))) {
                            setErrorMessage('Hình ảnh sản phẩm yêu cầu tối thiểu 1 ảnh')
                            return
                          }
                        }
                        setErrorMessage(false)
                        updateProduct(values, true, rest)
                      }}><FormattedMessage defaultMessage="LƯU LẠI" /></button>
                      <button className="btn btn-primary" style={{ width: 150 }} type="submit" onClick={async (e) => {
                        e.preventDefault();
                        let error = await validateForm(values)
                        if (Object.values(error).length != 0) {
                          handleSubmit()
                          setErrorMessage('Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ')
                          return;
                        } else {
                          if (isProductFileInValid) {
                            setErrorMessage('Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ')
                            return
                          }
                          if (productFiles.length == 0 || attributesSelected.some(_attribute => _attribute.has_asset && _attribute.values.some(_value => !productAttributeFiles[_value.code] || productAttributeFiles[_value.code].files.length == 0))) {
                            setErrorMessage('Hình ảnh sản phẩm yêu cầu tối thiểu 1 ảnh')
                            return
                          }
                        }
                        setErrorMessage(false)
                        updateProduct(values, false, rest)
                      }} ><FormattedMessage defaultMessage="LƯU & ĐĂNG BÁN" /></button>
                    </div>
                  </>
                }
              </Form>
            </div>
            <div className="col-3">
              <Card className="sticky" data-sticky="true" data-margin-top="80" >
                <CardBody>
                  <Link to='productChannel' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-150} duration={500}>
                    <h6 style={{ fontWeight: 'unset' }} >Gian hàng/kênh bán</h6>
                  </Link>
                  <Link to='productInfo' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-80} duration={500}>
                    <h6 style={{ fontWeight: 'unset' }} >Thông tin cơ bản</h6>
                  </Link>
                  {
                    !!values['category'] && <>
                      <Link to='productProperties' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-80} duration={500}>
                        <h6 style={{ fontWeight: 'unset' }} >Thuộc tính sản phẩm</h6>
                      </Link>
                      <Link to='productSellInfo' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-80} duration={500}>
                        <h6 style={{ fontWeight: 'unset' }} >Thông tin bán hàng</h6>
                      </Link>
                      <Link to='productAssets' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-80} duration={500}>
                        <h6 style={{ fontWeight: 'unset' }} >Hình ảnh & video</h6>
                      </Link>
                      <Link to='productDescription' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-80} duration={500}>
                        <h6 style={{ fontWeight: 'unset' }} >Mô tả sản phẩm</h6>
                      </Link>
                      <Link to='productShipping' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-80} duration={500}>
                        <h6 style={{ fontWeight: 'unset' }} >Vận chuyển</h6>
                      </Link>
                      <Link to='productWarranty' style={{ color: 'unset' }} className='row mb-4' activeClass="text-primary font-weight-boldest" spy={true} smooth={true} offset={-200} duration={500}>
                        <h6 style={{ fontWeight: 'unset' }} >Bảo hành</h6>
                      </Link>
                    </>
                  }
                </CardBody>
              </Card>
            </div>
            <LoadingDialog show={loading} />
          </div>
        )
      }}
    </Formik>
  );
}
