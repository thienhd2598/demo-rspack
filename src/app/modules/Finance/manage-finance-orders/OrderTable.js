import React, { memo, useState } from "react";
import Pagination from '../../../../components/Pagination';
import { useLocation } from "react-router-dom";
import queryString from 'querystring';
import OrderRow from "./OrderRow";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import { useIntl } from 'react-intl'

const OrderTable = ({ amountOrderTabReturn, loadingListFinanceOrder, amountOrderTab, sc_stores, channels, setIds, ids, data, error, loading, refetch, page, limit }) => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { formatMessage } = useIntl()

    let totalRecord = params?.tab == 2 ? amountOrderTabReturn[params?.invoiceCancel || 'all'] : amountOrderTab[params?.invoice || 'all'];
    let totalPage = Math.ceil(totalRecord / limit);

    const isSelectAll = ids.length > 0 && ids.filter(x => {
        return data?.some(order => order.id === x.id);
    })?.length == data?.length;

    return (
        <div style={{ boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9", borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6, minHeight: 300 }}>
            <table className="table table-borderless product-list table-vertical-center fixed">
                <thead style={{ position: 'sticky', top: `${100}px`, zIndex: 1, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid gray', borderLeft: '1px solid #d9d9d9' }}>
                    <tr className="font-size-lg">
                        <th style={{ fontSize: '14px' }}>
                            <div className="d-flex">
                                <Checkbox
                                    size='checkbox-md'
                                    inputProps={{ 'aria-label': 'checkbox' }}
                                    isSelected={isSelectAll}
                                    onChange={(e) => {
                                        if (isSelectAll) {
                                            setIds(ids.filter(x => {
                                                return !data?.some(order => order.id === x.id);
                                            }))
                                        } else {
                                            const tempArray = [...ids];
                                            (data || []).forEach(_order => {
                                                if (_order && !ids.some(item => item.id === _order.id)) {
                                                    tempArray.push(_order);
                                                }
                                            })
                                            setIds(tempArray)
                                        }
                                    }}
                                />
                                <span className="mx-4">{formatMessage({ defaultMessage: 'Thông tin sản phẩm' })}</span>
                            </div>
                        </th>
                        <th className="text-right" style={{ fontSize: '14px' }} width="140px">{formatMessage({ defaultMessage: 'Tiền thanh toán' })}</th>
                        <th className="text-right" style={{ fontSize: '14px' }} width="145px">{formatMessage({ defaultMessage: 'Giá vốn' })}</th>                       
                        <th className="text-right" style={{ fontSize: '14px' }} width="140px">{formatMessage({ defaultMessage: 'Chiết khấu' })}</th>
                        <th style={{ fontSize: '14px' }} width="145px">{formatMessage({ defaultMessage: 'Trạng thái đơn' })}</th>
                        <th className="text-center" style={{ fontSize: '14px' }} width="145px">{formatMessage({ defaultMessage: 'Trạng thái hoá đơn ' })}</th>
                    </tr>
                </thead>
                <tbody>
                    {(loading || loadingListFinanceOrder) && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
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
                    {!loadingListFinanceOrder && !loading && !error && !!data?.length && data?.map((order, index) =>
                        <OrderRow
                            key={`order-${index}`}
                            order={order}
                            op_connector_channels={channels || []}
                            sc_stores={sc_stores || []}
                            params={params}
                            setIds={setIds}
                            isSelected={ids.some(_id => _id.id == order.id)}
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
                    count={data?.length}
                    basePath={'/finance/manage-finance-order'}
                    emptyTitle={formatMessage({ defaultMessage: 'Không tìm thấy đơn hàng phù hợp' })}
                />
            )}
        </div>
    )
}

export default OrderTable;