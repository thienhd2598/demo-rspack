// React bootstrap table next =>
// DOCS: https://react-bootstrap-table.github.io/react-bootstrap-table2/docs/
// STORYBOOK: https://react-bootstrap-table.github.io/react-bootstrap-table2/storybook/index.html
import React, { useMemo } from "react";
import { Checkbox } from "../../../../../_metronic/_partials/controls";
import ProductRow from './ProductRow'
import Pagination from '../../../../../components/Pagination'
import { useLocation, useRouteMatch } from "react-router-dom";
import queryString from 'querystring'
import { useLazyQuery, useQuery } from "@apollo/client";
import query_sc_products from "../../../../../graphql/query_sc_products";
import { useIntl } from "react-intl";
export function ProductsTable({ selectedId, setSelectedId, onSync, loadingSync, timeRefresh }) {
  const routeMatch = useRouteMatch()
  const params = queryString.parse(useLocation().search.slice(1, 100000))
  const {formatMessage} = useIntl()
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

  const [fetch, { data, loading, refetch, called }] = useLazyQuery(query_sc_products, {
    variables: {
      store_id: !!routeMatch?.params?.shopID ? parseInt(routeMatch?.params?.shopID) : null,
      q: params?.q || '',
      first: limit,
      page,
      sync_status: 0
    },
    fetchPolicy: 'cache-and-network',
  })

  useMemo(() => {
    if (called) {
      refetch()
    } else {
      fetch()
    }
  }, [timeRefresh, called])

  let totalRecord = data?.sc_products?.paginatorInfo?.total || 0
  let totalPage = Math.ceil(totalRecord / limit)
  console.log('totalPage', data?.sc_products?.data, totalPage, totalRecord, limit)

  let isSelected = selectedId.length == data?.sc_products?.data?.length
  return (
    <div style={{ height: 'calc(100vh - 190px)', overflowY: 'scroll' }}>
      <table className="table product-list table-head-bg product-list table-borderless  table-vertical-center fixed"  >
        <thead>
          <tr className="font-size-lg">
            <th style={{fontSize: '14px'}}>
              <Checkbox
                inputProps={{
                  'aria-label': 'primary checkbox',
                }}
                isSelected={isSelected}
                onChange={() => {
                  if (isSelected) {
                    setSelectedId([])
                  } else {
                    setSelectedId(data?.sc_products?.data?.filter(_pro => _pro.sync_status == 0).map(_pro => _pro.id))
                  }
                }}
              />
            </th>
            <th style={{fontSize: '14px'}} width="30%" >
              {formatMessage({defaultMessage:'Tên sản phẩm'})}
            </th>
            <th style={{fontSize: '14px'}} >
            {formatMessage({defaultMessage:'Phân loại hàng'})}
            </th>
            <th style={{fontSize: '14px'}} >
            {formatMessage({defaultMessage:'Giá niêm yết'})}
            </th>
            <th style={{fontSize: '14px'}} >
            {formatMessage({defaultMessage:'Tồn kho'})}
            </th>
            <th style={{fontSize: '14px'}} >
            {formatMessage({defaultMessage:'Trạng thái'})}
            </th>
            <th style={{ minWidth: 92, maxWidth: 92, width: 92 }} >
            {formatMessage({defaultMessage:'Thao tác'})}
            </th>
          </tr>
        </thead>
        <tbody >
          {
            loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
              <span className="ml-3 spinner spinner-primary"></span>
            </div>
          }
          {
            (data?.sc_products?.data || []).map(_product => {
              return <ProductRow key={`product-row-${_product.id}`} product={_product}
                selectedId={selectedId} setSelectedId={setSelectedId}
                onSync={onSync} loadingSync={loadingSync}
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
        count={data?.sc_products?.data?.length}
        basePath={'/products/list'}
        emptyTitle={formatMessage({defaultMessage:'Chưa có sản phẩm nào'})}
      />
    </div>
  );
}
