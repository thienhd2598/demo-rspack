// React bootstrap table next =>
// DOCS: https://react-bootstrap-table.github.io/react-bootstrap-table2/docs/
// STORYBOOK: https://react-bootstrap-table.github.io/react-bootstrap-table2/storybook/index.html
import React, { useEffect, useMemo, useState } from "react";
import * as uiHelpers from "../ProductsUIHelpers";
import {
  toAbsoluteUrl,
} from "../../../../_metronic/_helpers";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import { useMutation, useQuery } from "@apollo/client";
import query_scGetUpbaseSmeProducts from '../../../../graphql/query_scGetUpbaseSmeProducts'
import ProductRow from './ProductRow'
import Pagination from '../../../../components/Pagination'
import { useLocation, useHistory } from "react-router-dom";
import queryString from 'querystring'
import SVG from "react-inlinesvg";
import { useProductsUIContext } from "../ProductsUIContext";
import {useDidUpdate} from '../../../../hooks/useDidUpdate'
import { useToasts } from "react-toast-notifications";
import mutate_scProductSyncUpOnly from "../../../../graphql/mutate_scProductSyncUpOnly";
import { useIntl } from "react-intl";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";

export function ProductsTable({ onDelete, onHide, setStoreDisconnect }) {
  const location = useLocation()
  const {formatMessage} = useIntl()
  const params = queryString.parse(useLocation().search.slice(1, 100000))
  const { ids, setIds } = useProductsUIContext();
  const {addToast} = useToasts()
  const [scProductSyncUp] = useMutation(mutate_scProductSyncUpOnly, {
    refetchQueries: ['scGetUpbaseSmeProducts', 'scStatisticUpbaseSmeProducts'],
    onCompleted: (data) => {
      setIds([])
    }
  })
  let page = useMemo(() => {
    try {
      let _page = +params.page
      if (!Number.isNaN(_page)) {
        return _page
      } else {
        return 1
      }
    } catch (error) {
      return 1
    }
  }, [params.page])
  let limit = useMemo(() => {
    try {
      let _value = +params.limit
      if (!Number.isNaN(_value)) {
        return _value
      } else {
        return 25
      }
    } catch (error) {
      return 25
    }
  }, [params.limit])
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
  let sync_status = useMemo(() => {
    try {
      let _sync_status = !!params?.sync_status ? parseInt(params?.sync_status) : null
      if (!_sync_status || Number.isNaN(_sync_status)) {
        return null
      }
      return _sync_status
    } catch (error) {
      return null
    }
  }, [params.sync_status])

  
  let whereCondition = useMemo(
    () => {
      // setIds([])
      return {
        q: params?.name || '',
        store_id: store_id,
        sync_status: sync_status,
      }
    }, [params.name, store_id, sync_status]
  );


  const { data, loading } = useQuery(query_scGetUpbaseSmeProducts, {
    variables: {...whereCondition, per_page: limit, page: page},
    fetchPolicy: 'cache-and-network',
    pollInterval: location.pathname == "/product-stores/syncs" ? 3000 : 0
  })

  let totalRecord = data?.scGetUpbaseSmeProducts?.total || 0
  let totalPage = Math.ceil(totalRecord / limit)

  // const isSelectAll = ids.length > 0 && ids.length == data?.scGetUpbaseSmeProducts?.products?.length;
  const isSelectAll = ids.length > 0 && ids.filter(x => {
      return data?.scGetUpbaseSmeProducts?.products?.some(pro => pro.id === x.id);
  })?.length == data?.scGetUpbaseSmeProducts?.products?.length;

  // useEffect(() => {
  //   if(data) {
  //     setDuplicate((prev) => [...[...new Array(...prev, ...data?.scGetUpbaseSmeProducts?.products)].reduce((map, obj) => map.set(obj.id, obj), new Map()).values()])
  //   }
  // }, [data])
  // console.log(duplicate);
  useEffect(() => {
    console.log(data?.scGetUpbaseSmeProducts?.products);
  }, [data])
  return (
  <>
   <div style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 2, fontSize: 14 }} className="d-flex align-items-center mb-8" >
      <div className="d-flex" style={{ alignItems: 'center'}}> 
      <div className="text-primary mr-3" style={{fontSize: 14 , zIndex: 2}}>{formatMessage({defaultMessage:'Đã chọn'})}: {ids?.length} {formatMessage({defaultMessage:'sản phẩm'})}</div>
        <AuthorizationWrapper keys={['product_store_sync_up']}>
          <button disabled={!ids?.length} className={`btn ${ids?.length ? 'btn-primary' : 'btn-darkk' } `} style={{width: '160px', color: '#ffffff'}} onClick={async e => {
                    if (ids.length == 0) {
                  addToast(formatMessage({defaultMessage:'Vui lòng chọn sản phẩm'}), { appearance: 'warning' });
                  return;
                }

                let idsDisconnect = ids.filter(_pro => _pro.store_status != 1).map(_pro => _pro.store_name)
                if (idsDisconnect.length > 0) {
                  setStoreDisconnect(idsDisconnect)
                } else {
                  await Promise.all(ids.filter(_pro => (_pro.sync_status == uiHelpers.PRODUCT_SYNC_STATUS.SYNC_STATUS_ERROR ||
                    _pro.sync_status == uiHelpers.PRODUCT_SYNC_STATUS.SYNC_STATUS_LOADED ||
                    _pro.sync_status == uiHelpers.PRODUCT_SYNC_STATUS.SYNC_STATUS_OUT_OF_SYNC)).map(_pro => {
                      return scProductSyncUp({
                        variables: {
                          // sme_product_id: _pro.sme_product_id,
                          products: [_pro.id]
                        }
                      })
                    }))
                  addToast(formatMessage({defaultMessage:'Bắt đầu đồng bộ lên gian gian hàng'}), { appearance: 'success' });
                  setIds([])
                }
              }}>{formatMessage({defaultMessage:'Đồng bộ'})}</button>
        </AuthorizationWrapper>
       </div>
   </div>
       <div style={{
      boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
      minHeight: 300,
      borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6
    }} >
     
      <table className="table product-list  product-list table-borderless table-vertical-center fixed"  >
        <thead style={{ position: 'sticky', top: 82 ,background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', zIndex: 10, borderLeft: '1px solid #d9d9d9'}}>
          <tr className="font-size-lg">
            <th style={{fontSize: '14px'}}>
              <Checkbox
                inputProps={{
                  'aria-label': 'checkbox',
                }}
                isSelected={isSelectAll}
                // onChange={(e) => {
                //   if (isSelectAll) {
                //     setIds([])
                //   } else {
                //     setIds((data?.scGetUpbaseSmeProducts?.products || []).map(_pro => {
                //       let _store = (data?.sc_stores || []).find(_st => _st.id == _pro.store_id)
                //       return {
                //         id: _pro.id, sme_product_id: _pro.sme_product_id,
                //         sync_status: _pro.sync_status,
                //         store_status: _store?.status,
                //         store_name: _store?.name
                //       }
                //     }))
                //   }
                // }}
                onChange={(e) => {
                  if (isSelectAll) {
                    setIds(ids.filter(x => {
                      return !data?.scGetUpbaseSmeProducts?.products.find(_pro => _pro.id === x.id);
                  }))
                  } else {
                    const tempArray = [...ids];
                    (data?.scGetUpbaseSmeProducts?.products || []).forEach(_pro => {
                        if (_pro && !ids.some(item => item.id === _pro.id) ) {
                          let _store = (data?.sc_stores || []).find(_st => _st.id == _pro.store_id)
                      let prod =  {
                        id: _pro.id, sme_product_id: _pro.sme_product_id,
                        sync_status: _pro.sync_status,
                        store_status: _store?.status,
                        store_name: _store?.name
                      }
                            tempArray.push(prod);
                        }
                    })
                    setIds(tempArray)
                  }
              }}
              />
            </th>
            <th style={{fontSize: '14px'}}>
              {formatMessage({defaultMessage:'Tên sản phẩm'})}
            </th>
            <th style={{ minWidth: 120, maxWidth: 120, width: 120,fontSize: '14px' }}   >
            {formatMessage({defaultMessage:'Gian hàng'})}
            </th>
            <th width='150' style={{fontSize: '14px'}}>
              {formatMessage({defaultMessage:'Thời gian đồng bộ'})}
            </th>
            <th width='120' style={{fontSize: '14px'}}>
              {formatMessage({defaultMessage:'Trạng thái'})}
            </th>
            <th style={{ minWidth: 92, maxWidth: 92, width: 92, fontSize: '14px' }}  >
              {formatMessage({defaultMessage:'Thao tác'})}
            </th>
          </tr>
        </thead>
        <tbody style={{zIndex: 11}}>
          {
            loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
              <span className="ml-3 spinner spinner-primary"></span>
            </div>
          }
          {
            data?.scGetUpbaseSmeProducts?.products?.map(_product => {
              return <ProductRow key={`product-row-${_product.id}`} product={_product}
                op_connector_channels={data?.op_connector_channels || []}
                sc_stores={data?.sc_stores || []}
                onDelete={onDelete}
                onHide={onHide}
                setStoreDisconnect={setStoreDisconnect}
              />
            })
          }
        </tbody>
      </table>
      <Pagination
        page={page}
        totalPage={totalPage}
        loading={loading}
        limit={limit}
        totalRecord={totalRecord}
        count={data?.scGetUpbaseSmeProducts?.products?.length}
        basePath={'/product-stores/syncs'}
        emptyTitle={formatMessage({defaultMessage:'Chưa có sản phẩm nào'})}
      />
    </div>
  </>
  );
}
