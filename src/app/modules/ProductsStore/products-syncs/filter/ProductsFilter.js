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
import { PRODUCT_SYNC_STATUS, TYPE_COUNT } from "../../ProductsUIHelpers";
import mutate_scProductSyncUp_raw from "../../../../../graphql/mutate_scProductSyncUp_raw";
import query_scStatisticUpbaseSmeProducts from "../../../../../graphql/query_scStatisticUpbaseSmeProducts";
import { formatNumberToCurrency } from '../../../../../utils'
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import mutate_scProductSyncUpOnly from '../../../../../graphql/mutate_scProductSyncUpOnly'
import { Dropdown } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { useIntl } from "react-intl";
export function ProductsFilter({ onDelete, onHide, setStoreDisconnect }) {
  const location = useLocation()
  const history = useHistory()
  const { addToast } = useToasts();
  const {formatMessage} = useIntl()
  const params = queryString.parse(useLocation().search.slice(1, 100000))

  let store_id = useMemo(() => {
    try {
      let store = !!params?.store ? parseInt(params?.store) : null
      if (!store || Number.isNaN(store)) {
        return null
      }
      return store
    } catch (error) {
      return null
    }
  }, [params.store])

  const { data: dataStore, loading } = useQuery(query_sc_stores_basic, {
    fetchPolicy: 'cache-and-network'
  })
  const { data } = useQuery(query_scStatisticUpbaseSmeProducts, {
    variables: {
      q: params?.name || '',
      store_id: store_id,
    },
    fetchPolicy: 'cache-and-network',
    pollInterval: location.pathname == "/product-stores/syncs" ? 3000 : 0
  })

  // const [scProductSyncUp] = useMutation(mutate_scProductSyncUpOnly, {
  //   refetchQueries: ['scGetUpbaseSmeProducts', 'scStatisticUpbaseSmeProducts'],
  //   onCompleted: (data) => {
  //     setIds([])
  //   }
  // })


  // Products UI Context
  const { ids, setIds } = useProductsUIContext();
  
  useEffect(() => {
    // return () => { setIds([]) }
  }, [location.search])

  const [current, options] = useMemo(() => {
    let _options = dataStore?.sc_stores?.filter(_store => !params?.channel || _store?.connector_channel_code == params?.channel)
      .map(_store => {
        let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store?.connector_channel_code)
        return { label: _store?.name, value: _store?.id, logo: _channel?.logo_asset_url }
      }) || [];
    let _current = _options.find(_store => _store?.value == params?.store)
    return [_current, _options]
  }, [dataStore, params])

  return (
    <>
      <div
        className={`d-flex align-items-center flex-wrap mb-8`}
      >
        <div style={{
          maxWidth: 270, border: (!params?.sync_status && params?.sync_status !== '0') ? '1px solid #FE5629' : '1px solid #D9D9D9',
          borderRadius: 4, padding: 16,

          marginRight: 16, flex: 1, cursor: 'pointer'
        }}
          onClick={e => {
            e.preventDefault()
            history.push(`/product-stores/syncs?${queryString.stringify({
              ...params,
              page: 1,
              sync_status: null
            })}`)
          }} >
          <h6>{formatMessage({defaultMessage:'Tất cả'})}</h6>
          <p className='mb-0 mt-4' >
            <span style={{ fontSize: 24 }} >
              {formatNumberToCurrency(data?.scStatisticUpbaseSmeProducts?.total)}
            </span> {formatMessage({defaultMessage:'sản phẩm'})}
          </p>
        </div>
        <div style={{
          maxWidth: 270, border: params?.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_SYNCING ? '1px solid #FE5629' : '1px solid #D9D9D9',
          borderRadius: 4, padding: 16,

          marginRight: 16, flex: 1, cursor: 'pointer'
        }}
          onClick={e => {
            e.preventDefault()
            history.push(`/product-stores/syncs?${queryString.stringify({
              ...params,
              page: 1,
              sync_status: PRODUCT_SYNC_STATUS.SYNC_STATUS_SYNCING
            })}`)
          }} >
          <h6>{formatMessage({defaultMessage:'Đang đồng bộ'})}</h6>
          <p className='mb-0 mt-4' >
            <span style={{ fontSize: 24 }} >
              {formatNumberToCurrency(data?.scStatisticUpbaseSmeProducts?.total_syncing)}
            </span> {formatMessage({defaultMessage:'sản phẩm'})}
          </p>
        </div>
        <div style={{
          maxWidth: 270, border: params?.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_ERROR ? '1px solid #FE5629' : '1px solid #D9D9D9',
          borderRadius: 4, padding: 16,

          marginRight: 16, flex: 1, cursor: 'pointer'
        }}
          onClick={e => {
            e.preventDefault()
            history.push(`/product-stores/syncs?${queryString.stringify({
              ...params,
              page: 1,
              sync_status: PRODUCT_SYNC_STATUS.SYNC_STATUS_ERROR
            })}`)
          }} >
          <h6>{formatMessage({defaultMessage:'Đồng bộ lỗi'})}</h6>
          <p className='mb-0 mt-4' >
            <span style={{ fontSize: 24 }} >
              {formatNumberToCurrency(data?.scStatisticUpbaseSmeProducts?.total_error)}
            </span> {formatMessage({defaultMessage:'sản phẩm'})}
          </p>
        </div>
        <div style={{
          maxWidth: 270, border: params?.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_SYNCED ? '1px solid #FE5629' : '1px solid #D9D9D9',
          borderRadius: 4, padding: 16,
          flex: 1, cursor: 'pointer'
        }}
          onClick={e => {
            e.preventDefault()
            history.push(`/product-stores/syncs?${queryString.stringify({
              ...params,
              page: 1,
              sync_status: PRODUCT_SYNC_STATUS.SYNC_STATUS_SYNCED
            })}`)
          }} >
          <h6>{formatMessage({defaultMessage:'Đã đồng bộ'})}</h6>
          <p className='mb-0 mt-4' >
            <span style={{ fontSize: 24 }} >
              {formatNumberToCurrency(data?.scStatisticUpbaseSmeProducts?.total_synced)}
            </span> {formatMessage({defaultMessage:'sản phẩm'})}
          </p>
        </div>
      </div>
      <div className="row mb-8 mt-16 w-100">
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
        <div className='col-3 ' style={{zIndex: 99}}>
          <Select options={options}
            className='w-100'
            placeholder={formatMessage({defaultMessage:'Gian hàng'})}
            isClearable
            isLoading={loading}
            value={current}
            onChange={value => {
              console.log('value', value)
              if (!!value) {
                history.push(`/product-stores/syncs?${queryString.stringify({
                  ...params,
                  page: 1,
                  store: value.value
                })}`)
              } else {
                history.push(`/product-stores/syncs?${queryString.stringify({
                  ...params,
                  page: 1,
                  store: undefined
                })}`)
              }
            }}
            
            formatOptionLabel={(option, labelMeta) => {
              return <div style={{zIndex: 10}}> <img src={option.logo} style={{ width: 20, height: 20, marginRight: 8 }} /> {option.label}</div>
            }}
          />
        </div>
        {/* <div style={{ flex: 1, justifyContent: 'flex-end', display: 'flex' }} >
          <Dropdown drop='down'>
            <Dropdown.Toggle className='btn-outline-secondary' >
              Chọn
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                if (ids.length == 0) {
                  addToast('Vui lòng chọn sản phẩm', { appearance: 'warning' });
                  return;
                }

                let idsDisconnect = ids.filter(_pro => _pro.store_status != 1).map(_pro => _pro.store_name)
                if (idsDisconnect.length > 0) {
                  setStoreDisconnect(idsDisconnect)
                } else {
                  await Promise.all(ids.filter(_pro => (_pro.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_ERROR ||
                    _pro.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_LOADED ||
                    _pro.sync_status == PRODUCT_SYNC_STATUS.SYNC_STATUS_OUT_OF_SYNC)).map(_pro => {
                      return scProductSyncUp({
                        variables: {
                          // sme_product_id: _pro.sme_product_id,
                          products: [_pro.id]
                        }
                      })
                    }))
                  addToast('Bắt đầu đồng bộ lên gian gian hàng', { appearance: 'success' });
                  setIds([])
                }
              }} >Đồng bộ</Dropdown.Item>
              {/* <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                if (ids.length == 0) {
                  addToast('Vui lòng chọn sản phẩm', { appearance: 'warning' });
                  return;
                }
                setIds([])
              }} >Huỷ đồng bộ</Dropdown.Item> */}
            {/* </Dropdown.Menu>
          </Dropdown>
        </div> */} 
      </div>
    </>
  );
}
