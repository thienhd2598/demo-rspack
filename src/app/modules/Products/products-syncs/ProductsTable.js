// React bootstrap table next =>
// DOCS: https://react-bootstrap-table.github.io/react-bootstrap-table2/docs/
// STORYBOOK: https://react-bootstrap-table.github.io/react-bootstrap-table2/storybook/index.html
import React, { useMemo } from "react";
import * as uiHelpers from "../ProductsUIHelpers";
import {
  toAbsoluteUrl,
} from "../../../../_metronic/_helpers";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import { useQuery } from "@apollo/client";
import query_scGetUpbaseSmeProducts from '../../../../graphql/query_scGetUpbaseSmeProducts'
import ProductRow from './ProductRow'
import Pagination from '../../../../components/Pagination'
import { useLocation, useHistory } from "react-router-dom";
import queryString from 'querystring'
import SVG from "react-inlinesvg";
import { useProductsUIContext } from "../ProductsUIContext";
import { useIntl } from "react-intl";

export function ProductsTable({ onDelete, onHide, setStoreDisconnect }) {
  const location = useLocation()
  const params = queryString.parse(useLocation().search.slice(1, 100000))
  const { ids, setIds } = useProductsUIContext();
  const { formatMessage } = useIntl()
  let page = useMemo(() => {
    try {
      let _page = Number(params.page)
      if (!Number.isNaN(_page)) {
        return Math.max(1, _page)
      } else {
        return 1
      }
    } catch (error) {
      return 1
    }
  }, [params.page])
  let limit = useMemo(() => {
    try {
      let _value = Number(params.limit)
      if (!Number.isNaN(_value)) {
        return Math.max(25, _value)
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


  const { data, loading } = useQuery(query_scGetUpbaseSmeProducts, {
    variables: {
      q: params?.name || '',
      store_id: store_id,
      sync_status: sync_status,
      page,
      per_page: limit
    },
    fetchPolicy: 'cache-and-network',
    pollInterval: location.pathname == "/products/syncs" ? 3000 : 0
  })

  let totalRecord = data?.scGetUpbaseSmeProducts?.total || 0
  let totalPage = Math.ceil(totalRecord / limit)

  const isSelectAll = ids.length > 0 && ids.length == data?.scGetUpbaseSmeProducts?.products?.length;
  return (
    <div style={{
      boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
      minHeight: 300,
      borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6
    }} >
      <table className="table product-list  table-borderless  table-vertical-center fixed"  >
        <thead style={{
          borderBottom: '1px solid #F0F0F0',
        }}>
          <tr className="font-size-lg">
            <th style={{fontSize: '14px'}}>
              <Checkbox
                inputProps={{
                  'aria-label': 'checkbox',
                }}
                isSelected={isSelectAll}
                onChange={(e) => {
                  if (isSelectAll) {
                    setIds([])
                  } else {
                    setIds((data?.scGetUpbaseSmeProducts?.products || []).map(_pro => {
                      let _store = (data?.sc_stores || []).find(_st => _st.id == _pro.store_id)
                      return {
                        id: _pro.id, sme_product_id: _pro.sme_product_id,
                        sync_status: _pro.sync_status,
                        store_status: _store.status,
                        store_name: _store.name
                      }
                    }))
                  }
                }}
              />
            </th>
            <th style={{fontSize: '14px'}}>
              {formatMessage({defaultMessage:'Tên sản phẩm'})}
            </th>
            <th style={{ fontSize: '14px', minWidth: 120, maxWidth: 120, width: 120 }}   >
            {formatMessage({defaultMessage:'Gian hàng'})}
            </th>
            <th style={{fontSize: '14px'}} width='150'  >
            {formatMessage({defaultMessage:'Thời gian đồng bộ'})}
            </th>
            <th style={{fontSize: '14px'}} width='120'  >
            {formatMessage({defaultMessage:'Trạng thái'})}
            </th>
            <th style={{ minWidth: 92, maxWidth: 92, width: 92, fontSize: '14px' }}  >
            {formatMessage({defaultMessage:'Thao tác'})}
            </th>
          </tr>
        </thead>
        <tbody>
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
        basePath={'/products/syncs'}
        emptyTitle={formatMessage({defaultMessage:'Chưa có  phẩm nào'})}
      />
    </div>
  );
}
