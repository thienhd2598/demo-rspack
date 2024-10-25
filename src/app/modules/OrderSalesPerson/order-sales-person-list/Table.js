import React, { useMemo, memo, useState } from "react";
// import { useQuery } from "@apollo/client";
import Pagination from '../../../../components/Pagination';
import { useLocation } from "react-router-dom";
import queryString from 'querystring';
import _ from "lodash";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import { useIntl } from 'react-intl'
import RowTable from "./RowTable";

const Table = memo(({setDataSmeNote, onOpenConfirmDialog, dataSmeVariant, setDataSelectedOrder, dataSelectedOrder, limit, page, dataTable }) => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const {error, loading, refetch, dataOrder, count} = dataTable || {}
    const { formatMessage } = useIntl()


    let totalRecord = count || 0;
    let totalPage = Math.ceil(totalRecord / limit);

    const isSelectAll = dataSelectedOrder?.length > 0 && dataSelectedOrder?.filter(x => dataOrder?.some(order => order.id === x.id))?.length == dataOrder?.length;
    

    return (
        <div style={{ boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9", borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6,minHeight: 300}}>
            <table className="table table-borderless product-list table-vertical-center fixed">
                <thead style={{ position: 'sticky', top: `${100}px`, zIndex: 1, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid gray', borderLeft: '1px solid #d9d9d9' }}>
                    <tr className="font-size-lg">
                        <th style={{ fontSize: '14px' }} width="36%">
                            <div className="d-flex">
                                {(['pending']?.includes(params?.type) && !params?.is_old_order) && 
                                <Checkbox
                                    size='checkbox-md'
                                    inputProps={{'aria-label': 'checkbox',}}
                                    isSelected={isSelectAll}
                                    onChange={(e) => {
                                        if (isSelectAll) {
                                            setDataSelectedOrder(dataSelectedOrder.filter(x => !dataOrder.some(order => order.id === x.id)))
                                        } else {
                                            const tempArray = [...dataSelectedOrder];
                                            (dataOrder || []).forEach(_order => {
                                                if (_order && !dataSelectedOrder.some(item => item.id === _order.id)) {
                                                    tempArray.push(_order);
                                                }
                                            })
                                            setDataSelectedOrder(tempArray)
                                        }
                                    }}
                                />}
                                <span className="mx-4">{formatMessage({ defaultMessage: 'Thông tin sản phẩm' })}</span>
                            </div>
                        </th>
                        <th style={{ fontSize: '14px' }} width="12%">{formatMessage({ defaultMessage: 'Tổng tiền' })}</th>
                        <th style={{ fontSize: '14px' }} width="12%">{formatMessage({ defaultMessage: 'Kho xử lý' })}</th>
                        <th style={{ fontSize: '14px' }} width="12%">{formatMessage({ defaultMessage: 'Xử lý' })}</th>
                        <th style={{ fontSize: '14px' }} width="10%">{formatMessage({ defaultMessage: 'Vận chuyển' })}</th>
                        <th style={{ fontSize: '14px' }} width="10%">{formatMessage({ defaultMessage: 'Người nhận' })}</th>
                        <th style={{ fontSize: '14px' }} width="8%">{formatMessage({ defaultMessage: 'Thao tác' })}</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                        <span className="ml-3 spinner spinner-primary"></span>
                    </div>
                    }
                    {!!error && !loading && (
                        <div className="w-100 text-center mt-8" style={{ position: 'absolute' }} >
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
                    )}
                    {!error && !loading && dataOrder?.map((order, index) => 
                          <RowTable
                            key={order?.id}
                            onOpenConfirmDialog={onOpenConfirmDialog}
                            order={order}
                            onSetSmeNote={(edit = false, isView = false) => setDataSmeNote({
                                id: order?.id,
                                smeNote: order?.smeNote,
                                edit,
                                isView
                            })}
                            dataSmeVariant={dataSmeVariant}
                            setDataSelectedOrder={setDataSelectedOrder}
                            isSelected={dataSelectedOrder.some(_id => _id.id == order.id)}
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
                    count={dataOrder?.length}
                    basePath={'/order-sales-person/list-order'}
                    emptyTitle={formatMessage({ defaultMessage: 'Không tìm thấy đơn hàng phù hợp' })}
                />
            )}
        </div>

    )
});

export default Table;