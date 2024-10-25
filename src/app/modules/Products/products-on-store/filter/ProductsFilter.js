import React, { useEffect, useMemo, useState } from "react";
import { Formik } from "formik";
import { isEqual } from "lodash";
import { useProductsUIContext } from "../../ProductsUIContext";
import { FormattedMessage } from "react-intl";
import { Link, useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring'
import { useMutation, useQuery } from "@apollo/client";
import Select from "react-select";
import ProductCount from "./ProductCount";
import { TYPE_COUNT } from "../../ProductsUIHelpers";
import mutate_scProductSyncUp from "../../../../../graphql/mutate_scProductSyncUp";
import op_connector_channels from "../../../../../graphql/op_connector_channels";
import query_scStatisticScProducts from "../../../../../graphql/query_scStatisticScProducts";
import { formatNumberToCurrency } from '../../../../../utils'
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import { useIntl } from "react-intl";
export function ProductsFilter({ onDelete, onHide }) {
  const location = useLocation()
  const history = useHistory()
  const {formatMessage} = useIntl()
  const { data: dataStore, loading } = useQuery(query_sc_stores_basic, {
    fetchPolicy: 'cache-and-network'
  })
  const { data } = useQuery(op_connector_channels)

  const params = queryString.parse(location.search.slice(1, 100000))
  // Products UI Context
  const { ids, setIds } = useProductsUIContext();
  const [scProductSyncUp] = useMutation(mutate_scProductSyncUp, {
    refetchQueries: ['sme_catalog_product']
  })


  const { data: dataStatis, error } = useQuery(query_scStatisticScProducts, {
    fetchPolicy: 'cache-and-network'
  })

  useEffect(() => {
    return () => { setIds([]) }
  }, [location.search])

  const groupStatics = useMemo(() => {
    let inactive = 0;
    let incoming_out_stock = 0;
    let out_stock = 0;
    let active = 0;
    (dataStatis?.scStatisticScProducts || []).filter(_static => !params?.channel || _static.connector_channel_code == params?.channel).forEach(_static => {
      inactive += _static.group.inactive;
      incoming_out_stock += _static.group.incoming_out_stock;
      out_stock += _static.group.out_stock;
      active += _static.group.active;
    });
    return { active, incoming_out_stock, out_stock, inactive }
  }, [dataStatis, params?.channel])


  const [current, options] = useMemo(() => {
    let _options = dataStore?.sc_stores?.filter(_store => !params?.channel || _store.connector_channel_code == params?.channel)
      .map(_store => {
        let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
        return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
      }) || [];
    let _current = _options.find(_store => _store.value == params?.store)
    return [_current, _options]
  }, [dataStore, params])

  return (
    <>
      {!!data && (
        <div
          className={`d-flex align-items-center flex-wrap mb-8`}
        >
          {
            data?.op_connector_channels.map(_channel => {
              let statics = dataStatis?.scStatisticScProducts?.find(_static => _static.connector_channel_code == _channel.code)
              return (
                <div key={`_channel-${_channel.code}`} style={{
                  maxWidth: 270, border: params?.channel == _channel.code ? '1px solid #FE5629' : '1px solid #D9D9D9',
                  borderRadius: 4, padding: 16,

                  marginRight: 16, flex: 1, cursor: 'pointer'
                }}
                  onClick={e => {
                    e.preventDefault()
                    history.push(`/products/on-stores?${queryString.stringify({
                      ...params,
                      page: 1,
                      channel: _channel.code
                    })}`)
                  }} >
                  <span> <img src={_channel.logo_asset_url} style={{ width: 30, height: 30 }} /> {_channel.name}</span>
                  <p className='mb-0 mt-4' >
                    <span style={{ fontSize: 24 }} >
                      {formatNumberToCurrency(statics?.total_product || 0)}
                    </span> {formatMessage({defaultMessage:"sản phẩm"})}
                  </p>
                </div>
              )
            })
          }
          {
            !!params?.channel && <button className={`btn btn-secondary font-weight-bold mx-2`}
              style={{
                borderRadius: 30,
                paddingTop: 4, paddingBottom: 4,
                backgroundColor: '#545454',
                color: 'white'
              }}
              onClick={e => {
                e.preventDefault();
                history.push(`/products/on-stores?${queryString.stringify({
                  ...params,
                  page: 1,
                  channel: undefined
                })}`)
              }}
            >
              {formatMessage({defaultMessage:"Xoá bộ lọc"})}
            </button>
          }
        </div>
      )}
      <div className="form-group row mb-8 mt-16">
        <div className="col-5 input-icon">
          <input type="text" className="form-control" placeholder={formatMessage({defaultMessage:"Tên sản phẩm/SKU"})}
            onBlur={(e) => {
              history.push(`${location.pathname}?name=${e.target.value}`)
            }}
            defaultValue={params.name || ''}
            onKeyDown={e => {
              if (e.keyCode == 13) {
                history.push(`${location.pathname}?name=${e.target.value}`)
                // e.target.blur();
              }
            }}
          />
          <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
        </div>
        <div className='col-3 ' >
          <Select options={options}
            className='w-100'
            placeholder={formatMessage({defaultMessage:'Gian hàng'})}
            isClearable
            isLoading={loading}
            value={current}
            onChange={value => {
              console.log('value', value)
              if (!!value) {
                history.push(`/products/on-stores?${queryString.stringify({
                  ...params,
                  page: 1,
                  store: value.value
                })}`)
              } else {
                history.push(`/products/on-stores?${queryString.stringify({
                  ...params,
                  page: 1,
                  store: undefined
                })}`)
              }
            }}
            formatOptionLabel={(option, labelMeta) => {
              return <div> <img src={option.logo} style={{ width: 20, height: 20, marginRight: 8 }} /> {option.label}</div>
            }}
          />
        </div>
      </div>
      <div className='d-flex w-100' >
        <div style={{ flex: 1 }} >
          <ul className="nav nav-tabs" id="myTab" role="tablist" style={{ borderBottom: 'none' }} >
            <li className="nav-item">
              <a className={`nav-link font-weight-normal ${!params.type ? 'active' : ''}`}
                style={{ fontSize: '1.15rem' }}
                onClick={e => {
                  history.push(`/products/on-stores?${queryString.stringify({
                    ...params,
                    page: 1,
                    type: ''
                  })}`)
                }}
              >{formatMessage({defaultMessage:"Tất cả"})}</a>
            </li>
            <li className="nav-item">
              <a className={`nav-link font-weight-normal ${params.type == TYPE_COUNT.DANG_HOAT_DONG ? 'active' : ''}`}
                style={{ fontSize: '1.15rem', minWidth: 200, alignItems: 'center', justifyContent: 'center' }}
                onClick={e => {
                  history.push(`/products/on-stores?${queryString.stringify({
                    ...params,
                    page: 1,
                    type: TYPE_COUNT.DANG_HOAT_DONG
                  })}`)
                }}
              >{formatMessage({defaultMessage:"Đang hoạt động"})} ({groupStatics.active})</a>
            </li>
            <li className="nav-item">
              <a className={`nav-link font-weight-normal ${params.type == TYPE_COUNT.SAP_HET_HANG ? 'active' : ''}`}
                style={{ fontSize: '1.15rem', minWidth: 200, alignItems: 'center', justifyContent: 'center' }}
                onClick={e => {
                  history.push(`/products/on-stores?${queryString.stringify({
                    ...params,
                    page: 1,
                    type: TYPE_COUNT.SAP_HET_HANG
                  })}`)
                }} >{formatMessage({defaultMessage:"Sắp hết hàng"})} ({groupStatics.incoming_out_stock})</a>
            </li>
            <li className="nav-item">
              <a className={`nav-link font-weight-normal ${params.type == TYPE_COUNT.HET_HANG ? 'active' : ''}`}
                style={{ fontSize: '1.15rem', minWidth: 140, alignItems: 'center', justifyContent: 'center' }}
                onClick={e => {
                  history.push(`/products/on-stores?${queryString.stringify({
                    ...params,
                    page: 1,
                    type: TYPE_COUNT.HET_HANG
                  })}`)
                }}
              >{formatMessage({defaultMessage:"Hết hàng"})} ({groupStatics.out_stock})</a>
            </li>
            <li className="nav-item">
              <a className={`nav-link font-weight-normal ${params.type == TYPE_COUNT.DA_AN ? 'active' : ''}`}
                style={{ fontSize: '1.15rem', minWidth: 120, alignItems: 'center', justifyContent: 'center' }}
                onClick={e => {
                  history.push(`/products/on-stores?${queryString.stringify({
                    ...params,
                    page: 1,
                    type: TYPE_COUNT.DA_AN
                  })}`)
                }}
              >{formatMessage({defaultMessage:"Đã ẩn"})} ({groupStatics.inactive})</a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
