import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { useProductsUIContext } from "../ProductsUIContext";
import { FormattedMessage, injectIntl, useIntl } from "react-intl";
import { Formik, Form, Field, useFormikContext } from "formik";
import { InputVertical } from "../../../../_metronic/_partials/controls";
import * as Yup from "yup";
import slugify from 'react-slugify';
import { ATTRIBUTE_VALUE_TYPE } from '../ProductsUIHelpers'
import { formatNumberToCurrency, randomString } from "../../../../utils";
import { useQuery } from "@apollo/client";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { useHistory } from "react-router";
import { Accordion, useAccordionToggle } from "react-bootstrap";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import query_sc_product_connected from "../../../../graphql/query_sc_product_connected";
import client from "../../../../apollo";

function CustomToggle({ children, eventKey }) {
  const [isOpen, setIsOpen] = useState(false)
  const decoratedOnClick = useAccordionToggle(eventKey, () => {
    setIsOpen(!isOpen);
  });

  return (
    <div className="mt-2 text-center justify-content-center flex-row cursor-pointer" onClick={decoratedOnClick}>
      <div>
        <a className="btn text-primary btn-link-success font-weight-bold">
          {children}
        </a>
      </div>
      <i className={`mt-1 text-primary ${(isOpen ? 'fas fa-angle-up ml-2' : 'fas fa-angle-down ml-2')}`} />
    </div>
  );
}

