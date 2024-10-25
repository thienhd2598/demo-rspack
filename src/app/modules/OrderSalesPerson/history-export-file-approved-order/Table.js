import React, { useMemo, memo } from "react";
import { useQuery } from "@apollo/client";
import Pagination from '../../../../components/Pagination';
import { useLocation } from "react-router-dom";
import queryString from 'querystring';
import RowTable from "./RowTable";
import _ from "lodash";
import query_scGetJobTrackingExportOrder from "../../../../graphql/query_scGetJobTrackingExportOrder";
import { useIntl } from "react-intl";
const Table = memo(() => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const {formatMessage} = useIntl()

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

    const { data, loading, error, refetch } = useQuery(query_scGetJobTrackingExportOrder, {
        variables: {
            per_page: limit,
            page: page,
            list_type: [6],
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = data?.scGetJobTrackingExportOrder?.total || 0;
    let totalPage = Math.ceil(totalRecord / limit);

    return (
        <div style={{boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9", borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6, minHeight: 300}}>
            <table className="table product-list table-borderless product-list table-vertical-center fixed">
                <thead style={{ borderBottom: '1px solid #F0F0F0', fontWeight: "bold", background: "#F3F6F9",fontSize: "14px", borderRight: '1px solid #d9d9d9', borderLeft: '1px solid #d9d9d9'}}>
                    <tr className="font-size-lg">
                        <th style={{ fontSize: '14px' }} className="pl-6">{formatMessage({defaultMessage: 'Gian hàng'})}</th>
                        <th style={{ fontSize: '14px' }}>{formatMessage({defaultMessage: 'Thời gian đặt đơn'})}</th>
                        <th style={{ fontSize: '14px' }}>{formatMessage({defaultMessage: 'Số lượng đơn'})}</th>
                        <th style={{ textAlign: 'center', fontSize: '14px' }} >{formatMessage({defaultMessage: 'Thời gian yêu cầu'})}</th>
                        <th style={{ fontSize: '14px' }} >{formatMessage({defaultMessage: 'Mẫu tải'})}</th>
                        <th style={{ fontSize: '14px' }}>{formatMessage({defaultMessage: 'Trạng thái'})}</th>
                        <th style={{ fontSize: '14px' }}>{formatMessage({defaultMessage: 'Thao tác'})}</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && 
                    <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                        <span className="ml-3 spinner spinner-primary"></span>
                    </div>}
                    {!!error && !loading && (
                        <div className="w-100 text-center mt-8" style={{ position: 'absolute' }} >
                            <div className="d-flex flex-column justify-content-center align-items-center">
                                <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                                <p className="mb-6">{formatMessage({defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu'})}</p>
                                <button
                                    className="btn btn-primary btn-elevate"
                                    style={{ width: 100 }}
                                    onClick={e => {
                                        e.preventDefault();
                                        refetch();
                                    }}
                                >
                                    {formatMessage({defaultMessage: 'Tải lại'})}
                                </button>
                            </div>
                        </div>
                    )}
                    {!loading && !error && data?.scGetJobTrackingExportOrder?.job_tracking_export_orders?.map((order, index) =>
                        <RowTable
                            key={`order-${index}`}
                            order={order}
                            op_connector_channels={data?.op_connector_channels}
                        />
                    )}
                </tbody>
            </table>
            {!error && (
                <Pagination
                    page={page}
                    totalPage={totalPage}
                    loading={loading}
                    limit={limit}
                    totalRecord={totalRecord}
                    count={data?.scGetJobTrackingExportOrder?.job_tracking_export_orders?.length}
                    basePath={`/order-sales-person/history-export-file-approved-order`}
                    emptyTitle={formatMessage({defaultMessage: 'Không tìm thấy đơn hàng phù hợp'})}
                />
            )}
        </div>
    )
});

export default Table;