import React, { useMemo, memo, useState } from "react";
import Pagination from '../../../../components/Pagination';
import { useLocation } from "react-router-dom";
import queryString from 'querystring';
import OrderRow from "./OrderRow";
import _ from "lodash";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import ModalPackPreparingGoods from "../dialog/ModalPackPreparingGoods";
import ModalReadyToDeliver from "../dialog/ModalReadyToDeliver";
import HtmlPrint from "../HtmlPrint";
import { useIntl } from 'react-intl'

const OrderTable = memo(({ 
        setDataSmeNote, 
        setStoreDisconnect,
        setIds, ids,
        coReloadOrder, data,
        error, loading, refetch,
        page, limit, dataSmeWarehouse,
        dataScWareHouse, onApprovedManualOrder,
        onCancelManualOrder, onUpdateTrackingNumber,
        onPrepareManualPackage, onConfirmDelivery,
        onRetryShipPackage, onReloadOrderShipmentParam,
        dataStore, onHandleBuyerCancellationPackage,
        onShipManualOrder, smeVariants,
        loadingSmeVariant }) => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const [dataOrder, setDataOrder] = useState(null);
    const [openModal, setOpenModal] = useState(null);
    const [html, setHtml] = useState(false);    
    const [namePrint, setNamePrint] = useState('');
    const { formatMessage } = useIntl()

    let totalRecord = data?.scPackageAggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit);

    const isSelectAll = ids.length > 0 && ids.filter(x => data?.scGetPackages.some(order => order.id === x.id))?.length == data?.scGetPackages?.length;

    const stickyPx = useMemo(() => {
        const types = ['ready_to_ship', 'connector_channel_error', 'shipping', 'shipped', 'shipment_pending', 'shipment_creating', 'shipment_loaded_shipment']
        if (params?.type == 'NONE_MAP_WAREHOUSE') {
            return 38
        }

        if (types.includes(params?.type)) {
            return 52
        }
        return 0
    }, [params?.type])

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
                    style={{ position: 'sticky', top: `${152 + stickyPx}px`, zIndex: 1, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid gray', borderLeft: '1px solid #d9d9d9' }}
                >
                    <tr className="font-size-lg">
                        <th style={{ fontSize: '14px' }} width="34%">
                            <div className="d-flex">
                                {(params?.list_source !='manual' || ['pending', 'ready_to_ship', 'shipped', 'shipping', 'packed', 'packing', 'pickup_retry', 'warehouse_error']?.includes(params?.type)) && <Checkbox
                                    size='checkbox-md'
                                    inputProps={{
                                        'aria-label': 'checkbox',
                                    }}
                                    isSelected={isSelectAll}
                                    onChange={(e) => {
                                        if (isSelectAll) {
                                            setIds(ids.filter(x => {
                                                return !data?.scGetPackages.some(order => order.id === x.id);
                                            }))
                                        } else {
                                            const tempArray = [...ids];
                                            (data?.scGetPackages || []).forEach(_order => {
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
                        <th style={{ fontSize: '14px' }} width="12%">{formatMessage({ defaultMessage: 'Tổng tiền' })}</th>
                        <th style={{ fontSize: '14px' }} width="12%">{formatMessage({ defaultMessage: 'Kho xử lý' })}</th>
                        <th style={{ fontSize: '14px' }} width="14%">{formatMessage({ defaultMessage: 'Xử lý' })}</th>
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
                    {!error && !loading && data?.scGetPackages?.map((orderPack, index) =>
                        <OrderRow
                            key={`order-${index}`}
                            order={orderPack}
                            dataSmeWarehouse={dataSmeWarehouse}
                            dataScWareHouse={dataScWareHouse}
                            setStoreDisconnect={setStoreDisconnect}
                            refetch={refetch}
                            op_connector_channels={data?.op_connector_channels || []}
                            sc_stores={data?.sc_stores || []}
                            onSetSmeNote={(edit = false, isView = false) => setDataSmeNote({
                                id: orderPack?.order?.id,
                                smeNote: orderPack?.order?.sme_note,
                                edit,
                                isView
                            })}
                            loadingSmeVariant={loadingSmeVariant}
                            params={params}
                            setIds={setIds}
                            smeVariants={smeVariants}
                            setDataOrder={setDataOrder}
                            setOpenModal={setOpenModal}
                            isSelected={ids.some(_id => _id.id == orderPack.id)}
                            setHtml={setHtml}
                            dataStore={dataStore}
                            setNamePrint={setNamePrint}
                            coReloadOrder={coReloadOrder}
                            onHandleBuyerCancellationPackage={onHandleBuyerCancellationPackage}
                            onPrepareManualPackage={onPrepareManualPackage}
                            onApprovedManualOrder={onApprovedManualOrder}
                            onCancelManualOrder={onCancelManualOrder}
                            onRetryShipPackage={onRetryShipPackage}
                            onReloadOrderShipmentParam={onReloadOrderShipmentParam}
                            onUpdateTrackingNumber={onUpdateTrackingNumber}
                            onConfirmDelivery={onConfirmDelivery}
                            onShipManualOrder={onShipManualOrder}
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
                    count={data?.scGetPackages?.length}
                    basePath={'/orders/list'}
                    emptyTitle={formatMessage({ defaultMessage: 'Không tìm thấy đơn hàng phù hợp' })}
                />
            )}


            <ModalPackPreparingGoods
                dataOrder={dataOrder}
                openModal={openModal}
                onHide={() => { setDataOrder(null); setOpenModal(null) }}
            />

            <ModalReadyToDeliver
                dataOrder={dataOrder}
                openModal={openModal}
                onHide={() => { setDataOrder(null); setOpenModal(null) }}
            />

            {(html && namePrint) && <HtmlPrint setNamePrint={setNamePrint} html={html} setHtml={setHtml} namePrint={namePrint} />}

        </div>

    )
});

export default OrderTable;