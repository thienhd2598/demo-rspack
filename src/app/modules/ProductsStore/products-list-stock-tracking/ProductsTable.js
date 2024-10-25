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
import query_ScGetJobStockTracking from '../../../../graphql/query_ScGetJobStockTracking'
import ProductRow from './ProductRow'
import Pagination from '../../../../components/Pagination'
import { useLocation, useHistory, Link } from "react-router-dom";
import queryString from 'querystring'
import SVG from "react-inlinesvg";
import { useProductsUIContext } from "../ProductsUIContext";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { STATUS } from "./StockTrackingUIHelpers";
import { useIntl } from "react-intl";


export function ProductsTable({ products, setProducts, defaultWarehouse, dataWarehouse, sc_stores }) {
  const params = queryString.parse(useLocation().search.slice(1, 100000))
  const history = useHistory();
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
  }, [params.store]);

  let status = useMemo(
    () => {
      if (!params?.status) return null;

      return Number(params?.status);
    }, [params?.status]
  );

  let warehouseId = useMemo(
    () => {
      if (!params?.warehouseId) return +defaultWarehouse?.id;

      return Number(params?.warehouseId);
    }, [params?.warehouseId, defaultWarehouse]
  );

  let time_from = useMemo(
    () => {
      if (!params?.gt) return null;

      return Number(params?.gt);
    }, [params?.gt]
  );

  let time_to = useMemo(
    () => {
      if (!params?.lt) return null;

      return Number(params?.lt);
    }, [params?.lt]
  );


  const { data, loading, refetch } = useQuery(query_ScGetJobStockTracking, {
    variables: {
      per_page: limit,
      page: page,
      search: !!params.search ? params.search : '',
      store_id: store_id,
      synced_status: status,
      time_from: time_from,
      time_to: time_to,
      warehouse_id: warehouseId,   
    },
    fetchPolicy: 'cache-and-network',
    skip: !warehouseId
  });
  let totalRecord = data?.scGetJobStockTracking?.total || 0
  let totalPage = Math.ceil(totalRecord / limit);
  console.log(data?.scGetJobStockTracking?.job_stock)
  const isSelectAll = products?.length > 0 && products?.filter(x => data?.scGetJobStockTracking?.job_stock?.some(job => job?.id === x.id))?.length == data?.scGetJobStockTracking?.job_stock?.length;

  return (
    <div style={{
      boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
      minHeight: 300,
      borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6
    }} >
      
      <div className='d-flex w-100 mt-8' style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 1 }}>
          <div style={{ flex: 1 }} >
            <ul className="nav nav-tabs" id="myTab" role="tablist" style={{ borderBottom: 'none' }} >
              {
                STATUS.map((_tab, index) => {
                  const { title, status } = _tab;
                  const isActive = status === (params?.status == undefined ? '': params?.status)
                  return (
                    <li
                      key={`tab-order-${index}`}
                      className={` ${isActive ? 'active' : null} nav-item`}
                    >
                      <a className={`nav-link font-weight-normal ${isActive ? 'active' : ''}`}
                        style={{ fontSize: '13px' }}
                        onClick={() => {
                          setProducts([])
                          history.push(`/product-stores/list-stock-tracking?${queryString.stringify({
                            ...params,
                            page: 1,
                            status: status
                          })}`)
                        }}
                      >
                        {!status
                          ? <>{formatMessage(title)} ({(data?.scGetJobStockTracking?.total_fail +  data?.scGetJobStockTracking?.total_success) ?? 0})</>
                          : (
                            <>
                              {formatMessage(title)} ({
                                status == 0 ? data?.scGetJobStockTracking?.total_fail: data?.scGetJobStockTracking?.total_success ?? 0
                              })
                            </>
                          )}
                      </a>
                    </li>
                  )
                })
              }
            </ul>
          </div>
        </div>
      <table className="table table-borderless product-list table-vertical-center fixed"  >
        <thead 
        style={{ position: 'sticky', top: 84 ,background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', zIndex: 1, borderLeft: '1px solid #d9d9d9'}}
        >
          <tr className="font-size-lg">
            <th style={{fontSize: '14px', width: '30%'}} className="text-center">
                <div className="d-flex">
                  <Checkbox
                      size='checkbox-md'
                      inputProps={{'aria-label': 'checkbox',}}
                      isSelected={isSelectAll}
                      onChange={(e) => {
                          if (isSelectAll) {
                              setProducts(products.filter(x => !data?.scGetJobStockTracking?.job_stock?.some(job => job.id === x.id)))
                          } else {
                              const tempArray = [...products];
                              (data?.scGetJobStockTracking?.job_stock || []).forEach(job => {
                                  if (job && !products?.some(item => item.id === job.id)) {
                                      tempArray.push(job);
                                  }
                              })
                              setProducts(tempArray)
                          }
                      }}
                  />
                      {formatMessage({defaultMessage: 'Sản phẩm'})}
                  </div>
            </th>
            <th style={{fontSize: '14px', width: '15%'}} className="text-center" width='160' >
            {formatMessage({defaultMessage: 'Số lượng đẩy tồn'})}
              <span className="svg-icon svg-icon-md svg-icon-control ml-3">
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>
                      {formatMessage({defaultMessage: 'Tồn sẵn sàng bán từ sản phẩm kho đồng bộ lên tồn của sản phẩm trên sàn'})}
                    </Tooltip>
                  }
                >
                  <i role="button" class="fas fa-info-circle"></i>
                </OverlayTrigger>
              </span>
            </th>
            <th style={{fontSize: '14px', width: '15%'}} className="text-center">
            {formatMessage({defaultMessage: 'Kho'})}
            </th>
            <th style={{fontSize: '14px', width: '15%'}} className="text-center">
            {formatMessage({defaultMessage: 'Phương thức đẩy'})}
            </th>
            <th style={{fontSize: '14px', width: '10%'}} className="text-center">
            {formatMessage({defaultMessage: 'Trạng thái'})}
            </th>
            <th style={{fontSize: '14px', width: '15%'}} className="text-center">
            {formatMessage({defaultMessage: 'Thời gian đẩy tồn'})}
            </th>
          </tr>
        </thead>
        <tbody>
          {
            loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
              <span className="ml-3 spinner spinner-primary"></span>
            </div>
          }
          {console.log(data)}
          {
            data?.scGetJobStockTracking?.job_stock?.map((_job_stock, index) => {
              return <ProductRow
                stores={sc_stores}
                key={`product-row-${index}`}
                job_stock={_job_stock}
                isSelected={products?.some(_id => _id?.id == _job_stock?.id)}
                dataWarehouse={dataWarehouse}
                sc_stores={data?.sc_stores}
                setProducts={setProducts}
                op_connector_channels={data?.op_connector_channels || []}
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
        count={data?.scGetJobStockTracking?.job_stock?.length}
        basePath={'/product-stores/list-stock-tracking'}
        emptyTitle={formatMessage({defaultMessage: 'Chưa có lịch sử đầy tồn'})}
      />
    </div>
  );
}
