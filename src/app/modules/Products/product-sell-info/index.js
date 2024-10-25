/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import React, { useCallback, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderToolbar,
  InputVertical,
  Input
} from "../../../../_metronic/_partials/controls";
import { FormattedMessage, injectIntl } from "react-intl";
import { Link, useHistory } from "react-router-dom";
import { useProductsUIContext } from "../ProductsUIContext";
import { Divider } from "@material-ui/core";
import _ from 'lodash'
import Attribute from "./Attribute";
import { Field, useFormikContext } from "formik";
import TablePrice from "./TablePrice";
import ProductAddAttributeDialog from "../product-add-attribute-dialog";
import { useLazyQuery } from "@apollo/client";
import query_sme_catalog_product_variant_aggregate from "../../../../graphql/query_sme_catalog_product_variant_aggregate";
import { createApolloClientSSR } from "../../../../apollo";
import { queryCheckExistSku } from "../ProductsUIHelpers";
import ProductImageEditDialog from "../product-image-edit-dialog";
import { ReSelect } from "../../../../_metronic/_partials/controls/forms/ReSelect";
import { Switch } from "../../../../_metronic/_partials/controls/forms/Switch";
import { useIntl } from "react-intl";
import ProductUnit from "../product-unit";
import { randomString } from "../../../../utils";
// let client = createApolloClientSSR()

