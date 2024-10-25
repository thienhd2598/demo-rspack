import React, { useMemo, useState, useEffect } from 'react'
import Select from "react-select";
import queryString from "querystring";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { useIntl } from 'react-intl';
import { CIRCLE_CHECK_SVG, RESULT_RECONCILIATION, TRIANGLE_ALERT_SVG, BOX_OVERVIEW, OPTION_SEARCH } from '../AutoReconciliationHelper';
import _ from 'lodash';
import { Card, CardBody } from '../../../../_metronic/_partials/controls';
import RcTable from 'rc-table';
import Pagination from '../../../../components/Pagination';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import query_verify_public_verify_report_detail from '../../../../graphql/query_verify_public_verify_report_detail';
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic';
import query_sme_catalog_stores from '../../../../graphql/query_sme_catalog_stores';
import { useQuery } from '@apollo/client';
import query_verify_public_verify_report_objects from '../../../../graphql/query_verify_public_verify_report_objects';
import { useSubheader } from '../../../../_metronic/layout';
import dayjs from 'dayjs';

const Details = () => {
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const { id } = useParams()
    const { formatMessage } = useIntl();
    const [search, setSearch] = useState("");
    const [searchType, setSearchType] = useState(params?.search_type || 2);

    const { setBreadcrumbs } = useSubheader();

    useEffect(() => {
        if(params?.q) {
            setSearch(params?.q)
        }
    }, [params?.q])
    const page = useMemo(() => {
        try {
            let _page = Number(params.page);
            if (!Number.isNaN(_page)) {
                return Math.max(1, _page)
            } else {
                return 1
            }
        } catch (error) {
            return 1;
        }
        }, [params.page]);

    const limit = useMemo(() => {
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

    const search_keyword = useMemo(() => {
        if (params?.q) {
            return params?.q
        }
        return ''
    }, [params?.q])

    const result = useMemo(() => {
        if(params?.result == 0 || !!params?.result) {
            return +params?.result
        }
        return null
    }, [params?.result])

    const search_input = useMemo(() => {
        if(params?.search_type) {
            return OPTION_SEARCH?.find(item => item?.value == params?.search_type)?.search_input
        }
        return null
    }, [optionsSearch, params?.search_type])

    const whereCondition = useMemo(() => {
        return {
            page,
            per_page: limit,
            result,
            search_keyword,
            search_input
        }
    }, [page, limit, result, search_keyword, search_input])

    const { data: dataStore, loading: loadingGetStore } = useQuery(query_sc_stores_basic, {
      variables: {
          context: 'order'
      },
      fetchPolicy: "cache-and-network",
    });

    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: "cache-and-network",
    });

    const {data: reportDetailData, loading: loadingReportDetailData} = useQuery(query_verify_public_verify_report_detail, {
      variables: {
        id: +id
      },
      fetchPolicy: 'network-only'
    })

    const {data: dataVerifyTable, loading: loadingDataVerifyTable} = useQuery(query_verify_public_verify_report_objects, {
        variables: {
            verify_report_id: +id,
            search: {
                ...whereCondition,
                search_object: reportDetailData?.verify_public_verify_report_detail?.verify_object
            },
            skip: !reportDetailData?.verify_public_verify_report_detail
        }
    })
    const title = BOX_OVERVIEW?.find(item => item?.code == reportDetailData?.verify_public_verify_report_detail?.verify_object)
    useEffect(() => { 
        setBreadcrumbs([{ title: title?.name }, {title: dayjs(params?.created_at*1000)?.format('DD/MM/YYYY')}]) 
    }, [title, params?.created_at]);

    const stores = useMemo(() => {
      const channels = dataStore?.op_connector_channels ?? {}
  
      return dataStore?.sc_stores?.map(store => {
        const channel = channels?.find(cn => cn?.code == store?.connector_channel_code)
        return {
          ...store, 
          logoChannel: channel?.logo_asset_url
        }
      })
  }, [dataStore])
    const smeWarehouses = useMemo(() => {
        return dataWarehouse?.sme_warehouses?.filter(wh => wh?.fulfillment_by !== 2)?.map(warehouse => {
        return {
            label: warehouse.name,
            value: warehouse.id,
        };
        })
    }, [dataWarehouse])

    const currentStore = useMemo(() => {
      const store = stores?.find(item => item?.id == reportDetailData?.verify_public_verify_report_detail?.store_id)
      return store
    }, [stores, reportDetailData])

    const currentWarehouse = useMemo(() => {
        return smeWarehouses?.find(wh => wh?.value == reportDetailData?.verify_public_verify_report_detail?.sme_warehouse_id)
    }, [smeWarehouses, reportDetailData])

    const optionsSearch = useMemo(() => {
        if(['return_order', 'finance_order'].includes(reportDetailData?.verify_public_verify_report_detail?.verify_object)) {
            return OPTION_SEARCH?.filter(item => item?.search_input != 'warehouse_bill_code')
        } else if(['inbound', 'outbound'].includes(reportDetailData?.verify_public_verify_report_detail?.verify_object)) {
            return OPTION_SEARCH?.filter(item => item.search_input != 'finance_order_code')
        }
        return OPTION_SEARCH?.filter(item => item?.search_input == 'order_code')
    }, [reportDetailData])

    const placeholderInput = useMemo(() => {
        return `Tìm ${optionsSearch.find(option => option.value == (params?.search_type || 2))?.label.toLowerCase()}`
    }, [params.search_type, optionsSearch])



    const columns = useMemo(() => {
        return [
            {
                title: formatMessage({ defaultMessage: 'Mã đơn hàng' }),
                align: 'center',
                width: '20%',
                render: (record, item) => {
                    return (
                        <div>
                            {record?.verify_object?.source_ref_info}
                        </div>
                    )
                }
            },
            (['return_order', 'finance_order'].includes(reportDetailData?.verify_public_verify_report_detail?.verify_object) && {
                title: formatMessage({ defaultMessage: 'Số chứng từ' }),
                align: 'center',
                width: '20%',
                render: (record, item) => {
                    return (
                        <div>
                            {record?.verify_object?.target_ref_info}
                        </div>
                    )
                }
            }),
            {
                title: formatMessage({ defaultMessage: 'Gian hàng' }),
                align: 'center',
                width: '20%',
                render: (record, item) => {
                    return (
                        <div>
                            {!!currentStore?.logoChannel && <img src={currentStore?.logoChannel} style={{ width: 15, height: 15, marginRight: 4 }} alt=""/>}
                            {currentStore?.name}
                        </div>
                    )
                }
            },
        {
            title: formatMessage({ defaultMessage: 'Kết quả đối soát' }),
            align: 'center',
            width: '20%',
            render: (record, item) => {
                return (
                    <div>
                     {record?.result == 1 ? CIRCLE_CHECK_SVG :TRIANGLE_ALERT_SVG}
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Lỗi' }),
            align: 'center',
            width: '20%',
            render: (record, item) => {
                return (
                    <div>
                        {result?.result_error_message}
                    </div>
                )
            }
        },
    ]
    }, [])
    const totalRecord = dataVerifyTable?.verify_public_verify_report_objects?.totalPage
    const totalPage = Math.ceil(totalRecord / limit)

  return (
    <Card>
    <CardBody>
    <div className="mb-3">
        <div className="col-12 form-group row my-4">
            <div className="col-2 pr-0" style={{ zIndex: 76 }}>
              <Select
                options={optionsSearch}
                className="w-100 custom-select-order"
                style={{ borderRadius: 0 }}
                value={optionsSearch.find((_op) => _op.value == searchType)}
                onChange={(value) => {
                  setSearchType(value);
                  if (!!value) {
                    history.push(`${location.pathname}?${queryString.stringify({...params, page: 1, search_type: value.value,})}`);
                  } else {
                    history.push(`${location.pathname}?${queryString.stringify({ ...params,page: 1, search_type: undefined,})}`);
                  }
                }}
                formatOptionLabel={(option, labelMeta) => {
                  return <div>{option.label}</div>;
                }}
              />
            </div>
            <div className="col-3 input-icon pl-0" style={{ height: "fit-content" }}>
              <input
                type="text"
                className="form-control"
                placeholder={placeholderInput}
                style={{ height: 37, borderRadius: 0, paddingLeft: "50px" }}
                onBlur={(e) => {
                  history.push(`${location.pathname}?${queryString.stringify({...params, page: 1, q: e.target.value })}`);
                }}
                value={search || ""}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.keyCode == 13) {
                    history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1,q: e.target.value, })}`);
                  }
                }}
              />
              <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
            </div>

            <div className='col-2'>
              <Select
                placeholder={formatMessage({ defaultMessage: "Kết quả đối soát" })}
                isClearable={true}
                className="w-100 custom-select-warehouse-sme"
                value={_.find(RESULT_RECONCILIATION,(_item) => _item?.value == params?.result) || null}
                options={RESULT_RECONCILIATION}
                onChange={(values) => {
                  if (!values) {
                    history.push(`${location.pathname}?${queryString.stringify(_.omit({...params},["result"]))}`);
                    return;
                  }
                  history.push(`${location.pathname}?${queryString.stringify({...params, page: 1, result: values.value})}`);
                }}
              />
            </div>
            <div className="col-3"></div>
            {/* <div className="col2">
                <button className="btn btn-primary">Xuất</button>
            </div> */}
        </div>
        <div className="row my-4 col-12">
            <div className="col-2 d-flex">
                <span>{formatMessage({defaultMessage: 'Tên gian hàng'})}: </span>
                <span className="ml-2">
                    {!!currentStore?.logoChannel && <img src={currentStore?.logoChannel} style={{ width: 15, height: 15, marginRight: 4 }} alt=""/>}
                    {currentStore?.name}
                </span>
            </div>
            {['inbound', 'outbound', 'inbound_outbound'].includes(reportDetailData?.verify_public_verify_report_detail?.verify_object)&&<div className="col-2 d-flex">
                <span>{formatMessage({defaultMessage: 'Tên kho'})}: </span>
                <span className="ml-2">
                    {currentWarehouse?.label}
                </span>
            </div>}
            <div className="col-2 d-flex">
                <span>{formatMessage({defaultMessage: 'Tổng đơn hàng đối soát'})}: </span>
                <span className="ml-2">{reportDetailData?.reportDetailData?.total_source}</span>
            </div>
            <div className="col-2 d-flex">
                <span >{formatMessage({defaultMessage: 'Đơn hàng chính xác'})}: </span>
                <span style={{color: '#00DB6D'}} className="ml-2">{reportDetailData?.reportDetailData?.total_passed}</span>
            </div>
            <div className="col-2 d-flex">
                <span>{formatMessage({defaultMessage: 'Đơn hàng lỗi'})}: </span>
                <span style={{color: '#FF0000'}} className="ml-2">{reportDetailData?.reportDetailData?.total_failed}</span>
            </div>
        </div>
    </div>

    <RcTable
        style={false ? { opacity: 0.4 } : {}}
        className="upbase-table"
        columns={columns}
        data={dataVerifyTable?.verify_public_verify_report_objects?.verify_objects}
        emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
            <img src={toAbsoluteUrl("/media/empty.png")} alt="" width={80} />
            <span className='mt-4'>{formatMessage({ defaultMessage: 'Không có dữ liệu' })}</span>
        </div>}
        tableLayout="auto"
        sticky={{ offsetHeader: 43 }}
    />
    <Pagination
        page={page}
        totalPage={totalPage}
        loading={loadingDataVerifyTable}
        limit={limit}
        totalRecord={totalRecord}
        count={dataVerifyTable?.verify_public_verify_report_objects?.verify_objects?.length}
        basePath={'/auto-reconciliation'}
        emptyTitle={formatMessage({ defaultMessage: 'Không tìm thấy dữ liệu phù hợp' })}
    />
    </CardBody>
  </Card>

  )
}

export default Details