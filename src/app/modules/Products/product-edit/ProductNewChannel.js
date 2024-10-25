/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import { Form } from "formik";
import React, { useState, useEffect, useCallback } from "react";
import ProductChannels from '../product-channel'
import { useProductsUIContext } from "../ProductsUIContext";
import { animateScroll } from 'react-scroll';
import { ATTRIBUTE_VALUE_TYPE } from "../ProductsUIHelpers";
import LoadingDialog from "./LoadingDialog";
import { useMutation, useQuery } from "@apollo/client";

import mutate_scSaveSmeProduct from '../../../../graphql/mutate_scSaveSmeProduct'
import query_scGetSmeProduct from '../../../../graphql/query_scGetSmeProduct'
import mutate_scProductSyncUp from '../../../../graphql/mutate_scProductSyncUp'
import ProductStep from "../product-step";
import { useToasts } from "react-toast-notifications";
import { Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import _ from 'lodash'
import { useIntl } from "react-intl";
const Sticky = require('sticky-js');


export function ProductNewChannel({
  history,
  setStep,
  formikProps
}) {

  const {
    handleSubmit,
    values,
    validateForm,
    setFieldValue,
    setValues,
    ...rest
  } = formikProps
  const [loading, setLoading] = useState(false)
  const [confirmSuccess, setConfirmSuccess] = useState(false)
  const [confirmContinueWhenChangeStore, setConfirmContinueWhenChangeStore] = useState(false)
  const {formatMessage} = useIntl()
  const [initing, setIniting] = useState(true)
  const [scSaveSmeProduct] = useMutation(mutate_scSaveSmeProduct)
  const [scProductSyncUp] = useMutation(mutate_scProductSyncUp)
  const {
    channels, channelsAvailable,
    currentProduct, setChannels,
    setCurrentStep
  } = useProductsUIContext();
  const codes = Object.keys(channelsAvailable || {}).join(',')
  const { addToast } = useToasts();
  const { data, loading: loadingProduct } = useQuery(query_scGetSmeProduct, {
    variables: {
      sme_product_id: currentProduct.id
    },
    fetchPolicy: 'no-cache'
  })

  // console.log('data?.scGetSmeProduct', data?.scGetSmeProduct, loadingProduct, values)

  const [errorMessage, setErrorMessage] = useState("");
  const channelLoaded = !!channels ? Object.keys(channels).join('-') : null;
  useEffect(() => {
    if (!!data?.scGetSmeProduct && channelLoaded != null) {
      let _channels = { ...channels };
      //Set default chua select store nao
      Object.keys(_channels).forEach(_key => {
        _channels = {
          ..._channels,
          [_key]: {
            ..._channels[_key],
            stores: _channels[_key].stores?.map(__store => {
              return {
                ...__store,
                isSelected: false
              }
            }),
          }
        }
      });
      let storeSelected = {};
      (data?.scGetSmeProduct || []).forEach(_product => {
        let attributeMulti = {};
        (_product.attribute_values || []).forEach(_attribute => {
          let _valueAttribute = _attribute.value || '';
          let _optionNameAttribute = _attribute.option_name || '';
          if (!!_attribute.unit){
            setFieldValue(`${_product.connector_channel_code}-property-${_attribute.id}-unit`, { label: _attribute.unit, value: _attribute.unit })
            if(_valueAttribute.endsWith(_attribute.unit)){
              _valueAttribute = _valueAttribute.substr(0, _valueAttribute.length - _attribute.unit.length)
            }
            if(_optionNameAttribute.endsWith(_attribute.unit)){
              _optionNameAttribute = _optionNameAttribute.substr(0, _optionNameAttribute.length - _attribute.unit.length)
            }
          }
            
          if (_attribute.input_type == ATTRIBUTE_VALUE_TYPE.TEXT)
            setFieldValue(`${_product.connector_channel_code}-property-${_attribute.id}`, _valueAttribute)
          if (_attribute.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT)
            setFieldValue(`${_product.connector_channel_code}-property-${_attribute.id}`, { label: _optionNameAttribute, value: _valueAttribute })
          if (_attribute.input_type == ATTRIBUTE_VALUE_TYPE.DATE)
            setFieldValue(`${_product.connector_channel_code}-property-${_attribute.id}`, _valueAttribute)
          if (_attribute.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC)
            setFieldValue(`${_product.connector_channel_code}-property-${_attribute.id}`, _valueAttribute)
          if (_attribute.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT) {
            if (!!attributeMulti[_attribute.id]) {
              attributeMulti[_attribute.id].push({ label: _optionNameAttribute, value: _valueAttribute })
            } else {
              attributeMulti[_attribute.id] = [{ label: _optionNameAttribute, value: _valueAttribute }]
            }
          }
        });
        Object.keys(attributeMulti).forEach(_key => {
          setFieldValue(`${_product.connector_channel_code}-property-${_key}`, attributeMulti[_key])
        });
        setFieldValue(`category-${_product.connector_channel_code}-selected`, true)
        if (!!_product.sc_brand_id) {
          setFieldValue(`brand-${_product.connector_channel_code}`, {
            value: _product.sc_brand_id,
            label: _product.ref_brand_name
          })
        }
        if (!!_channels[_product.connector_channel_code]) {
          _channels = {
            ..._channels,
            [_product.connector_channel_code]: {
              ..._channels[_product.connector_channel_code],
              stores: _channels[_product.connector_channel_code].stores?.map(__store => {
                if (__store.id == _product.store_id) {
                  if (!!__store.status)
                  storeSelected[_product.store_id] = true
                  return {
                    ...__store,
                    isSelected: true
                  }
                }
                return __store
              }),
              last_category_selected: _product.ref_category_id
            }
          };
        }
        
        setFieldValue(`is_valid_logistic-${_product.connector_channel_code}`, !!_product.is_valid_logistic );
        (_product.ref_logistic_channel_id || []).forEach(_id => {
          setFieldValue(`channel-logistic-${_id}`, true)
        })

      });

      setFieldValue('__store_last_selected__', Object.keys(storeSelected))
      setChannels(_channels)

      setIniting(false);
    }
  }, [data, channelLoaded])

  useEffect(() => {
    setCurrentStep(2)
  }, [])

  useEffect(() => {
    if (!!errorMessage) {
      animateScroll.scrollToTop();
    }
  }, [errorMessage])


  useEffect(() => {
    return () => {
      setFieldValue('__changed__', false)
    }
  }, [])

  const _checkStoreChange = useCallback((values, _channels) => {
    let storeSelected = {};
    _channels.forEach(key => {
      let _channel = channels[key];
      _channel.stores.filter(_store => !!_store.status && _store.isSelected).forEach(_store => {
        storeSelected[_store.id] = true;
      })
    });

    return Object.keys(storeSelected)
  }, [channels])

  const _saveProduct = async (values, _channels) => {
    setLoading(true)
    try {
      console.log('_saveProduct_saveProduct_saveProduct')
      console.log('currentProduct=', currentProduct)
      console.log('channelsAvailable=', channelsAvailable)
      console.log('values=', values)
      console.log('_channels=', _channels)
      console.log('channels=', channels)
      let products = []
      let errorLogistic = '';

      _channels.forEach(key => {
        let _channel = channels[key];
        let attribute_values = [];
        let ref_logistic_channel_id = _channel.logistics?.map(_logistic => {
          if (values[`channel-logistic-${_logistic.ref_channel_id}`]) {
            return _logistic.ref_channel_id
          }
          return null
        }).filter(_logistic => !!_logistic) || [];
        if (key == 'shopee') {
          if (_channel.logistics?.length == 0) {
            errorLogistic = formatMessage({defaultMessage:'Vui lòng kích hoạt ít nhất 1 đơn vị vận chuyển cho sản phẩm của bạn.'});
          } else if (ref_logistic_channel_id.length == 0) {
            errorLogistic = formatMessage({defaultMessage:'Vui lòng kích hoạt ít nhất 1 đơn vị vận chuyển cho sản phẩm của bạn.'});
          }
        }

        (channelsAvailable[key] || []).forEach(_attribute => {
          let _value = values[`${key}-property-${_attribute.id}`];
          let unit = values[`${key}-property-${_attribute.id}-unit`];
          if (_value != undefined && _value != null) {
            if (_attribute.input_type == ATTRIBUTE_VALUE_TYPE.TEXT || _attribute.input_type == ATTRIBUTE_VALUE_TYPE.NUMERIC) {
              attribute_values.push({ id: _attribute.id, value: String(_value), unit: unit?.value || null })
            }
            if (_attribute.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT) {
              attribute_values.push({ id: _attribute.id, value: String(_value.value), unit: unit?.value || null })
            }
            if (_attribute.input_type == ATTRIBUTE_VALUE_TYPE.DATE) {
              attribute_values.push({ id: _attribute.id, value: String(_value), unit: unit?.value || null })
            }
            if (_attribute.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT) {
              attribute_values.push({ id: _attribute.id, value: _value.map(_v => _v.value).join(','), unit: unit?.value || null })
            }
          }
        });

        _channel.stores.filter(_store => !!_store.status && _store.isSelected).forEach(_store => {
          products.push({
            store_id: _store.id,
            name: currentProduct.name,
            connector_channel_code: key,
            sme_product_id: currentProduct.id,
            sc_brand_id: parseInt(values[`brand-${key}`].value),
            ref_category_id: String(channels[key].category.ref_id),
            attribute_values: attribute_values.length == 0 ? null : attribute_values,
            ref_logistic_channel_id,
            is_valid_logistic: values[`is_valid_logistic-${key}`] ? 1 : 0
          })
        })
      });


      if (!!errorLogistic) {
        setErrorMessage(errorLogistic)
        return
      }

      setFieldValue(`__changed__`, false)
      let { data, errors } = await scSaveSmeProduct({
        variables: {
          sme_products: products,
          list_product_id: (data?.scGetSmeProduct || []).filter(_scproduct=>{
            return !products.some(_proUpdate => {
              return _proUpdate.store_id == _scproduct.store_id && _scproduct.connector_channel_code == _proUpdate.connector_channel_code
            })
          }).map(_scproduct => _scproduct.id)
        }
      })

      if (!!errors || !data.scSaveSmeProduct.success) {
        setFieldValue(`__changed__`, true)
        if (!!errors)
          setErrorMessage(errors[0].message)
        else {
          setErrorMessage(data.scSaveSmeProduct.message)
        }
      } else {
        let { data, errors } = await scProductSyncUp({
          variables: {
            sme_product_id: currentProduct.id
          }
        })

        if (!!errors || !data.scProductSyncUp.success) {
          if (!!errors)
            setErrorMessage(errors[0].message)
          else {
            setErrorMessage(data.scProductSyncUp.message)
          }
        } else {
          setConfirmSuccess(true)
        }
      }
    } catch (error) {
      console.log('error', error)
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }


  if (initing) {
    return (
      <div className="row" data-sticky-container style={{ justifyContent: 'center', alignItems: 'center' }} >
        <span className="spinner spinner-primary" style={{ marginTop: 20 }} ></span>
      </div>
    )
  }

  let channelKeys = Object.keys(channels);

  return (
    <div className="row " data-sticky-container>
      <div className="col-9">
        <Form>
          {
            !!errorMessage && <div className='bg-danger text-white py-4 px-4  rounded-sm mb-4' >
              <span>{errorMessage}</span>
            </div>
          }
          <ProductStep current={1} />

          <div style={{ minHeight: 'calc(100vh - 350px)' }}>
            {
              channelKeys.map(_key => {
                return (
                  <ProductChannels key={_key} connector_channel_code={_key} last_category_selected={channels[_key].last_category_selected} />
                )
              })
            }
            {
              channelKeys.length == 0 && <Card >
                <CardBody style={{ textAlign: 'center' }} >
                  <p className='mb-1' >{formatMessage({defaultMessage:'Bạn chưa kết nối với gian hàng/kênh bán nào.'})}</p>
                  <p style={{ fontStyle: 'italic' }} >{formatMessage({defaultMessage:'Vui lòng kết nối để thực hiện Đăng bán sản phẩm.Lưu ý: Thông tin của bạn đã được lưu nháp trên Sản phẩm Upbase.'})}</p>
                  <Link className="btn btn-primary" style={{ width: 150 }} to='/setting/channels' >{formatMessage({defaultMessage:'KẾT NỐI NGAY'})}</Link>
                </CardBody>
              </Card>
            }
          </div>
          <div className='d-flex justify-content-end' >
            <button className="btn btn-secondary mr-2" style={{ width: 150 }} onClick={e => {
              e.preventDefault()
              history.push('/products/list')
            }} >{formatMessage({defaultMessage:'Hủy bỏ'})}</button>
            <button className="btn btn-secondary mr-2" style={{ width: 150 }} type="submit" onClick={async (e) => {
              e.preventDefault();
              setFieldValue('description_html_init', values['description_html'])
              setStep(0)
            }}>{formatMessage({defaultMessage:'Quay lại'})}</button>
            <button className="btn btn-primary" style={{ width: 150 }} type="submit" onClick={async (e) => {
              e.preventDefault();
              let error = await validateForm(values)
              console.log('error', error, values, channels)
              if (Object.values(error).length != 0) {
                handleSubmit()
                setErrorMessage(formatMessage({defaultMessage:'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ'}))
                return;
              }

              let _channels = Object.keys(channels).filter(_code => values[`category-${_code}-selected`] && channels[_code].stores?.some(_store => _store.isSelected));
              if (_channels.length == 0) {
                setErrorMessage(formatMessage({defaultMessage:'Bạn cần chọn tối thiểu 1 gian hàng'}))
                return;
              }


              setErrorMessage(false)
              let checkDiffStore = _.difference(values['__store_last_selected__'], _checkStoreChange(values, _channels))
              console.log('_check', values['__store_last_selected__'], checkDiffStore)
              if (checkDiffStore.length > 0) {
                setConfirmContinueWhenChangeStore(true)
              } else {
                await _saveProduct(values, _channels)
              }
            }}
              disabled={channelKeys.length == 0}
            >{formatMessage({defaultMessage:'Lưu và đăng bán'})}</button>
          </div>
        </Form>
        <LoadingDialog show={loading} fitWith={true} title={formatMessage({defaultMessage:'UpBase đang cập nhật lại thông tin sản phẩm. Bạn vui lòng chờ trong giây lát. Lưu ý không đóng cửa sổ này khi UpBase chưa xử lý xong dữ liệu.'})} />
        <Modal
          show={confirmSuccess}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          backdrop={'static'}
        >
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            <div className="mb-4" >{formatMessage({defaultMessage:'Đã cập nhật xong thông tin, sản phẩm đang được đồng bộ lên sàn.'})}</div>

            <div className="form-group mb-0">
              <Link
                type="button"
                to='/products/list'
                className="btn btn-light btn-elevate mr-3"
                style={{ width: 180 }}
              >
                <span className="font-weight-boldest">{formatMessage({defaultMessage:'Về sản phẩm UpBase'})}</span>
              </Link>
              <Link
                type="button"
                to='/products/syncs'
                className={`btn btn-primary font-weight-bold`}
                style={{ width: 180 }}
              >
                <span className="font-weight-boldest">{formatMessage({defaultMessage:'Xem thông tin đồng bộ'})}</span>
              </Link>
            </div>
          </Modal.Body>
        </Modal >
        <Modal
          show={confirmContinueWhenChangeStore}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setConfirmContinueWhenChangeStore(false)}
        >
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            <div className="mb-4" >{formatMessage({defaultMessage:'Sản phẩm sẽ bị ẩn trên những gian hàng bạn bỏ tích chọn. Bạn vẫn muốn sửa sản phẩm?'})}</div>

            <div className="form-group mb-0">
              <button
                type="button"
                className="btn btn-light btn-elevate mr-3"
                style={{ width: 180 }}
                onClick={() => setConfirmContinueWhenChangeStore(false)}
              >
                <span className="font-weight-boldest">{formatMessage({defaultMessage:'Huỷ'})}</span>
              </button>
              <button
                type="button"
                className={`btn btn-primary font-weight-bold`}
                style={{ width: 180 }}
                onClick={async () => {
                  setConfirmContinueWhenChangeStore(false)
                  let _channels = Object.keys(channels).filter(_code => values[`category-${_code}-selected`] && channels[_code].stores?.some(_store => _store.isSelected));
                  await _saveProduct(values, _channels)
                }}
              >
                <span className="font-weight-boldest">{formatMessage({defaultMessage:'Xác nhận'})}</span>
              </button>
            </div>
          </Modal.Body>
        </Modal >
      </div>
    </div>
  )
}