function ChooseOptionSync({ show, onHide, onChoosed, productMapping }) {
  const { data: dataStore } = useQuery(query_sc_stores_basic, {
    fetchPolicy: 'cache-and-network'
  });
  const {formatMessage} = useIntl()
  const [current, setCurrent] = useState({
    merge_product_info: false,
    merge_variant_info: false,
    merge_assets: false,
    merge_tags: false
  });
  const [productsConnected, setProductsConnected] = useState([]);
  const [loading, setLoading] = useState(false);

  const [optionsStore] = useMemo(
    () => {
      let _options = dataStore?.sc_stores?.map(_store => {
        let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
        return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
      }) || [];

      return [_options];
    }, [dataStore]
  );

  useMemo(
    async () => {
      const scProductMapping = await Promise.all(productMapping?.map(_product => {
        return new Promise((resolve) => {
          client.query({
            query: query_sc_product_connected,
            fetchPolicy: 'network-only',
            variables: {
              id: _product.sc_product_id
            }
          }).then(values => resolve(values?.data?.sc_product))
            .catch(_err => resolve([]))
        })
      }));      
      setProductsConnected(scProductMapping);
    }, [productMapping]
  );


  return (
    <Modal
      show={show}
      aria-labelledby="example-modal-sizes-title-sm"
      dialogClassName="modal-choose-options-sync"
      centered
    >
      <Modal.Header style={{ justifyContent: 'center', border: 'none', paddingBottom: 0 }}>
        <Modal.Title>
          {formatMessage({defaultMessage:'Chọn thông tin đồng bộ cho sản phẩm sàn đã liên kết'})}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default" style={{ position: 'relative' }}>
        <i
          className="far fa-times-circle"
          onClick={onHide}
          style={{ position: 'absolute', top: -55, right: -12, fontSize: 30, color: 'red', cursor: 'pointer', borderRadius: '50%', background: '#fff' }}
        />
        <div className="mb-2 d-flex align-items-center">
          <span className="mr-2"><i className="fas fa-info-circle" /></span>
          <span>{formatMessage({defaultMessage:'Trường hợp chưa muốn đồng bộ những thông tin vừa sửa cho sản phẩm trên sàn, bạn vui lòng chọn để sau'})}.</span>
        </div>
        {
          <div >
            {
              [
                {
                  label: formatMessage({defaultMessage:'Thông tin cơ bản (Tên sản phẩm, mã SKU thông tin, mô tả sản phẩm, vận chuyển)'}),
                  value: 'merge_product_info',
                },
                {
                  label: formatMessage({defaultMessage:'Tag sản phẩm'}),
                  value: 'merge_tags'
                },
                // {
                //   label: 'Phân loại sản phẩm (Phân loại sản phẩm, giá trị phân loại, hình ảnh phân loại)',
                //   value: 'merge_variant_info'
                // },
                {
                  label: formatMessage({defaultMessage:'Hình ảnh & video'}),
                  value: 'merge_assets'
                },
                // {
                //   label: 'Giá nhập',
                //   value: 'merge_price'
                // },
                // {
                //   label: 'Tồn kho',
                //   value: 'merge_stock'
                // },
              ].map(_option => {

                return <label key={`_option--${_option.value}`} className="checkbox checkbox-outline checkbox-primary mb-4">
                  <input type="checkbox"
                    checked={current[_option.value]}
                    onChange={(e) => {
                      setCurrent(prev => {
                        return {
                          ...prev,
                          [_option.value]: !prev[_option.value],
                        }
                      })
                    }}
                  />
                  <span></span>
                  &ensp;{_option.label}
                </label>
              })
            }
          </div>
        }
        <Accordion >
          <CustomToggle eventKey="0">
            {`${productMapping?.length} ${formatMessage({defaultMessage:'sản phẩm sàn liên kết'})}`}
          </CustomToggle>
          <Accordion.Collapse eventKey="0">
            <div className="mt-6">
              <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                {productsConnected?.map(
                  (_product, index) => {
                    let _store = optionsStore?.find(store => store.value == _product?.store_id) || {};
                    let imgOrigin = (_product?.productAssets || [])?.filter(_asset => _asset.type == 4)?.map(
                      _asset => {
                        return {
                          id: _asset.sme_asset_id,
                          source: _asset.origin_image_url || _asset.sme_url,
                          scId: _asset.id,
                          source_draft: _asset.origin_image_url || _asset.sme_url,
                          merged_image_url: _asset.sme_url,
                          template_image_url: _asset.template_image_url,
                        }
                      }
                    )[0];

                    const imgAvatar = !!imgOrigin && !!imgOrigin.template_image_url ? imgOrigin : (_product?.productAssets || [])?.filter(_asset => _asset.type == 1)[0]

                    return (
                      <div
                        // style={productMapping?.length - 1 == index ? { padding: '0rem 1rem 0rem 1rem' } : { padding: '0rem 1rem 1rem 1rem' }}
                        key={`choose-connect-${index}`}
                      >
                        <div style={{ border: '1px solid #dbdbdb', padding: '6px 1rem 0px', alignItems: 'center' }}>
                          <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                            <div style={{
                              backgroundColor: '#F7F7FA',
                              width: 60, height: 60,
                              borderRadius: 2,
                              overflow: 'hidden',
                              border: 'none',
                              minWidth: 60
                            }} className='mr-6' >
                              <img
                                className="cursor-pointer"
                                src={imgAvatar?.merged_image_url || imgAvatar?.sme_url}
                                style={{ width: 60, height: 60, objectFit: 'contain' }}
                                onClick={e => {
                                  e.preventDefault();
                                  window.open(`/product-stores/edit/${_product.id}`, '_blank')
                                }}
                              />
                            </div>
                            <div>
                              <p
                                className='font-weight-normal mb-2 cursor-pointer'
                                style={{ fontSize: 14 }}
                                onClick={e => {
                                  e.preventDefault();
                                  window.open(`/product-stores/edit/${_product.id}`, '_blank')
                                }}
                              >
                                {_product?.name || ''}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center' }} >
                                <p className="d-flex" style={{ fontSize: 10 }}><img src={toAbsoluteUrl('/media/ic_sku.svg')} />
                                  <span className='ml-2'>{_product?.sku || ''}</span>
                                </p>
                              </div>
                              <p className="mt-1 d-flex align-items-center" >
                                <img
                                  style={{ width: 10, height: 10 }}
                                  src={_store?.logo}
                                  className="mr-2"
                                />
                                <span >{_store?.label}</span>
                              </p>
                              {/* <div className="mt-2 d-flex align-items-center">
                                <span className="mr-8">Tồn kho: {formatNumberToCurrency(_product.stock_on_hand)}</span>
                                <span>Giá bán: {formatNumberToCurrency(_product.price)}đ</span>
                              </div> */}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            </div>
          </Accordion.Collapse>
        </Accordion>
      </Modal.Body>
      <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
        <div className="form-group">
          <button
            type="button"
            className="btn btn-outline-primary btn-elevate mr-3"
            style={{ width: 100 }}
            onClick={e => {
              e.preventDefault()
              onHide()

              !!onChoosed && onChoosed()
            }}
          >
            {formatMessage({defaultMessage:'ĐỂ SAU'})}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-elevate"
            style={{ width: 100 }}
            disabled={Object.values(current).every(v => !v)}
            onClick={e => {
              e.preventDefault()
              onHide()

              !!onChoosed && onChoosed(current)
            }}
          >
            {formatMessage({defaultMessage:'ĐỒNG BỘ'})}
          </button>
        </div>
      </Modal.Footer>
    </Modal >
  );
}

export default injectIntl(ChooseOptionSync);