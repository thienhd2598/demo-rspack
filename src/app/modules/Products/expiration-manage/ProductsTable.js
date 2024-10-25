// React bootstrap table next =>
// DOCS: https://react-bootstrap-table.github.io/react-bootstrap-table2/docs/
// STORYBOOK: https://react-bootstrap-table.github.io/react-bootstrap-table2/storybook/index.html
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as uiHelpers from "../ProductsUIHelpers";
import { useMutation, useQuery } from "@apollo/client";
import ModalInventoryExport from './dialog/ModalInventoryExport'
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring'
import { useProductsUIContext } from "../ProductsUIContext";
import {  OverlayTrigger, Tooltip } from "react-bootstrap";
import { formatNumberToCurrency } from "../../../../utils";
import client from "../../../../apollo";
import Select from "react-select";
import { useToasts } from "react-toast-notifications";
import { HomeOutlined, AddShoppingCartOutlined, AssignmentTurnedInOutlined, LocalShippingOutlined, WarningTwoTone, HistoryRounded, ChevronRightOutlined, LayersOutlined } from "@material-ui/icons";
import { useIntl } from "react-intl";
import Table from 'rc-table';
import 'rc-table/assets/index.css'
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { Link } from 'react-router-dom'
import InfoProduct from "../../../../components/InfoProduct";
import DateRangePicker from "rsuite/DateRangePicker";
import { OPTIONS_TYPE_FILTER } from "../ProductsUIHelpers";
import _, { omit } from "lodash";
import dayjs from "dayjs";
import query_sme_catalog_inventory_item_locations from "../../../../graphql/query_sme_catalog_inventory_item_locations";
import query_sme_catalog_inventory_item_location_aggregate from "../../../../graphql/query_sme_catalog_inventory_item_location_aggregate";
import Pagination from "../../../../components/Pagination";
export function ProductsTable({}) {
  const params = queryString.parse(useLocation().search.slice(1, 100000))
  const history = useHistory()
  const [count, setCount] = useState(null) 
  const [valueRangeTime, setValueRangeTime] = useState([])
  const [sort, setSort] = useState('desc_nulls_last');
  const { addToast } = useToasts();
  const { formatMessage } = useIntl()

  useMemo(() => {
      setSort(params?.sort ?? 'desc_nulls_last')
  }, [params?.sort]);

  useMemo(() => {
    if(params?.lt && params?.gt) {
      setValueRangeTime([new Date(params?.lt*1000), new Date(params?.gt*1000)])
    }
  }, [params?.lt, params?.gt])

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
  }, [params.limit]);
  let type = useMemo(() => {
    const currentTime = new Date()
    if (!params.type) {
      return {}
    }
    if (params.type == 'current') {
      return { expired_at: { _gt: currentTime } }
    }
    if (params.type == 'near_out_of_date') {
      return { 
        expired_at: { _gt: currentTime }, 
        expired_warning_at: {_lt: currentTime}
      }
    }
    if (params.type == 'stop_selling') {
      return {
        stop_sale_at: {_lt: currentTime},
        expired_at: { _gt: currentTime }, 
      }
    }
    if (params.type == 'out_of_date') {
      return { 
        expired_at: { _lt: currentTime }
      }
    }
    return {}
  }, [params.type]);

  let search = useMemo(() => {
    if(!params?.typeSearch) return {product: {name: {_ilike: `%${params?.name}%`}}}
    if(params?.typeSearch == 'variant_name') {
      return {
        product: {name: {_ilike: `%${params?.name}%`}}
      }
    }
    if(params?.typeSearch == 'sku') {
      return {
        variant: {sku: {_ilike: `%${params?.name}%`}}
      }
    }
    if(params?.typeSearch == 'lot_serial') {
      return {
        lot_number: {_ilike: `%${params?.name}%`}
      }
    }
  }, [params?.name, params?.typeSearch])

  const optionOrderBy = [
    {
      value: 'inbound_at',
      label: formatMessage({ defaultMessage: 'Ngày nhập kho' })
    },
    {
      value: 'expired_at',
      label: formatMessage({ defaultMessage: 'Ngày hết hạn' })
    },
    {
      value: 'stop_sale_at',
      label: formatMessage({ defaultMessage: 'Ngày dừng bán' })
    }
  ]

  const [orderBy, setOrderBy] = useState(optionOrderBy[0]);

  useMemo(
    () => {
      setOrderBy(optionOrderBy.find(element => element.value == params?.order_by) ?? optionOrderBy[0])
    }, [params?.order_by]
  );

  const rangeTime = useMemo(() => {
    if (!params?.gt || !params?.lt) return {}
    if(params?.typeFilter == 'expiration_date') {
      return {
        _and: {
          expired_at: {_gte: dayjs(params?.lt*1000), _lte: dayjs(params?.gt*1000)}
        }
      }
    }
    if(params?.typeFilter == 'production_date') {
      return {
        _and: {
          inbound_at: {_gte: dayjs(params?.lt*1000), _lte: dayjs(params?.gt*1000)}
        }
      }
    }
    return {
      _and: {
        inbound_at: {_gte: dayjs(params?.lt*1000), _lte: dayjs(params?.gt*1000)}
      }
    }
  }, [params?.typeFilter, params?.gt, params?.lt])

  const whereCondition = useMemo(() => {
    return {
      ...(!!params.name ? {
        ...type,
        ...search
      } : type),
    }
  }, [search, type, params?.page, params.name, params?.typeSearch])

  let whereConditionInventoryItems = useMemo(() => {
      return {
        expired_at: {_is_null: false},
        ...whereCondition,
        ...(!!params?.warehouseid ? {
          warehouse: {id: {_in: params?.warehouseid?.split(',').map(wh => +wh) }},

        } : {}),
        ...(!!params?.lt ? rangeTime : {}),
      }
    }, [whereCondition, params?.warehouseid,params?.lt, params?.gt, params?.typeFilter, params?.name]
  );

  let orderByInventories = useMemo(() => {
    return {
      [`${orderBy?.value}`]: sort,
    }
  }, [sort, orderBy])

  const { data: itemInventory, loading, error, refetch } = useQuery(query_sme_catalog_inventory_item_locations, {
    variables: {
      limit,
      offset: (page - 1) * limit,
      where: whereConditionInventoryItems,
      order_by: orderByInventories
    },
    fetchPolicy: 'no-cache',
  });

  const querySum = useMemo(() => {
    return {
      sumInventory: query_sme_catalog_inventory_item_location_aggregate,
    }
  }, [params?.warehouseid])

  useEffect(() => {
    const currentTime = new Date()
    try {
      Promise.all([
        client.query({
          query: querySum.sumInventory,
          fetchPolicy: 'network-only',
          variables: {
            "where": {
              ...(!!params.name ? search : {}),
              ...(!!params?.warehouseid ? {
                warehouse: {id: {_in: params?.warehouseid?.split(',').map(wh => +wh) }},
              } : {}),
              expired_at: {_is_null: false}
            }
          }
        }),
        client.query({
          query: querySum.sumInventory,
          fetchPolicy: 'network-only',
          variables: {
            "where": {
              ...(!!params.name ? search : {}),
              ...(!!params?.warehouseid ? {
                warehouse: {id: {_in: params?.warehouseid?.split(',').map(wh => +wh) }}
              } : {}),
              expired_at: { _gt: currentTime }
            }
          }
        }),
        client.query({
          query: querySum.sumInventory,
          fetchPolicy: 'network-only',
          variables: {
            "where": {
              ...(!!params.name ? search : {}),
              ...(!!params?.warehouseid ? {
                warehouse: {id: {_in: params?.warehouseid?.split(',').map(wh => +wh) }}
              } : {}),
              expired_at: { _gt: currentTime }, 
              expired_warning_at: {_lt: currentTime}
            }
          }
        }),
        client.query({
          query: querySum.sumInventory,
          fetchPolicy: 'network-only',
          variables: {
            "where": {
              ...(!!params.name ? search : {}),
              ...(!!params?.warehouseid ? {
                warehouse: {id: {_in: params?.warehouseid?.split(',').map(wh => +wh) }}
              } : {}),
              stop_sale_at: {_lt: currentTime},
              expired_at: { _gt: currentTime },
            }
          }
        }),
        client.query({
          query: querySum?.sumInventory,
          fetchPolicy: 'network-only',
          variables: {
            "where": {
              ...(!!params.name ? search : {}),
              ...(!!params?.warehouseid ? {
                warehouse: {id: {_in: params?.warehouseid?.split(',').map(wh => +wh) }}
              } : {}),
              expired_at: { _lt: currentTime }
            }
          }
        }),
      ]).then(res => {
        setCount({
          all: res[0].data?.sme_catalog_inventory_item_locations_aggregate?.aggregate?.count,
          current: res[1].data?.sme_catalog_inventory_item_locations_aggregate?.aggregate?.count,
          nearOutOfDate: res[2].data?.sme_catalog_inventory_item_locations_aggregate?.aggregate?.count,
          stopSelling: res[3].data?.sme_catalog_inventory_item_locations_aggregate?.aggregate.count,
          outOfDate: res[4].data.sme_catalog_inventory_item_locations_aggregate?.aggregate.count,
        })
      })
    } catch (error) {
   
    }
  }, [params?.warehouseid, params.name, type, params.type, params?.typeSearch])

  const timeDiff = (timestampt) => {
    const now = dayjs().startOf('day'); // Đặt thời gian hiện tại về đầu ngày
    const stopTime = dayjs(timestampt).startOf('day'); // Đặt thời gian của timestampt về đầu ngày
    const remainingDays = stopTime.diff(now, 'day');
    return remainingDays;
  }

  const _attributes = (product) => {

    let attributes = [];
    if (product?.variant?.attributes && product?.variant?.attributes.length > 0) {
      for (let index = 0; index < product?.variant?.attributes.length; index++) {
        const element = product?.variant?.attributes[index];
        attributes.push(`${element?.sme_catalog_product_attribute_value?.name}`);

      }
      return attributes.join(' - ');
    }
    return null
  }

  let totalRecord = (itemInventory?.sme_catalog_inventory_item_locations_aggregate?.aggregate?.count || 0) 
  let totalPage = Math.ceil(totalRecord / limit)

  const columns = [
    {
      title: <div className="d-flex align-items-center">
        <span className="ml-2">SKU</span>
      </div>,
      dataIndex: 'sku',
      key: 'sku',
      align: 'left',
      width: 150,
      fixed: 'left',
      render: (item, record) => {
        return (
          <div className='d-flex align-items-center'>
            <div className='d-flex ml-2'>
              <Link style={{ color: 'black' }} to={`/products/edit/${record?.product_id}`} target="_blank" >
                <InfoProduct
                  sku={record?.variant?.sku}
                  isSingle
                />
              </Link>
            </div>
          </div>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Tên hàng hóa' }),
      dataIndex: 'product',
      key: 'product',
      align: 'left',
      width: 250,
      render: (item, record) => {
        const imageLink = record?.variant?.sme_catalog_product_variant_assets?.length > 0 ? record?.variant?.sme_catalog_product_variant_assets[0] : {}
        return (
          <>
            <div className='d-flex align-items-center'>
              <OverlayTrigger
                overlay={
                  <Tooltip title='#1234443241434'>
                    <div style={{
                      backgroundColor: '#F7F7FA',
                      width: 160, height: 160,
                      borderRadius: 4,
                      overflow: 'hidden',
                      minWidth: 160
                    }} className='mr-2' >
                      {
                        !!imageLink?.asset_url && <img src={imageLink?.asset_url}
                          style={{ width: 160, height: 160, objectFit: 'contain' }} />
                      }
                    </div>
                  </Tooltip>
                }
              >
                <Link to={!record?.variant?.attributes?.length > 0 ? `/products/edit/${record?.product_id}` : `/products/stocks/detail/${record?.variant?.id}`} target="_blank">
                  <div style={{
                    backgroundColor: '#F7F7FA',
                    width: 20, height: 20,
                    borderRadius: 4,
                    overflow: 'hidden',
                    minWidth: 20
                  }} className='mr-2' >
                    {
                      !!imageLink?.asset_url && <img src={imageLink?.asset_url}
                        style={{ width: 20, height: 20, objectFit: 'contain' }} />
                    }
                  </div>
                </Link>
              </OverlayTrigger>
              <div>
                <div className='d-flex'>
                  <InfoProduct
                    name={record?.variant?.sme_catalog_product?.name}
                    isSingle
                    url={!record?.variant?.attributes?.length ? `/products/edit/${record?.product_id}` : `/products/stocks/detail/${record?.variant?.id}`}
                  />
                </div>
              </div>
            </div>
            {!!_attributes(record) && <div className='mt-2'><span className='text-secondary-custom font-weight-normal fs-12'>{_attributes(record)}</span></div>}
          </>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Mã lô' }),
      dataIndex: 'lot_number',
      key: 'lot_number',
      align: 'center',
      width: 100,
      render: (item, record) => {
        return (
          <b>{record?.lot_number || '--'}</b>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Ngày nhập hàng' }),
      dataIndex: 'inbound_at',
      key: 'inbound_at',
      align: 'center',
      width: 150,
      render: (item, record) => {
        return (
          <>
          <b>{record?.inbound_at ? dayjs(record?.inbound_at).startOf('day').format('DD-MM-YYYY') : '--'}</b>
          </>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Ngày hết hạn' }),
      dataIndex: 'expire_at',
      key: 'expire_at',
      align: 'center',
      width: 150,
      render: (item, record) => {
        return (
          <b>{record?.expired_at ? dayjs(record?.expired_at).startOf('day').format('DD-MM-YYYY') : '--'}</b>
        )
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Tồn thực tế' }),
      dataIndex: 'stock_actual',
      key: 'stock_actual',
      width: 100,
      align: 'center',
      render: (item, record) => {
        return <b>{record?.stock_actual}</b>
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Thời gian SD còn lại' }),
      dataIndex: 'stock_allocated',
      key: 'stock_allocated',
      width: 150,
      align: 'center',
      render: (item, record) => {
        return <b>{timeDiff(record?.stop_sale_at) >= 0 ? timeDiff(record?.stop_sale_at) : 0}</b>
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Số ngày còn hạn' }),
      dataIndex: 'stock_reserve',
      key: 'stock_reserve',
      width: 150,
      align: 'center',
      render: (item, record) => {
        return <b className="d-flex align-items-center justify-content-center">
          {timeDiff(record?.expired_at) >= 0 ? timeDiff(record?.expired_at) : 'Hết hạn'}
        </b>
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Hạn cảnh báo' }),
      dataIndex: 'stock_available',
      key: 'stock_available',
      width: 100,
      align: 'center',
      render: (item, record) => {
        return <b>{record?.expired_warning_at ? dayjs(record?.expired_warning_at).startOf('day').format('DD-MM-YYYY') : '--'}</b>
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Hạn dừng bán' }),
      dataIndex: 'stock_shipping',
      key: 'stock_shipping',
      width: 100,
      align: 'center',
      render: (item, record) => {
        return <b>{record?.stop_sale_at ? dayjs(record?.stop_sale_at).startOf('day').format('DD-MM-YYYY') : '--'}</b>
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Ngày sản xuất' }),
      dataIndex: 'stock_warning',
      key: 'stock_warning',
      width: 150,
      align: 'center',
      render: (item, record) => {
        return <b>{record?.manufacture_at ? dayjs(record?.manufacture_at).startOf('day').format('DD-MM-YYYY') : '--'}</b>
      }
    },
    {
      title: formatMessage({ defaultMessage: 'Kho' }),
      dataIndex: 'warehouse',
      key: 'warehouse',
      width: 130,
      align: 'center',
      render: (item, record) => {
        return <b>{record?.warehouse?.name}</b>;
      }
    },
  ];

  return (
    <>
      <div className="row">
          <div className="d-flex w-100" >
            <div style={{ position: 'sticky', top: 100, background: '#fff', zIndex: 10, fontSize: 14, paddingTop: 10, flex: 1 }}>
              <ul className="nav nav-tabs ml-3" id="myTab" role="tablist" >
                <li className={`nav-item ${!params.type ? 'active' : ''} ${!params.type == undefined ? 'active' : ''}`}>
                  <a className={`nav-link font-weight-normal ${!params.type ? 'active' : ''}`}
                    style={{ fontSize: '13px', minWidth: 100, }}
                    onClick={e => {
                      history.push(`/products/expiration-manage?${queryString.stringify(omit({
                        ...params,
                        page: 1,
                        type: undefined,
                        typeFilter: 'production_date'
                      }, ['lt', 'gt']))}`)
                      setValueRangeTime([])
                    }}
                  >{formatMessage({ defaultMessage: 'Tất cả' })} ({!count ? "-" : formatNumberToCurrency(count?.all)})</a>
                </li>
                <li className={`nav-item ${params.type == 'current' ? 'active' : ''}`}>
                  <a className={`nav-link font-weight-normal ${params.type == "current" ? 'active' : ''}`}
                    style={{ fontSize: '13px', minWidth: 100, alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => {
                      history.push(`/products/expiration-manage?${queryString.stringify(omit({
                        ...params,
                        page: 1,
                        type: 'current',
                        typeFilter: 'expiration_date'
                      }, ['lt', 'gt']))}`)
                      setValueRangeTime([])
                    }}
                  >
                    {formatMessage({ defaultMessage: 'Còn hạn' })} ({!count ? "-" : formatNumberToCurrency(count?.current)})
                  </a>
                </li>
                <li className={`nav-item ${params.type == 'near_out_of_date' ? 'active' : ''}`}>
                  <a className={`nav-link font-weight-normal ${params.type == "near_out_of_date" ? 'active' : ''}`}
                    style={{ fontSize: '13px', minWidth: 140, alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => {
                      history.push(`/products/expiration-manage?${queryString.stringify(omit({
                        ...params,
                        page: 1,
                        type: 'near_out_of_date',
                        typeFilter: 'expiration_date'
                      }, ['lt', 'gt']))}`)
                      setValueRangeTime([])
                    }}
                  >
                    {formatMessage({ defaultMessage: 'Sắp hết hạn' })} ({!count ? "-" : formatNumberToCurrency(count?.nearOutOfDate)})
                  </a>
                </li>
                <li className={`nav-item ${params.type == 'stop_selling' ? 'active' : ''}`}>
                  <a className={`nav-link font-weight-normal ${params.type == "stop_selling" ? 'active' : ''}`}
                    style={{ fontSize: '13px', minWidth: 100, alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => {
                      history.push(`/products/expiration-manage?${queryString.stringify(omit({
                        ...params,
                        page: 1,
                        type: 'stop_selling',
                        typeFilter: 'production_date'
                      }, ['lt', 'gt']))}`)
                      setValueRangeTime([])
                    }}
                  >
                    {formatMessage({ defaultMessage: 'Dừng bán' })} ({!count ? "-" : formatNumberToCurrency(count?.stopSelling)})
                  </a>
                </li>
                <li className={`nav-item ${params.type == 'out_of_date' ? 'active' : ''}`}>
                  <a className={`nav-link font-weight-normal ${params.type == "out_of_date" ? 'active' : ''}`}
                    style={{ fontSize: '13px', minWidth: 100, alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => {
                      history.push(`/products/expiration-manage?${queryString.stringify(omit({
                        ...params,
                        page: 1,
                        type: 'out_of_date',
                        typeFilter: 'production_date'
                      }, ['lt', 'gt']))}`)
                      setValueRangeTime([])
                    }}
                  >
                    {formatMessage({ defaultMessage: 'Hết hạn' })} ({!count ? "-" : formatNumberToCurrency(count?.outOfDate)})
                  </a>
                </li>
                <div className="d-flex justify-content-end align-items-center" style={{ marginLeft: 'auto' }}>
                  <div className='d-flex justify-content-end align-items-center'>
                    <div className='mr-8'>
                      {formatMessage({ defaultMessage: 'Sắp xếp theo' })}:
                    </div>
                    <div style={{ width: '230px', zIndex: 99 }} className="mr-3">
                      <Select
                        className="w-100 custom-select-warehouse"
                        value={orderBy}
                        options={optionOrderBy}
                        onChange={values => {
                          history.push(`/products/expiration-manage?${queryString.stringify({
                            ...params,
                            page: 1,
                            order_by: values.value
                          })}`)
                        }}
                      />
                    </div>

                    <div onClick={() => {
                      history.push(`/products/expiration-manage?${queryString.stringify({
                        ...params,
                        page: 1,
                        sort: 'desc_nulls_last'
                      })}`)
                    }} style={{ height: '38px', width: '38px', cursor: 'pointer', border: sort == 'desc_nulls_last' ? '1px solid #FE5629' : '1px solid #D9D9D9' }} className="justify-content-center d-flex align-items-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sort-down" viewBox="0 0 16 16">
                        <path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293V2.5zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                      </svg>
                    </div>

                    <div onClick={() => {

                      history.push(`/products/expiration-manage?${queryString.stringify({
                        ...params,
                        page: 1,
                        sort: 'asc_nulls_last'
                      })}`)
                    }} style={{ height: '38px', width: '38px', cursor: 'pointer', border: sort == 'asc_nulls_last' ? '1px solid #FE5629' : '1px solid #D9D9D9' }} className="justify-content-center d-flex align-items-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sort-up" viewBox="0 0 16 16">
                        <path d="M3.5 12.5a.5.5 0 0 1-1 0V3.707L1.354 4.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.498.498 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 3.707V12.5zm3.5-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </ul>
            </div>
          </div>
          <div className="row w-100 mt-3 ml-0 mb-3">
            <div className="col-2 ml-0 h-100 pr-0">
              <Select
                    options={params?.type == 'current' || params?.type == 'near_out_of_date' ? uiHelpers.OPTIONS_TYPE_FILTER : uiHelpers.OPTIONS_TYPE_FILTER.slice(0, 1)}
                    value={_.find(OPTIONS_TYPE_FILTER, _item => _item?.value == params?.typeFilter) || OPTIONS_TYPE_FILTER[0]}
                    onChange={values => {
                      history.push(`/products/expiration-manage?${queryString.stringify({
                        ...params,
                        page: 1,
                        typeFilter: values.value
                      })}`)
                    }}
                    className='w-100 custom-select-order'
                    styles={{
                      container: (styles) => ({
                        ...styles,
                        zIndex: 10
                      })
                    }}
                  />
            </div>
            <div className="col-4 pl-0" >
              <DateRangePicker
                  style={{ width: "100%", borderRadius: 0, height: 38}}
                  character={" - "}
                  format={"dd/MM/yyyy"}
                  value={valueRangeTime}
                  className="custom-date-range-picker"
                  styles
                  // disabledDate={disabledFutureDate}
                  placeholder={"dd/mm/yyyy - dd/mm/yyyy"}
                  placement={"bottomStart"}
                  onChange={(values) => {
                      let queryParams = {};
                      setValueRangeTime(values);
                      
                      if (!!values) {
                          let [ltCreateTime, gtCreateTime] = [dayjs(values[0]).startOf("day").unix(),dayjs(values[1]).endOf("day").unix()];

                          queryParams = {...params,page: 1,gt: gtCreateTime, lt: ltCreateTime};
                      } else {
                          queryParams = _.omit({ ...params, page: 1 }, ["gt", "lt"]);
                      }

                      history.push(`/products/expiration-manage?${queryString.stringify(queryParams)}`);
                  }}
                  locale={{
                      sunday: "CN",
                      monday: "T2",
                      tuesday: "T3",
                      wednesday: "T4",
                      thursday: "T5",
                      friday: "T6",
                      saturday: "T7",
                      ok: formatMessage({ defaultMessage: "Đồng ý" }),
                      today: formatMessage({ defaultMessage: "Hôm nay" }),
                      yesterday: formatMessage({ defaultMessage: "Hôm qua" }),
                      hours: formatMessage({ defaultMessage: "Giờ" }),
                      minutes: formatMessage({ defaultMessage: "Phút" }),
                      seconds: formatMessage({ defaultMessage: "Giây" }),
                      formattedMonthPattern: "MM/yyyy",
                      formattedDayPattern: "dd/MM/yyyy",
                      // for DateRangePicker
                      last7Days: formatMessage({ defaultMessage: "7 ngày qua" }),
                  }}
              />
            </div>
        </div>
      </div>

      <div>
        {loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} ><span className="ml-3 spinner spinner-primary"></span></div>}
        {(!!error && !loading) ? (
          <div className="w-100 text-center mt-10" style={{ position: 'absolute' }} >
            <div className="d-flex flex-column justify-content-center align-items-center">
              <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
              <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
              <button
                className="btn btn-primary btn-elevate"
                style={{ width: 100 }}
                onClick={e => {
                  e.preventDefault();
                  refetch();
                }}
              >
                {formatMessage({ defaultMessage: 'Tải lại' })}
              </button>
            </div>
          </div>
        ) : (
          <Table
            style={loading ? { opacity: 0.4 } : {}}
            className="upbase-table"
            columns={columns}
            data={itemInventory?.sme_catalog_inventory_item_locations || []}
            emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
              <img src={toAbsoluteUrl("/media/empty.png")} alt="" width={80} />
              <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}</span>
            </div>}
            tableLayout="auto"
            sticky={{ offsetHeader: 43 }}
            scroll={{ x: 1800 }}
          />
        )}
        {!!itemInventory?.sme_catalog_inventory_item_locations?.length && (
          <Pagination
            page={page}
            totalPage={totalPage}
            loading={loading}
            limit={limit}
            totalRecord={totalRecord}
            count={itemInventory?.sme_catalog_inventory_item_locations?.length}
            basePath={'/products/expiration-manage'}
            emptyTitle=''
            style={{ zIndex: 1000 }}
          />
        )}
      </div>
    </>
  );
}
