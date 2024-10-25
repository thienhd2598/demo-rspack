import { useIntl } from 'react-intl';
import RcTable from 'rc-table';
import React, { useCallback, useMemo, useState } from 'react'
import dayjs from 'dayjs';
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../_metronic/_helpers';
import { Dropdown } from 'react-bootstrap';
import Pagination from '../../../components/Pagination';
import { BOX_OVERVIEW, CIRCLE_CHECK_SVG, TABS, TRIANGLE_ALERT_SVG, TYPE_IMPORTWAREHOUSE } from './AutoReconciliationHelper';
import queryString from "querystring";
import { useHistory, useLocation } from "react-router-dom";
import query_verify_public_verify_reports from '../../../graphql/query_verify_public_verify_reports';
import { useQuery } from '@apollo/client';

const Table = ({dataStore, dataWarehouse}) => {
    const { formatMessage } = useIntl()
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000));
    const history = useHistory()

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

    const [from_date, to_date] = useMemo(() => {
        let startTime = params?.lt ? +params?.lt : dayjs().subtract(7, "day")?.startOf('day')?.unix()
        let endTime = params?.gt ? +params?.gt : dayjs().subtract(1, "day")?.startOf('day')?.unix()
        return [startTime, endTime]
    }, [params?.lt, params?.gt])

    const result = useMemo(() => {
        if(params?.result || params?.result == 0) {
            return +params?.result 
        }
        return null
    }, [params?.result])

    const sme_warehouse_id = useMemo(() => {
        return +params?.warehouseId || null
    }, [params?.warehouseId])

    const source = useMemo(() => {
        if(params?.type_order) {
            let typeOrder = TABS?.find(item => item?.value == params?.type_order)
            return typeOrder?.source
        }
        return 'platform'
    }, [params?.type_order])

    const store_id = useMemo(() => {
        return params?.stores ? params?.stores?.split(',')?.map(item => +item) : null
    }, [params?.stores])

    const verify_object = useMemo(() => {
        let typeImport = params?.type_order == 2 ? ['outbound','inbound'] : ['order_sync']
        if(params?.type_import) {
            typeImport = [TYPE_IMPORTWAREHOUSE?.find(item => item ?.value == params?.type_import)?.code]
        } else if(params?.type) {
            typeImport = params?.type != 2 ? [BOX_OVERVIEW?.find(item => item?.value == params?.type)?.code] : ['outbound','inbound']
        }
        return typeImport || null
    }, [params?.type_import, params?.type, params?.type_order])

    const whereCondition = useMemo(() => {
        return {
            from_date, 
            page, 
            per_page: limit, 
            sme_warehouse_id, 
            source, 
            store_id, 
            to_date, 
            verify_object, 
            result
        }
    }, [from_date, page, limit, sme_warehouse_id, source, store_id, to_date, verify_object, result])

    const {data: dataTable, loading: loadingDataTable} = useQuery(query_verify_public_verify_reports, {
        variables: {
            search: {
                ...whereCondition
            }
        },
        fetchPolicy: 'network-only'
    })

    const columns = useMemo(() => {
        return [
            {
            title: formatMessage({ defaultMessage: 'Ngày đối soát dữ liệu' }),
            align: 'center',
            width: 160,
            render: (record, item) => {
                return (
                    <div>
                        {dayjs(record?.verify_date)?.format('DD/MM/YYYY')}
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thời gian chạy đối soát' }),
            align: 'center',
            width: 160,
            render: (record, item) => {
                return (
                    <div>
                        {dayjs(record?.created_at)?.format('DD/MM/YYYY')}
                    </div>
                )
            }
        },
        (params?.type != 2 ? {
            title: formatMessage({ defaultMessage: 'Gian hàng' }),
            align: 'center',
            width: 160,
            render: (record, item) => {
                const stores = dataStore?.stores?.map(store => ({value: store?.id, label: store?.name, logo: store?.logoChannel}))
                const currentStore = stores?.find(item => item?.value == record?.store_id)
                return (
                    <div>
                        {!!currentStore?.logo && <img src={currentStore?.logo} style={{ width: 15, height: 15, marginRight: 4 }} alt=""/>}
                        {currentStore?.label}
                    </div>
                )
            }
        } : null),
        ((!params?.type || params?.type == 1) ? {
            title: formatMessage({ defaultMessage: 'Đơn trên sàn TMĐT/Đơn trên SMEs' }),
            align: 'center',
            width: 160,
            render: (record, item) => {
                const platformCount = record?.total_source
                const smeCount = record?.total_target
                const textColor = platformCount == smeCount ? '#00db6d' : '#ff0201'
                return (
                    <div>
                        <span>{platformCount}</span>
                        <span>/</span>
                        <span style={{color: textColor}}>{smeCount}</span>
                    </div>
                )
            }
        } : null),
        {
            title: formatMessage({ defaultMessage: 'Kết quả đối soát' }),
            align: 'center',
            width: 160,
            render: (record, item) => {
                return (
                    <div>
                        {record?.total_source != record?.total_target ? TRIANGLE_ALERT_SVG : CIRCLE_CHECK_SVG}
                    </div>
                )
            }
        },
        (params?.type == 2 ? {
            title: formatMessage({ defaultMessage: 'Kho hàng' }),
            align: 'center',
            width: 160,
            render: (record, item) => {
                const currentWh = dataWarehouse?.sme_warehouses?.find(wh => wh?.id == record?.sme_warehouse_id)
                return (
                    <div>
                        {currentWh?.name}
                    </div>
                )
            }
        } : null),
        (params?.type == 2 ? {
            title: formatMessage({ defaultMessage: 'Hình thức' }),
            align: 'center',
            width: 160,
            render: (record, item) => {
                return (
                    <div>
                        {record?.verify_object == 'inbound' ? formatMessage({defaultMessage: 'Nhập kho'}) : formatMessage({defaultMessage: "Xuất kho"})}
                    </div>
                )
            }
        } : null),
        ([2, 3, 4, 5, 6].includes(+params?.type) ? {
            title: formatMessage({ defaultMessage: 'Đơn đối soát' }),
            align: 'center',
            width: 160,
            render: (record, item) => {
                return (
                    <div className="d-flex align-items-center justify-content-center">
                        <span>{record?.total_source}</span>
                        <div>(<span style={{color: '#00DB6D'}}>{record?.total_passed || 0}</span> | 
                            {!!record?.total_failed && <span style={{color: '#FF0000'}}>{record?.total_failed}</span>}
                        )</div>
                    </div>
                )
            }
        } : null),
        ([2, 3, 4, 5, 6].includes(+params?.type) ? {
            title: formatMessage({ defaultMessage: 'Thao tác' }),
            align: 'center',
            width: 160,
            render: (record, item) => {
                return (
                    <div>
                      <Dropdown drop='down' >
                        <Dropdown.Toggle className='btn-outline-primary' >
                            {formatMessage({ defaultMessage: 'Chọn' })}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item className="mb-1 d-flex" onClick={() => {
                                const createdAt = record?.created_at;
                                const url = `/auto-reconciliation/${record?.id}?created_at=${createdAt}`;
                                window.open(url, '_blank');
                            }}>{formatMessage({ defaultMessage: 'Xem chi tiết' })}</Dropdown.Item>
                            {/* <Dropdown.Item className="mb-1 d-flex">{formatMessage({ defaultMessage: 'Xuất dữ liệu' })}</Dropdown.Item> */}
                        </Dropdown.Menu>
                    </Dropdown>
                    </div>
                )
            }
        } : null)
    ]
    }, [params?.type, dataStore])

    const totalRecord = dataTable?.verify_public_verify_reports?.total
    const totalPage = Math.ceil(totalRecord / limit)
  return (
    <div className='mt-6'>
        <RcTable
            style={false ? { opacity: 0.4 } : {}}
            className="upbase-table"
            columns={columns}
            data={dataTable?.verify_public_verify_reports?.verify_reports}
            emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                <img src={toAbsoluteUrl("/media/empty.png")} alt="" width={80} />
                <span className='mt-4'>{formatMessage({ defaultMessage: 'Không có dữ liệu' })}</span>
            </div>}
            tableLayout="auto"
            sticky={{ offsetHeader: 43 }}
            loading={loadingDataTable}
        />

        <Pagination
            page={page}
            totalPage={totalPage}
            loading={loadingDataTable}
            limit={limit}
            totalRecord={totalRecord}
            count={dataTable?.verify_public_verify_reports?.verify_reports?.length}
            basePath={'/auto-reconciliation'}
            emptyTitle={""}
        />
    </div>
  )
}

export default Table