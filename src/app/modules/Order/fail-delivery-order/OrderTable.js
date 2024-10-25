import React, { useMemo, memo, useState } from "react";
import { useQuery } from "@apollo/client";
import Pagination from '../../../../components/Pagination';
import { useLocation } from "react-router-dom";
import queryString from 'querystring';
import OrderRow from "./OrderRow";
import _ from "lodash";
import query_scGetFailDeliveryOrders from "../../../../graphql/query_scGetFailDeliveryOrders"
import { Checkbox } from "../../../../_metronic/_partials/controls";
import WarehouseModal from "./WarehouseModal";
import ModalCancellationReason from "./Dialog/ModalCancellationReason";
import ModalRepositoryNote from "./Dialog/ModalRepositoryNote";
import { useIntl } from "react-intl";
import WarehouseModalDetail from "./WarehouseModalDetail";
import { queryGetSmeProductVariants } from "../OrderUIHelpers";

const OrderTable = memo(({ whereCondition, setIds, ids, coReloadOrder, pxSticky, dataStore, loadingStore }) => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const [dataOrder, setDataOrder] = useState(null);
    const [dataOrderDetail, setDataOrderDetail] = useState(null);
    const [dataCancellationReason, setDataCancellationReason] = useState(null);
    const [dataRepositoryNote, setDataRepositoryNote] = useState(null);
    const [loadingSmeVariant, setLoadingSmeVariant] = useState(false);
    const [smeVariants, setSmeVariants] = useState([]);
    const { formatMessage } = useIntl();

    const page = useMemo(
        () => {
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
        }, [params.page]
    );

    const limit = useMemo(
        () => {
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
        }, [params.limit]
    );



    const { data, loading, error, refetch } = useQuery(query_scGetFailDeliveryOrders, {
        variables: {
            per_page: limit,
            page: page,
            search: whereCondition,
            context: 'order'
        },
        fetchPolicy: 'cache-and-network',
        onCompleted: async (data) => {
            setLoadingSmeVariant(true);
            const smeVariants = await queryGetSmeProductVariants(data?.scGetFailDeliveryOrders?.flatMap(order => order?.orderItems?.map(item => item?.sme_variant_id)));

            setLoadingSmeVariant(false);
            setSmeVariants(smeVariants);
        }
    });    
    console.log('data', data)
    let totalRecord = data?.scFailDeliveryOrderAggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit);

    const isSelectAll = ids.length > 0 && ids.filter(x => {
        return data?.scGetFailDeliveryOrders.some(order => order.id === x.id);
    })?.length == data?.scGetFailDeliveryOrders?.length;


    return (
        <div
            style={{
                boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6,
                minHeight: 300
            }}
        >
            <table className="table table-borderless product-list table-vertical-center fixed">
                <thead
                    style={{ position: 'sticky', top: 157, zIndex: 1, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid gray', borderLeft: '1px solid #d9d9d9' }}
                >
                    <tr className="font-size-lg">
                        <th style={{ fontSize: '14px' }}>
                            <div className="d-flex">
                                {!params?.is_old_order && <Checkbox
                                    size='checkbox-md'
                                    inputProps={{
                                        'aria-label': 'checkbox',
                                    }}
                                    isSelected={isSelectAll}
                                    onChange={(e) => {
                                        if (isSelectAll) {
                                            setIds(ids.filter(x => {
                                                return !data?.scGetFailDeliveryOrders.some(order => order.id === x.id);
                                            }))
                                        } else {
                                            const tempArray = [...ids];
                                            (data?.scGetFailDeliveryOrders || []).forEach(_order => {
                                                if (_order && !ids.some(item => item.id === _order.id)) {
                                                    tempArray.push(_order);
                                                }
                                            })
                                            setIds(tempArray)
                                        }
                                    }}
                                />}
                                <span className="mx-4">{formatMessage({ defaultMessage: 'Thông tin sản phẩm' })}</span>
                            </div>
                        </th>
                        <th style={{ fontSize: '14px' }} width="15%">{formatMessage({ defaultMessage: 'Tổng tiền' })}</th>
                        <th style={{ fontSize: '14px' }} width="12%">{formatMessage({ defaultMessage: 'Trạng thái sàn TMĐT' })}</th>
                        <th style={{ fontSize: '14px' }} width="12%">{formatMessage({ defaultMessage: 'Thời gian' })}</th>
                        <th style={{ fontSize: '14px' }} width="10%">{formatMessage({ defaultMessage: 'Vận chuyển' })}</th>
                        <th style={{ fontSize: '14px' }} width="10%">{formatMessage({ defaultMessage: 'Người mua' })}</th>
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
                    {!error && !loading && data?.scGetFailDeliveryOrders?.map((order, index) =>
                        <OrderRow
                            key={`order-${index}`}
                            order={order}
                            op_connector_channels={data?.op_connector_channels || []}
                            sc_stores={data?.sc_stores || []}
                            params={params}
                            setIds={setIds}
                            isSelected={ids.some(_id => _id.id == order.id)}
                            coReloadOrder={coReloadOrder}
                            loadingSmeVariant={loadingSmeVariant}
                            smeVariants={smeVariants}
                            setDataOrder={setDataOrder}
                            setDataOrderDetail={setDataOrderDetail}
                            setDataCancellationReason={setDataCancellationReason}
                            setDataRepositoryNote={setDataRepositoryNote}
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
                    count={data?.scGetFailDeliveryOrders?.length}
                    basePath={'/orders/fail-delivery-order'}
                    emptyTitle={formatMessage({ defaultMessage: 'Không tìm thấy đơn hàng phù hợp' })}
                />
            )}
            {dataOrder && <WarehouseModal
                dataOrder={dataOrder}
                onHide={() => { setDataOrder(null) }}
            />}

            {dataCancellationReason && <ModalCancellationReason
                dataCancellationReason={dataCancellationReason}
                onHide={() => { setDataCancellationReason(null) }}
            />}

            {dataOrderDetail && <WarehouseModalDetail
                orderProcess={dataOrderDetail}
                dataStore={dataStore?.sc_stores}
                dataChannels={dataStore?.op_connector_channels}
                onHide={() => { setDataOrderDetail(null) }}
            />}

            {dataRepositoryNote && <ModalRepositoryNote
                dataRepositoryNote={dataRepositoryNote}
                onHide={() => { setDataRepositoryNote(null) }}
            />}



        </div>

    )
});

export default OrderTable;