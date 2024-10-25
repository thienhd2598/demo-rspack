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
import { Modal } from "react-bootstrap";
import TableStock from "./TableStock";
import { Switch } from "../../../../_metronic/_partials/controls/forms/Switch";
import { createSKUProduct, formatNumberToCurrency, getMaxLengthSKU } from "../../../../utils";
import { useToasts } from "react-toast-notifications";
import { useSelector } from "react-redux";
import { Element } from "react-scroll";
import { useIntl } from 'react-intl';
import ModalStockOnHand from "./dialogs/ModalStockOnHand";
import { ReSelect } from "../../../../_metronic/_partials/controls/forms/ReSelect";

// let client = createApolloClientSSR()

function ProductSellInfo(props) {
  const {
    attributes,
    attributesSelected, setAttributesSelected,
    variants,
    customAttributes,
    isEditProduct,
    currentProduct,
    scWarehouses,
    productEditing,
    currentChannel,
    properties,
    smeCatalogStores
  } = useProductsUIContext();
  const { formatMessage } = useIntl();
  const { addToast } = useToasts();
  const user = useSelector((state) => state.auth.user);
  const [dataCrop, setDataCrop] = useState()
  const [showModal, setShowModal] = useState(false)
  const [name_attribute, setName_attribute] = useState(false)
  const [attributeRename, setAttributeRename] = useState(null)
  const [showStock, setShowStock] = useState(false);
  const [showConfigStockOnHand, setConfigStockOnHand] = useState(false);

  const { values, setFieldValue } = useFormikContext()
  const { isCreating } = props;
  const hasProductChannel = useMemo(() => {
    return currentProduct?.scProduct?.length > 0
  }, [currentProduct])

  const totalStockOnHand = useMemo(() => {
    return _.sum(scWarehouses?.map(wh => values[`${wh?.value}-stockOnHand`] || 0))
  }, [values, scWarehouses]);

  const [totalAttribute, isDisableActions] = useMemo(
    () => {
      const total = attributesSelected
        .filter(_att => !_att.isInactive)
        .reduce((result, val) => {
          result += (val?.values?.length || 0);
          return result;
        }, 0);

      const isDisabel = attributesSelected
        .filter(_att => !_att.isInactive)
        .some(_att => !_att.sc_attribute_id)

      return [total, isDisabel];
    }, [attributesSelected]
  );

  console.log('current attributesSelected', attributesSelected)

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
                <FormattedMessage defaultMessage="PHÂN LOẠI SẢN PHẨM" />
                <span className="ml-4">
                  <Field
                    name={`is_has_sell_info`}
                    disableActions={!isCreating && !!values?.has_attributes && productEditing?.status != 2}
                    component={Switch}
                  />
                </span>
              </h6>
            </div>
            {!!values['is_has_sell_info'] && <>
              {(currentChannel?.connector_channel_code != 'lazada' || isCreating) && (
                <span className='font-size-xs text-info' ><em style={{ color: '#00000073' }}>
                  {formatMessage({ defaultMessage: `*Có thể tạo tối đa {max} nhóm phân loại, ví dụ màu sắc, kích thước` }, { max: currentChannel?.connector_channel_code == 'tiktok' ? 3 : 2 })}
                </em></span>
              )}
              <div className='row pl-2 pt-4' >
                {
                  // (currentChannel?.connector_channel_code == 'tiktok' ? !isDisableActions : true) && !values[`disable-edit-attribute`] && 
                  (!values[`disable-edit-attribute`] || currentChannel?.connector_channel_code != 'lazada' || productEditing?.status == 2) && (attributesSelected.filter(_att => !_att.isInactive).length < (currentChannel?.connector_channel_code == 'tiktok' ? 3 : 2)) && <button className={`btn btn-secondary font-weight-bold mr-2 round  d-flex  align-items-center justify-content-start color-white`}
                    style={{ borderRadius: 30, minWidth: 100, paddingTop: 4, paddingBottom: 4 }}
                    onClick={e => {
                      e.preventDefault();
                      setAttributeRename(null)
                      setName_attribute(null)
                      setShowModal(true)
                    }}
                  >
                    <i className="fas fa-plus mr-1"></i>{formatMessage({ defaultMessage: 'Thêm nhóm phân loại' })}
                  </button>
                }
              </div>
              {currentChannel?.connector_channel_code == 'tiktok' && (
                <div className="d-flex flex-column gap-2 mt-2">
                  {/* {attributesSelected.filter(_att => !_att.isInactive).length > 2 && (
                  <p style={{ color: 'red' }}>Để liên kết sản phẩm sàn Tiktok với sản phẩm kho, bạn vui lòng chỉ để tối đa 2 nhóm phân loại.</p>
                )} */}
                  {attributesSelected.filter(_att => !_att.isInactive)?.some(_att => _att.values?.length > 20) && (
                    <p style={{ color: 'red' }}>{formatMessage({ defaultMessage: 'Để liên kết sản phẩm sàn Tiktok với sản phẩm kho, bạn vui lòng chỉ để tối đa 20 giá trị phân loại của 1 nhóm phân loại.' })}</p>
                  )}
                  {totalAttribute > 50 && (
                    <p style={{ color: 'red' }}>
                      {formatMessage({ defaultMessage: 'Để liên kết sản phẩm sàn Tiktok với sản phẩm kho, bạn vui lòng chỉ để tối đa 50 tổ hợp giá trị phân loại.' })}
                    </p>
                  )}
                </div>
              )}
              <div className='mt-4'>
                {
                  attributesSelected.filter(_att => !_att.isInactive).map((_attribute, index) => {
                    return <Attribute
                      title={formatMessage({ defaultMessage: `Tên nhóm phân loại {name}:` }, { name: index + 1 })}
                      key={`--attribute0-${_attribute.id}`}
                      attribute={_attribute}
                      hasProductChannel={hasProductChannel}
                      disableActions={currentChannel?.connector_channel_code == 'tiktok' && values[`disable-edit-attribute`] ? isDisableActions : false}
                      onEdit={(id, display_name) => {
                        let currentAttr = attributesSelected
                          ?.map(_pro => {
                            return {
                              label: _pro.display_name,
                              value: !!_pro.sc_attribute_id ? String(_pro.sc_attribute_id) : String(_pro.id),
                              __id__: String(_pro.id),
                              __isNew__: !_pro.sc_attribute_id
                            }
                          })
                          ?.find(_attr => _attr?.__id__ == id)
                        setName_attribute(currentAttr || undefined)
                        setAttributeRename(id)
                        setShowModal(true)
                      }}
                      has_asset={_attribute.has_asset || index == 0}
                      onOpenCrop={(url, onCrop) => {
                        setDataCrop({ url, onCrop })
                      }}
                      isCreating={isCreating}
                    />
                  })
                }
              </div>
            </>}

            {!values['is_has_sell_info'] && <>
              <div className="form-group mb-0 row mt-4">
                <div className={`col-md-6`} style={{ position: 'relative' }} >
                  <Field
                    name="origin_sku"
                    component={InputVertical}
                    placeholder=""
                    label={formatMessage({ defaultMessage: "Mã SKU hàng hóa" })}
                    required={true}
                    // required={(variants?.length > 0 && currentChannel?.connector_channel_code == 'lazada') || currentChannel?.connector_channel_code == 'tiktok' ? false : true}
                    tooltip={formatMessage({ defaultMessage: "Mã SKU của hàng hóa phục vụ cho mục đích quản lý tồn kho" })}
                    customFeedbackLabel={' '}
                    countChar
                    maxChar={getMaxLengthSKU(currentChannel?.connector_channel_code)}
                    absolute
                    disabled={currentChannel?.connector_channel_code === 'lazada' && values[`disable-edit-attribute`] && productEditing?.status != 2}
                  />
                  {!values.origin_sku ?
                    <a href="#" style={{ position: 'absolute', top: '0.8rem', right: '1.1rem', cursor: currentChannel?.connector_channel_code === 'lazada' && values[`disable-edit-attribute`] && productEditing?.status != 2 ? 'not-allowed' : 'pointer' }}
                      onClick={e => {
                        e.preventDefault()
                        if (currentChannel?.connector_channel_code === 'lazada' && values[`disable-edit-attribute`] && productEditing?.status != 2) return;
                        if (!!values.name)
                          setFieldValue('origin_sku', createSKUProduct(user?.sme_id, values.name || ''))
                        else {
                          addToast(formatMessage({ defaultMessage: 'Vui lòng nhập tên sản phẩm' }), { appearance: 'warning' });
                        }

                      }}
                    >
                      {formatMessage({ defaultMessage: 'Tự động tạo' })}
                    </a>
                    : null}
                </div>
                <div className={`col-md-6`} >
                  {!!currentChannel?.enable_multi_warehouse && (
                    <div className="d-flex flex-column">
                      <label className="col-form-label">
                        Tồn kho <span className='text-danger' > *</span>
                      </label>
                      <div className="d-flex align-items-center">
                        <span className="mr-2">{formatNumberToCurrency(totalStockOnHand)}</span>
                        <i
                          role="button"
                          style={{ cursor: values[`is_disable_stock`] ? 'not-allowed' : 'pointer' }}
                          className="text-dark far fa-edit"
                          onClick={() => {
                            if (values[`is_disable_stock`]) {
                              return
                            }
                            setConfigStockOnHand(true)
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {!currentChannel?.enable_multi_warehouse && (
                    <>
                      <Field
                        name="stockOnHand"
                        component={InputVertical}
                        disabled={values['is_disable_stock']}
                        type='number'
                        placeholder=""
                        required={true}
                        label={formatMessage({ defaultMessage: 'Có sẵn' })}
                        customFeedbackLabel={' '}
                        absolute
                      />
                      {!!values['stockReverse'] && <span>{`Dự trữ: ${values["stockReverse"]}`}</span>}
                    </>
                  )}
                </div>
              </div>
              <div className="form-group mb-0 row">
                <div className={`col-md-6`} >
                  <Field
                    name="price"
                    component={InputVertical}
                    type='number'
                    placeholder=""
                    label={formatMessage({ defaultMessage: 'Giá niêm yết' })}
                    required={true}
                    customFeedbackLabel={' '}
                    addOnRight="đ"
                    absolute
                  />
                </div>
                <div className={`col-md-6`} >
                  <Field
                    name="price_minimum"
                    component={InputVertical}
                    type='number'
                    placeholder=""
                    label={formatMessage({ defaultMessage: 'Giá bán tối thiểu' })}
                    tooltip={formatMessage({ defaultMessage: 'Giá bán tối thiểu dùng làm căn cứ để set giá ở chương trình khuyến mại. Giá ở chương trình khuyến mại không được nhỏ hơn giá bán tối thiểu' })}
                    required={true}
                    customFeedbackLabel={' '}
                    addOnRight="đ"
                    absolute
                  />
                </div>
              </div>
            </>}
          </div>
        </CardBody>
      </Card>

      {
        !!values['is_has_sell_info'] && variants.length > 0 &&
        <Element id='productSellInfoVariants'>
          <Card>
            <CardHeader title={formatMessage({ defaultMessage: 'SẢN PHẨM PHÂN LOẠI' })} />
            <CardBody>
              <div className=' mt-4 d-flex flex-row ' style={{ alignItems: 'flex-end' }} >
                <div className='row flex-grow-1 pr-6' >
                  <div className={`col-md-4`} >
                    <Field
                      name="origin_price"
                      component={InputVertical}
                      type='number'
                      placeholder=""
                      label={formatMessage({ defaultMessage: 'Giá niêm yết' })}
                      required={false}
                      customFeedbackLabel={' '}
                      addOnRight="đ"
                      absolute
                    />
                  </div>
                  <div className={`col-md-4`} >
                    <Field
                      name="origin_priceMinimum"
                      component={InputVertical}
                      type='number'
                      placeholder=""
                      label={formatMessage({ defaultMessage: 'Giá bán tối thiểu' })}
                      required={false}
                      customFeedbackLabel={' '}
                      addOnRight="đ"
                      absolute
                    />
                  </div>
                  <div className={`col-md-4 d-flex align-items-end`}>
                    <div style={{ width: !!currentChannel?.enable_multi_warehouse ? '50%' : '100%' }}>
                      <Field
                        name="origin_stockOnHand"
                        component={InputVertical}
                        type='number'
                        placeholder=""
                        disabled={values['is_disable_stock']}
                        label={formatMessage({ defaultMessage: 'Có sẵn' })}
                        customFeedbackLabel={' '}
                        absolute
                      />
                    </div>
                    {!!currentChannel?.enable_multi_warehouse && (
                      <div style={{ width: '50%', borderLeft: '1px solid #dee1e5', zIndex: 100 }}>
                        <Field
                          name="origin_warehouse"
                          component={ReSelect}
                          isClear={false}
                          hideBottom
                          type='number'
                          placeholder={formatMessage({ defaultMessage: "Chọn kho" })}
                          label={''}
                          required={false}
                          customFeedbackLabel={' '}
                          options={scWarehouses}
                          cols={['col-0', 'col-12']}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-elevate"
                  style={{ height: 38, width: 150 }}
                  onClick={e => {
                    e.preventDefault();
                    let { origin_stockOnHand, origin_code, origin_sku, origin_price, origin_priceMinimum } = values;

                    variants.forEach(_row => {
                      origin_price && setFieldValue(`variant-${_row.code}-price`, origin_price)
                      origin_priceMinimum && setFieldValue(`variant-${_row.code}-priceMinimum`, origin_priceMinimum)

                      if (!!currentChannel?.enable_multi_warehouse) {
                        typeof origin_stockOnHand === 'number' && !values[`variant-${_row.code}-disable-stock`]
                          && setFieldValue(`variant-${_row.code}-${values[`origin_warehouse`]?.value}-stockOnHand`, origin_stockOnHand);
                      } else {
                        typeof origin_stockOnHand === 'number' && !values[`variant-${_row.code}-disable-stock`] && setFieldValue(`variant-${_row.code}-stockOnHand`, origin_stockOnHand)
                      }
                    });


                  }}
                >
                  <FormattedMessage defaultMessage="ÁP DỤNG TẤT CẢ" />
                </button>
              </div>
              <TablePrice
                isCreating={isCreating}
                currentChannel={currentChannel}
                setShowStock={setShowStock}
                disableActions={false}
              />
            </CardBody>
          </Card>
        </Element>
      }

      {!!showConfigStockOnHand && <ModalStockOnHand
        show={showConfigStockOnHand}
        onHide={() => setConfigStockOnHand(false)}
      />}

      <ProductAddAttributeDialog
        show={showModal}
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
      <Modal
        show={showStock}
        onHide={() => setShowStock(false)}
        centered
        size='lg'
      >
        <Modal.Body className="overlay overlay-block cursor-default" >
          <TableStock />
        </Modal.Body>
        <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
          <div className="form-group">
            <button
              type="button"
              onClick={() => setShowStock(false)}
              className="btn btn-light btn-elevate mr-3"
              style={{ width: 100 }}
            >
              {formatMessage({ defaultMessage: 'ĐÓNG' })}
            </button>
          </div>
        </Modal.Footer>
      </Modal >
    </>
  );
};

export default injectIntl(ProductSellInfo);