function ProductSellInfo(props) {
  const {
    attributes,
    attributesSelected, setAttributesSelected,
    variants,
    setVariantsUnit,
    variantsUnit,
    customAttributes,
    smeCatalogStores,
    currentProduct,
    setIsUnit,
    isUnit

  } = useProductsUIContext();
  const [dataCrop, setDataCrop] = useState()
  const history = useHistory()
  const [showModal, setShowModal] = useState(false)
  const [name_attribute, setName_attribute] = useState(false)
  const [attributeRename, setAttributeRename] = useState(null)
  const { formatMessage } = useIntl()
  const { values, setFieldValue, errors } = useFormikContext()
  const { intl, isCreating, refetch } = props;
  // console.log('variants', variants)

  const checkExistSku = useCallback(async (code) => {
    if (code.trim().length == 0) {
      return false;
    }
    if (await queryCheckExistSku(currentProduct?.id, code)) {
      setFieldValue(`variant-sku_boolean`, { origin_sku: true })
    } else {
      setFieldValue(`variant-sku_boolean`, { origin_sku: false })
    }
  }, [currentProduct])

  const hasProductChannel = useMemo(() => {
    return currentProduct?.scProductMapping?.length > 0
  }, [currentProduct])

  const resetUnit = () => {
    setVariantsUnit([])
    setFieldValue('switch-unit', false)
    setFieldValue('edit-switch-unit', false)
  }

  return (
    <>
      <Card>
        {/* <CardHeader title={intl.formatMessage({
          id: "PRODUCT_SELL_INFO.TITLE",
        })}>
        </CardHeader> */}
        <CardBody  >
          <div className="form-group mb-0">
            <div className='mr-10' >
              <h6 className='mb-0 d-flex align-items-center'>
                <FormattedMessage className='' defaultMessage="PHÂN LOẠI SẢN PHẨM" />
                <span className="ml-4">
                  <Field
                    name={`is_has_sell_info`}
                    disableActions={(!isCreating && !!values?.has_attributes) || !!values?.has_order}
                    component={Switch}
                    disabled={props?.isSyncVietful}
                    onChangeState={() => {
                      if (values[`is_has_sell_info`]) {
                        resetUnit()
                      }
                      setFieldValue('switch-unit', false)
                      setVariantsUnit([])

                    }}
                  />
                </span>
              </h6>
              <span className='font-size-xs text-info' ><em style={{ color: '#00000073' }}>*{formatMessage({ defaultMessage: 'Có thể tạo tối đa 2 nhóm phân loại, ví dụ màu sắc, kích thước' })}</em></span>
            </div>
            {!!values['is_has_sell_info'] && <>
              <div className='row pl-2 pt-4' >
                {
                  attributesSelected.filter(_att => !_att.isInactive).length < 2 && !values?.has_order && <button className={`btn btn-secondary font-weight-bold mr-2 round  d-flex  align-items-center justify-content-start color-white`}
                    style={{ borderRadius: 30, minWidth: 100, paddingTop: 4, paddingBottom: 4, cursor: values['is_disabled_add_variant'] ? 'not-allowed' : 'pointer' }}
                    disabled={props?.isSyncVietful || values['is_disabled_add_variant']}
                    onClick={e => {

                      e.preventDefault();
                      setVariantsUnit([])
                      setAttributeRename(null)
                      setName_attribute(null)
                      setShowModal(true)
                      setIsUnit(false)
                    }}
                  >
                    <i className="fas fa-plus mr-1"></i>{formatMessage({ defaultMessage: 'Thêm nhóm phân loại' })}
                  </button>
                }
              </div>
              <div className='mt-2' >
                {
                  attributesSelected.filter(_att => !_att.isInactive).map((_attribute, index) => {
                    return <Attribute title={`Tên nhóm phân loại ${index + 1}:`} key={`--attribute0-${_attribute.id}`}
                      attribute={_attribute} hasProductChannel={hasProductChannel}
                      onEdit={(id, display_name) => {
                        setAttributeRename(id)
                        setName_attribute(display_name)
                        setShowModal(true)
                      }}
                      has_asset={index == 0}
                      onOpenCrop={(url, onCrop) => {
                        setDataCrop({ url, onCrop })
                      }}
                      isCreating={isCreating}
                      isSyncVietful={props?.isSyncVietful}
                      syncedVariants={props?.syncedVariants}
                    />
                  })
                }
              </div>
            </>}
          </div>
        </CardBody>
      </Card>

      <ProductUnit isCreating={isCreating} isSyncVietful={props?.isSyncVietful} syncedVariants={props?.syncedVariants}/>

      {!!values['is_has_sell_info'] && <>
        {
          variants.length > 0 && <>
            <Card>
              <CardHeader title={intl.formatMessage({
                defaultMessage: "SẢN PHẨM PHÂN LOẠI",
              })}>
              </CardHeader>
              <CardBody  >
                <div className="form-group mb-0">

                  <div className=' mt-4 d-flex flex-row ' style={{ alignItems: 'flex-end' }} >
                    <div className='row flex-grow-1 pr-6' >
                      {/* <div className={`col-md-3`} >
                        <Field
                          name="origin_costPrice"
                          component={InputVertical}
                          type='number'
                          placeholder=""
                          label={formatMessage({ defaultMessage: 'Giá vốn' })}
                          customFeedbackLabel={' '}
                          absolute
                        />
                      </div> */}
                      <div className={`col-md-3`} >
                        <Field
                          name="origin_price"
                          component={InputVertical}
                          type='number'
                          placeholder=""
                          label={formatMessage({ defaultMessage: 'Giá bán' })}
                          customFeedbackLabel={' '}
                          absolute
                        />
                      </div>
                      {!isUnit && <div className={`col-md-3`} >
                        <Field
                          name="variant_unit"
                          component={InputVertical}
                          placeholder=""
                          label={formatMessage({ defaultMessage: 'Đơn vị tính' })}
                          customFeedbackLabel={' '}
                          absolute
                        />
                      </div>}

                      {/* <div className={`col-md-6 d-flex align-items-end`} >
                        {isCreating &&
                          <>
                            <div style={{ width: '50%' }}>
                              <Field
                                name="origin_stockOnHand"
                                component={InputVertical}
                                type='number'
                                placeholder=""
                                label={formatMessage({ defaultMessage: 'Tồn đầu' })}
                                required={false}
                                customFeedbackLabel={' '}
                                absolute
                              />
                            </div>
                            <div style={{ width: '50%', borderLeft: '1px solid #dee1e5', zIndex: 100 }}>
                              <Field
                                name="origin_stock"
                                component={ReSelect}
                                isClear={false}
                                hideBottom
                                type='number'
                                placeholder={formatMessage({ defaultMessage: "Chọn kho" })}
                                label={''}
                                required={false}
                                customFeedbackLabel={' '}
                                options={smeCatalogStores
                                  ?.filter(_store => ({ value: _store?.value, lable: _store?.value }))
                                  ?.map(_op => {
                                    return {
                                      label: _op.label,
                                      value: _op.value,
                                    }
                                  })}
                                cols={['col-0', 'col-12']}
                              />
                            </div>
                          </>
                        }

                      </div> */}
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-elevate"
                      style={{ height: 38, width: 'max-content' }}
                      disabled={errors?.origin_price || errors?.origin_stockOnHand || errors?.origin_costPrice || (!isUnit&&errors?.variant_unit)}
                      onClick={e => {
                        e.preventDefault();
                        let { origin_costPrice, origin_price, origin_stockOnHand, origin_stock, variant_unit } = values
                        let validateBoolean = {};
                        const idOriginStock = origin_stock?.value || '';
                        // variantsUnit.forEach(_row => {
                        //   if (origin_price != null && origin_price != undefined && String(origin_price).length > 0)
                        //     setFieldValue(`variant-${_row.id}-price`, origin_price, true)

                        //   if (origin_costPrice != null && origin_costPrice != undefined && String(origin_costPrice).length > 0)
                        //     setFieldValue(`variant-${_row.id}-costPrice`, origin_costPrice, true)

                        //   if (origin_stockOnHand != null && origin_stockOnHand != undefined && String(origin_stockOnHand).length > 0 && !values[`variant-${_row.id}-active`])
                        //     setFieldValue(`variant-${_row.id}-${idOriginStock}-stockOnHand`, origin_stockOnHand, true);
                        // });
                        variants.forEach(_row => {
                          if (origin_price != null && origin_price != undefined && String(origin_price).length > 0)
                            setFieldValue(`variant-${_row.code}-price`, origin_price, true)
                          setFieldValue(`changePrice`, origin_price)

                          if (!isUnit && variant_unit != null && variant_unit != undefined && String(variant_unit).length > 0)
                            setFieldValue(`variant-${_row.code}-unit`, variant_unit, true)

                          // let totalStockOnHand = smeCatalogStores?.reduce(
                          //   (result, store) => {
                          //     if (store.value != idOriginStock) {
                          //       result += values[`variant-${_row.code}-${store.value}-stockOnHand`] || 0
                          //     }

                          //     return result;
                          //   }, (origin_stockOnHand || 0)
                          // );

                          if (origin_stockOnHand != null && origin_stockOnHand != undefined && String(origin_stockOnHand).length > 0 && !values[`variant-${_row.code}-active`])
                            setFieldValue(`variant-${_row.code}-${idOriginStock}-stockOnHand`, origin_stockOnHand, true);
                        });


                        // variants.forEach(_row => {
                        //   if (origin_price != null && origin_price != undefined && String(origin_price).length > 0)
                        //     setFieldValue(`variant-${_row.code}-price`, origin_price, true)
                        //   if (origin_stockOnHand != null && origin_stockOnHand != undefined && String(origin_stockOnHand).length > 0)
                        //     setFieldValue(`variant-${_row.code}-stockOnHand`, origin_stockOnHand, true)
                        //   if (origin_sku != null && origin_sku != undefined && String(origin_sku).length > 0) {
                        //     setFieldValue(`variant-${_row.code}-sku`, origin_sku, true)
                        //     validateBoolean[_row.code] = true;
                        //   }
                        // });

                        // setFieldValue(`variant-sku_boolean`, validateBoolean, true)
                      }}
                    >
                      {formatMessage({ defaultMessage: 'Áp dụng cho tất cả phân loại' })}
                    </button>
                  </div>
                  <TablePrice isCreating={isCreating} refetch={refetch} isSyncVietful={props?.isSyncVietful} syncedVariants={props?.syncedVariants}/>

                </div>
              </CardBody>
            </Card>
          </>
        }
      </>}
      <ProductAddAttributeDialog
        show={showModal}
        resetUnit={() => {
          setFieldValue('switch-unit', false)
          setFieldValue('edit-switch-unit', false)
        }}
        onHide={() => {
          setShowModal(false)
        }}
        attributeRename={attributeRename}
        name_attribute={name_attribute}
      />

      <ProductImageEditDialog
        show={!!dataCrop}
        dataCrop={dataCrop}
        onHide={() => {
          setDataCrop(null)
        }}
      />
    </>
  );
}

export default injectIntl(ProductSellInfo);