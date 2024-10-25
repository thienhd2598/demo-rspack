// React bootstrap table next =>
// DOCS: https://react-bootstrap-table.github.io/react-bootstrap-table2/docs/
// STORYBOOK: https://react-bootstrap-table.github.io/react-bootstrap-table2/storybook/index.html
import React, { useMemo, useState } from "react";
import * as uiHelpers from "../ProductsUIHelpers";
import {
  toAbsoluteUrl,
} from "../../../../_metronic/_helpers";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import { useQuery } from "@apollo/client";
import query_ScGetSmeProducts from '../../../../graphql/query_ScGetSmeProducts'
import ProductRow from './ProductRow'
import Pagination from '../../../../components/Pagination'
import { useLocation, useHistory, Link } from "react-router-dom";
import queryString from 'querystring'
import SVG from "react-inlinesvg";
import { useProductsUIContext } from "../ProductsUIContext";
import { Modal } from "react-bootstrap";
import { useIntl } from "react-intl";


const changeSort = (type) => {
  if (!type) {
    return 'asc'
  }
  if (type == 'asc') {
    return 'desc'
  }
  if (type == 'desc') {
    return null
  }
}
const parseOrderToParams = (order) => {
  return Object.keys(order).map(key => !!order[key] ? `${key}:${order[key]}` : null).filter(_vv => !!_vv).join(';')
}


export function ProductsTable({ onDelete, onHide, onConfirmSyncDown }) {
  const history = useHistory()
  const params = queryString.parse(useLocation().search.slice(1, 100000))
  const { ids, setIds } = useProductsUIContext();
  const [storeDisconnect, setStoreDisconnect] = useState([])
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
  let orderBy = useMemo(() => {

    if (!params.order) {
      return null
    }

    let _orders = {}
    try {
      params.order.split(';').forEach(element => {
        let _elementSplit = element.split(':')
        if (_elementSplit.length == 2) {
          if (_elementSplit[1].trim() == 'asc' || _elementSplit[1].trim() == 'desc') {
            _orders = {
              column: _elementSplit[0].trim(),
              direction: _elementSplit[1].trim()
            }
          }
        }
      });
      if (Object.keys(_orders).length == 0) {
        return null
      }
      return _orders
    } catch (error) {
      return null
    }
  }, [params.order])
  let stock = useMemo(() => {
    if (params.type == uiHelpers.TYPE_COUNT.SAP_HET_HANG) {
      return 1
    }
    if (params.type == uiHelpers.TYPE_COUNT.HET_HANG) {
      return 2
    }
    return null
  }, [params.type])
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
  let status = useMemo(() => {
    if (params.type == uiHelpers.TYPE_COUNT.DANG_HOAT_DONG) {
      return 10
    }
    if (params.type == uiHelpers.TYPE_COUNT.DA_AN) {
      return 0
    }
    return null
  }, [params.type])

  const { data, loading } = useQuery(query_ScGetSmeProducts, {
    variables: {
      per_page: limit,
      page: page,
      q: !!params.name ? params.name : '',
      order_by: orderBy,
      connector_channel_code: params?.channel,
      store_id: store_id,
      stock: stock,
      status: status
    },
    fetchPolicy: 'cache-and-network'
  })

  let totalRecord = data?.ScGetSmeProducts?.total || 0
  let totalPage = Math.ceil(totalRecord / limit)


  const isSelectAll = ids.length > 0 && ids.length == data?.ScGetSmeProducts?.products?.length;
  return (
    <div style={{
      boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
      minHeight: 300,
      borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6
    }} >
      <table className="table table-borderless  table-vertical-center fixed"  >
        <thead style={{
          borderBottom: '1px solid #F0F0F0',
        }}>
          <tr className="font-size-lg">
            <th width="30%" >
              {formatMessage({defaultMessage: 'Tên sản phẩm trên sàn'})}
            </th>
            <th  >
            {formatMessage({defaultMessage: 'Phân loại hàng'})}
            </th>
            <th width='120' >
              <a onClick={e => {
                history.push(`/products/on-stores?${queryString.stringify({
                  ...params,
                  page: 1,
                  order: parseOrderToParams({
                    price: changeSort(orderBy?.direction)
                  })
                })}`)
              }} >
                 {formatMessage({defaultMessage: 'Giá niêm yết'})}
                <span className="svg-icon svg-icon-md svg-icon-control">
                  <SVG src={orderBy?.column != 'price' ? toAbsoluteUrl("/media/svg/ic_sort_.svg") : toAbsoluteUrl(`/media/svg/ic_${orderBy?.direction}_.svg`)} />
                </span>
              </a>
            </th>
            <th width='90'  >
              <a onClick={e => {
                history.push(`/products/on-stores?${queryString.stringify({
                  ...params,
                  page: 1,
                  order: parseOrderToParams({
                    stock: changeSort(orderBy?.direction)
                  })
                })}`)
              }} >
                 {formatMessage({defaultMessage: 'Tồn kho'})}
                <span className="svg-icon svg-icon-md svg-icon-control">
                  <SVG src={orderBy?.column != 'stock' ? toAbsoluteUrl("/media/svg/ic_sort_.svg") : toAbsoluteUrl(`/media/svg/ic_${orderBy.direction}_.svg`)} />
                </span>
              </a>
            </th>
            <th width='120'  >
            {formatMessage({defaultMessage: 'Trạng thái'})}
            </th>
            <th style={{ minWidth: 92, maxWidth: 92, width: 92 }} >
            {formatMessage({defaultMessage: 'Thao tác'})}
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
            data?.ScGetSmeProducts?.products?.map(_product => {
              return <ProductRow key={`product-row-${_product.id}`} product={_product}
                op_connector_channels={data?.op_connector_channels || []}
                sc_stores={data?.sc_stores || []}
                onDelete={onDelete}
                onHide={onHide}
                onConfirmSyncDown={onConfirmSyncDown}
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
        count={data?.ScGetSmeProducts?.products?.length}
        basePath={'/products/on-stores'}
        emptyTitle= {formatMessage({defaultMessage: 'Chưa có sản phẩm nào'})}
      />
      <Modal
        show={storeDisconnect?.length != 0}
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        onHide={() => setStoreDisconnect([])}
      >
        <Modal.Body className="overlay overlay-block cursor-default text-center">
          <div className="mb-4" > {formatMessage({defaultMessage: 'Kết nối đến gian hàng'})} {storeDisconnect?.join(', ')}  {formatMessage({defaultMessage: 'không khả dụng. Vui lòng kết nối lại để thực hiện thao tác này'})}.</div>

          <div className="form-group mb-0">
            <button
              type="button"
              className="btn btn-light btn-elevate mr-3"
              style={{ width: 150 }}
              onClick={() => setStoreDisconnect([])}
            >
              <span className="font-weight-boldest">{formatMessage({defaultMessage: 'Bỏ qua'})}</span>
            </button>
            <Link
              type="button"
              to='/setting/channels'
              className={`btn btn-primary font-weight-bold`}
              style={{ width: 150 }}
            >
              <span className="font-weight-boldest">{formatMessage({defaultMessage:'Kết nối lại'})}</span>
            </Link>
          </div>
        </Modal.Body>
      </Modal >
    </div>
  );
}
