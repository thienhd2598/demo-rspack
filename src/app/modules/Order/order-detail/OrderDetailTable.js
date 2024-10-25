import React, { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import OrderDetailRow from './OrderDetailRow';
import OrderDetailConnectRow from './OrderDetailConnectRow';
import { Modal, Accordion, useAccordionToggle, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import OrderDetailSmeRow from './OrderDetailSmeRow';
import InfoCost from './components/InfoCost';
import { TooltipWrapper } from '../../Finance/payment-reconciliation/common/TooltipWrapper'
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import mutate_recreateProviderOutbound from '../../../../graphql/mutate_recreateProviderOutbound'
import { useMutation, useQuery } from '@apollo/client';
import { useToasts } from 'react-toast-notifications';
import { INFO_STATUS, LIGHT_BULB, PROVIDER_STATUS_ERROR, TOOLTIP_SVG } from './Constant';
import SectionReturn from './SectionReturn';
import OrderReturnOrderRow from './OrderReturnOrderRow';
import query_warehouse_bills from '../../../../graphql/query_warehouse_bills';
import { PackStatusName } from '../OrderStatusName';
import ModalAddGift from '../dialog/ModalAddGift';
import _ from 'lodash';
import SVG from "react-inlinesvg";
import client from '../../../../apollo';
import query_sme_catalog_product_variant from '../../../../graphql/query_sme_catalog_product_variant';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';
import mutate_coRetryWarehouseActionByPackage from '../../../../graphql/mutate_coRetryWarehouseActionByPackage';
import LoadingDialog from '../../FrameImage/LoadingDialog';
import mutate_orderCancelProviderOutbound from '../../../../graphql/mutate_orderCancelProviderOutbound';
const queryGetProductVariants = async (ids) => {
    if (ids?.length == 0) return [];

    const { data } = await client.query({
        query: query_sme_catalog_product_variant,
        variables: {
            where: {
                id: { _in: ids },
            },
        },
        fetchPolicy: "network-only",
    });

    return data?.sme_catalog_product_variant || [];
}
const OrderDetailTable = ({
    isMultiPackage, currentStatus, smeWarehouses,
    isOrderManual, dataScWareHouse, order, refetch,
    loading, onSetVariant, onUnLink, onSetCombo,
    store, index, smeVariants, loadingSmeVariant, orderDetail
}) => {
    const { formatMessage } = useIntl()
    const { addToast } = useToasts()
    const [isCopied, setIsCopied] = useState(false);
    const [modalAddGift, setModalAddGift] = useState(false)
    const [showAll, setShowAll] = useState(false);

    const changeDetail = JSON.parse(orderDetail?.change_detail) || [];
    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1500)
    };
    const isShowButton = order?.fulfillment_provider_type == 2 && order?.provider_or_id == null && ['pending', 'packing', 'packed'].includes(order?.pack_status)

    const infoStatusOr = useMemo(() => {
        return INFO_STATUS?.find(info => info?.status == order?.provider_or_status)
    }, [order])

    const [recreateProviderOutbound, { loading: loadingRecreate }] = useMutation(mutate_recreateProviderOutbound, {
        awaitRefetchQueries: true,
        refetchQueries: ['findOrderDetail']
    });

    const [orderCancelProviderOutbound, { loading: loadingOrderCancelProviderOutbound }] = useMutation(mutate_orderCancelProviderOutbound, {
        awaitRefetchQueries: true,
        refetchQueries: ['findOrderDetail']
    });

    const { data: warehouseBillData, loading: loadingBills, refetch: refetchWarehouseBill } = useQuery(query_warehouse_bills, {
        variables: { where: { order_id: { _eq: orderDetail?.id } }, },
        fetchPolicy: 'cache-and-network',
    });
    const warehouseBillInfo = useMemo(() => {
        return {
            code: warehouseBillData?.warehouse_bills?.[0]?.code,
            url: `/products/warehouse-bill/${warehouseBillData?.warehouse_bills?.[0]?.type}/${warehouseBillData?.warehouse_bills?.[0]?.id}`
        }
    }, [warehouseBillData])

    const smeWarehouseOrder = useMemo(() => {
        if (!smeWarehouses) return null;

        const smeWarehouseIdOrder = order?.sme_warehouse_id;
        const findedSmeWarehouse = smeWarehouses?.find(wh => wh?.id == smeWarehouseIdOrder);

        return findedSmeWarehouse;
    }, [smeWarehouses, order]);

    const scWarehouseOrder = useMemo(() => {
        if (!dataScWareHouse) return null;

        const scWarehouseIdOrder = order?.sc_warehouse_id;
        const findedScWarehouse = dataScWareHouse?.scGetWarehouses?.filter(wh => wh?.warehouse_type == 1)?.find(wh => wh?.id == scWarehouseIdOrder);

        return findedScWarehouse;
    }, [dataScWareHouse, order]);

    const { status: statusPack, pack_status } = useMemo(() => {
        let { status, pack_status } = PackStatusName(order?.pack_status, order?.orderPackageStatus)

        return { status, pack_status };
    }, [order])

    const [retryWarehouseActionByPackage, { loading: loadingRetryWarehouseActionByPackage }] = useMutation(mutate_coRetryWarehouseActionByPackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['findOrderDetail']
    });

    console.log(`CHECK PACKAGE: `, order);

    const onCancelProviderOutbound = useCallback(
        async () => {
            try {
                const { data } = await orderCancelProviderOutbound({
                    variables: {
                        order_id: order?.orderId,
                        package_id: order?.package_id
                    }
                });

                if (data?.orderCancelProviderOutbound?.success) {
                    addToast(formatMessage({ defaultMessage: "Hủy OR thành công" }), { appearance: 'success' })
                } else {
                    addToast(data?.orderCancelProviderOutbound?.message || formatMessage({ defaultMessage: "Hủy OR thất bại" }), { appearance: 'error' })
                }
            } catch (error) {
                addToast(formatMessage({ defaultMessage: "Hủy OR thất bại" }), { appearance: "error" });
            }
        }, [order]
    );

    const onRetryWarehouseActionByPackage = useCallback(
        async () => {
            try {
                const { data } = await retryWarehouseActionByPackage({
                    variables: {
                        package_id: order?.package_id,
                    }
                });

                if (!!data?.coRetryWarehouseActionByPackage?.success) {
                    addToast(formatMessage({ defaultMessage: "Load lại dữ liệu thành công" }), { appearance: "success" });
                } else {
                    addToast(`${data?.coRetryWarehouseActionByPackage?.message || formatMessage({ defaultMessage: 'Load lại dữ liệu thất bại' })}`, { appearance: "error" });
                }
            } catch (err) {
                addToast(formatMessage({ defaultMessage: "Load lại dữ liệu thất bại" }), { appearance: "error" });
            }
        }, [order?.id]
    );

    const renderStatusColor = useMemo(() => {
        let color = '';
        switch (pack_status) {
            case 'pending':
                color = '#FFA500'
                break;
            case 'waiting_for_packing':
                color = '#FF4500'
                break;
            case 'packing':
                color = '#5e7e1b'
                break;
            case 'packed':
                color = '#35955b'
                break;
            case 'shipped':
                color = '#3699ff'
                break;
            case 'shipping':
                color = '#913f92'
                break;
            case 'completed':
                color = '#03a84e'
                break;
            case 'cancelled':
                color = '#808080'
                break;
            default:
                color = '#000'
                break;
        }
        return (
            <span className='fs-12' style={{
                color: '#fff',
                backgroundColor: color,
                fontWeight: 'bold',
                padding: '4px 8px',
                borderRadius: '4px'
            }}>{formatMessage(statusPack)}</span>
        )
    }, [pack_status]);

    // return và cancel order
    const dataImported = currentStatus == 'return' ? orderDetail?.returnOrder?.returnWarehouseImport : orderDetail?.returnWarehouseImport
    const itemsImported = dataImported?.returnWarehouseImportItems

    const [variantsSme, setVariantsSme] = useState([])
    const returnOrderItems = currentStatus == 'return' ? orderDetail?.returnOrder?.returnOrderItems?.map(item => item?.orderItem) : orderDetail?.orderItems
    const isOrderReturnOrCancel = (currentStatus === 'return' && !!orderDetail?.returnOrder?.tracking_number) || currentStatus == 'faildelivery'

    const caculateImportQuantity = useCallback((id, order_item_id) => {
        if (!itemsImported) return 0;

        const findedImportItem = itemsImported?.find(item => item?.sme_variant_id === id && item?.returnOrderItem?.order_item_id === order_item_id);
        return findedImportItem?.import_quantity || 0
    }, [itemsImported])

    const caculateReturnQuantity = useCallback((id, order_item_id) => {
        if (!itemsImported) return 0;
        const findedImportItem = itemsImported?.find(item => item?.sme_variant_id === id && item?.returnOrderItem?.order_item_id === order_item_id);
        return findedImportItem?.return_quantity || 0
    }, [itemsImported])

    useMemo(async () => {
        if (!isOrderReturnOrCancel) return
        let idsVariant = returnOrderItems?.reduce((result, value) => {
            let total;
            if (!!value?.is_combo) {
                total = [value?.sme_variant_id || "", ...value?.comboItems?.map(item => item?.sme_variant_id),]
            } else {
                total = value?.sme_variant_id || ""
            }
            return result.concat(total)
        }, []);

        const returnImportIds = itemsImported?.map(_item => [_item?.sme_combo_variant_id, _item?.sme_variant_id]) || [];
        const idsQuery = _.flatten(idsVariant.concat(returnImportIds))?.filter(id => !!id);

        const variants = await queryGetProductVariants(idsQuery);
        let totalParentVariants = []
        const totalparentVariantId = variants?.flatMap(item => item?.parent_variant_id)?.filter(Boolean)

        if (totalparentVariantId?.length) {
            totalParentVariants = await queryGetProductVariants(totalparentVariantId);
        }
        const totalVariants = [...variants, ...totalParentVariants]
        const rebuild = returnOrderItems?.map((_item) => {
            let productVariant;
            const itemImportedByOrder = itemsImported?.filter(item => (item?.returnOrderItem?.order_item_id || item?.cancelOrderItem?.id) == _item?.id)
            const returnItem = currentStatus == 'return' ? orderDetail?.returnOrder?.returnOrderItems?.find((_ro) => _ro?.order_item_id === _item?.id) : returnOrderItems?.find((_ro) => _ro?.id === _item?.id)
            const isComboImport = itemImportedByOrder?.every(item => !!item?.sme_combo_variant_id);

            if (_item?.sme_variant_id) {
                const findedVariant = totalVariants?.find(variant => variant?.id === _item?.sme_variant_id);
                productVariant = {
                    ...findedVariant,
                    is_combo: _item?.is_combo,
                    combo_items_origin: findedVariant?.combo_items,
                    combo_items: _item?.comboItems?.map(_combo => {
                        const smeVariant = totalVariants?.find(variant => variant?.id === _combo?.sme_variant_id);
                        return {
                            ..._combo,
                            import_quantity: caculateImportQuantity(_combo?.sme_variant_id, _combo?.order_item_id),
                            return_quantity: caculateReturnQuantity(_combo?.sme_variant_id, _combo?.order_item_id) || ((_combo?.purchased_quantity / _item?.quantity_purchased) * returnItem?.return_quantity),
                            combo_item: smeVariant
                        }
                    })
                };
            } else {
                if (itemImportedByOrder?.length > 0) {
                    if (isComboImport) {
                        const findedVariant = totalVariants?.find(variant => variant?.id === itemImportedByOrder?.filter(item => (item?.returnOrderItem?.order_item_id || item?.cancelOrderItem?.id) == _item?.id)?.[0]?.sme_combo_variant_id);

                        productVariant = {
                            ...findedVariant,
                            import_quantity: caculateImportQuantity(itemImportedByOrder?.[0]?.sme_combo_variant_id, _item?.id),
                            return_quantity: caculateReturnQuantity(itemImportedByOrder?.[0]?.sme_combo_variant_id, _item?.id) || returnItem?.return_quantity,
                            is_combo: true,
                            combo_items_origin: findedVariant?.combo_items,
                            combo_items: findedVariant?.combo_items?.map(_combo => {
                                const findedVariantCombo = itemImportedByOrder?.find(item => item?.sme_variant_id == _combo?.combo_variant_id)
                                const smeVariant = totalVariants?.find(variant => variant?.id === _combo?.combo_variant_id);
                                return {
                                    ..._combo,
                                    import_quantity: findedVariantCombo?.import_quantity,
                                    return_quantity: findedVariantCombo?.return_quantity,
                                    combo_item: smeVariant
                                }
                            }),

                        };
                    } else {
                        const findImported = itemImportedByOrder?.find(item => (item?.returnOrderItem?.order_item_id || item?.cancelOrderItem?.id) == _item?.id)
                        let findedVariant = {}
                        findedVariant = totalVariants?.find(variant => findImported?.sme_variant_id === variant?.id);

                        if (findedVariant?.parent_variant_id) {
                            findedVariant = totalVariants?.find(variant => findedVariant?.parent_variant_id === variant?.id);
                        }
                        productVariant = {
                            ...findedVariant,
                            is_combo: false,
                            import_quantity: findImported?.import_quantity,
                            return_quantity: findImported?.return_quantity,
                        }
                    }
                } else {
                    productVariant = null;
                }
            }

            return {
                ..._item,
                productVariant,
                quantityReturn: currentStatus == 'return' ? returnItem?.return_quantity : returnItem?.quantity_purchased,
                quantity_purchased: returnItem?.orderItem?.quantity_purchased,
            };
        });

        setVariantsSme(rebuild)
    }, [currentStatus, orderDetail])

    const renderTable = useMemo(() => {
        return (
            <div style={{
                ...(((currentStatus == 'return' && orderDetail?.returnOrder?.tracking_number) || currentStatus == 'faildelivery') ? { background: '#D9D9D980', padding: '5px' } : {}),
                boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: currentStatus === 'product' ? 6 : 0,
                position: 'sticky', zIndex: '0'
            }} >
                <table className="table product-list table-borderless table-vertical-center fixed">
                    <thead style={{
                        borderBottom: '1px solid #F0F0F0',
                        borderLeft: '1px solid #cbced4',
                        borderRight: '1px solid #cbced4',
                        ...(((currentStatus == 'return' && orderDetail?.returnOrder?.tracking_number) || currentStatus == 'faildelivery') ? { background: '#D9D9D980' } : {}),
                    }}>
                        {currentStatus === 'product' && (
                            <tr className="font-size-lg">
                                <th style={{ fontSize: '14px' }} width="55%">
                                    {isOrderManual ? formatMessage({ defaultMessage: 'Hàng hóa kho' }) : formatMessage({ defaultMessage: 'Hàng hóa sàn' })}
                                </th>
                                {isOrderManual && <th className='text-center' style={{ fontSize: '14px' }} width="10%">{formatMessage({ defaultMessage: 'ĐVT' })}</th>}
                                <th style={{ fontSize: '14px' }}>{formatMessage({ defaultMessage: 'Đơn giá' })}</th>
                                <th style={{ fontSize: '14px' }} className="text-center">{formatMessage({ defaultMessage: 'Số lượng' })}</th>
                                <th style={{ fontSize: '14px' }}>
                                    <span className='float-right'>
                                        {formatMessage({ defaultMessage: 'Thành tiền' })}
                                    </span>
                                </th>
                            </tr>
                        )}
                        {currentStatus === 'connect' && (
                            <tr className="font-size-lg">
                                {!isOrderManual && <th style={{ fontSize: '14px' }} width="25%">{formatMessage({ defaultMessage: 'Hàng hóa sàn' })}</th>}
                                <th style={{ fontSize: '14px' }} width={isOrderManual ? "41%" : "25%"}>{formatMessage({ defaultMessage: 'Hàng hóa kho' })}</th>
                                <th style={{ fontSize: '14px' }} className="text-center" width={isOrderManual ? "12%" : "10%"}>{formatMessage({ defaultMessage: 'ĐVT' })}</th>
                                <th style={{ fontSize: '14px' }} className="text-center" width={isOrderManual ? "13%" : "10%"}>{formatMessage({ defaultMessage: 'Cần khóa/trừ' })}</th>
                                {!order?.fulfillment_provider_connected_id && <th style={{ fontSize: '14px' }} className="text-center" width={isOrderManual ? "20%" : "16%"}>{formatMessage({ defaultMessage: 'Đã khóa/trừ' })}</th>}
                                <th style={{ fontSize: '14px', borderBottom: '0.5px solid #cbced4' }} className='text-center' width={"14%"}>{formatMessage({ defaultMessage: 'Thao tác' })}</th>
                            </tr>
                        )}
                        {isOrderReturnOrCancel && (
                            <tr className="font-size-lg">
                                {orderDetail?.source != 'manual' && <th style={{ fontSize: '14px' }} width="25%">{formatMessage({ defaultMessage: 'Hàng hóa sàn' })}</th>}
                                <th style={{ fontSize: '14px' }} width="25%">{formatMessage({ defaultMessage: 'Hàng hóa kho' })}</th>
                                <th style={{ fontSize: '14px' }} className="text-center" width={isOrderManual ? "12%" : "10%"}>{formatMessage({ defaultMessage: 'ĐVT' })}</th>
                                <th style={{ fontSize: '14px' }} className="text-center" width="12%">{formatMessage({ defaultMessage: 'Trạng thái' })}</th>
                                <th style={{ fontSize: '14px' }} className="text-center" width="14%">{formatMessage({ defaultMessage: 'Số lượng nhập kho' })}</th>
                            </tr>
                        )}

                    </thead>
                    <tbody>
                        {loading && <div className='mt-10 text-center'>
                            <span className="spinner spinner-primary mb-8"></span>
                        </div>}
                        {currentStatus === 'product' && !!isOrderManual && order?.data?.map((_item, index) => {
                            return <OrderDetailSmeRow
                                key={`order-detail-${index}`}
                                smeVariants={smeVariants}
                                loadingSmeVariant={loadingSmeVariant}
                                smeWarehouseOrder={smeWarehouseOrder}
                                order={_item}
                                index={index}
                            />
                        })}
                        {currentStatus === 'product' && !isOrderManual && order?.data?.filter((item) => !(item?.is_gift && item?.ref_product_id == null))?.map((_item, index) => {
                            return <OrderDetailRow
                                key={`order-detail-${index}`}
                                order={_item}
                                index={index}
                            />
                        })}
                        {currentStatus === 'connect' && order?.data?.map((_item, index) =>
                            <OrderDetailConnectRow
                                key={`order-detail-${index}`}
                                onSetVariant={onSetVariant}
                                onUnLink={onUnLink}
                                infoStatusOr={infoStatusOr}
                                provider={order?.fulfillment_provider_connected_id}
                                status={pack_status}
                                isOrderManual={isOrderManual}
                                onSetCombo={onSetCombo}
                                smeVariants={smeVariants}
                                smeWarehouseOrder={smeWarehouseOrder}
                                order={_item}
                                index={index}
                                refetch={refetch}
                            />
                        )}
                        {isOrderReturnOrCancel &&
                            variantsSme?.map((_item, index) =>
                                <OrderReturnOrderRow
                                    isOrderManual={isOrderManual}
                                    onSetCombo={onSetCombo}
                                    returnItems={itemsImported}
                                    isImported={(currentStatus == 'return' && orderDetail?.returnOrder?.returnWarehouseImport) || (currentStatus == 'faildelivery' && orderDetail?.returnWarehouseImport)}
                                    order={_item}
                                />
                            )}

                    </tbody>
                </table>

            </div>
        )
    }, [currentStatus, onSetCombo, itemsImported,
        variantsSme, order, infoStatusOr, loading,
        orderDetail, isOrderReturnOrCancel, isOrderManual]);

    const [show, setShow] = useState(false);

    const CustomToggle = ({ eventKey, content }) => {

        const decoratedOnClick = useAccordionToggle(eventKey, () => {

            setShow(prev => !prev);
        });

        return (
            <div onClick={decoratedOnClick}>{content}</div>
        );
    };

    const errorView = useMemo(() => {
        const errorsPackage = {
            ...(!!order?.warehouse_error_message ? {
                warehouse_error_message: order?.warehouse_error_message,
            } : {}),
            ...(!!order?.connector_channel_error ? {
                connector_channel_error: order?.connector_channel_error,
            } : {}),
            ...(!!order?.logistic_provider_error ? {
                logistic_provider_error: order?.logistic_provider_error,
            } : {}),
        };

        if (!Object.keys(errorsPackage)?.length) {
            return null
        }

        return <div className='d-flex flex-column'>
            {Object.keys(errorsPackage).map(key => {
                return <div className='my-2 d-flex align-items-center w-100'>
                    <div className='d-flex py-2 px-4 rounded-sm w-100' style={{ background: 'rgba(254, 86, 41, 0.31)' }}>
                        <SVG src={toAbsoluteUrl("/media/svg/ic-warning.svg")} />
                        <span style={{ color: '#F80D0D', wordBreak: 'break-word' }} className='ml-4'>
                            {errorsPackage?.[key]}
                        </span>
                    </div>
                    {key == 'warehouse_error_message' && <span className='d-flex align-items-center text-danger ml-4 cursor-pointer' style={{ minWidth: 'fit-content' }} onClick={onRetryWarehouseActionByPackage}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
                        </svg>
                        <span className='ml-1'>{formatMessage({ defaultMessage: 'Thử lại' })}</span>
                    </span>}
                </div>
            })}
        </div>
    }, [order]);

    const packView = useMemo(() => {
        return (
            <div className='mb-2 mt-4 d-flex align-items-center justify-content-between'>
                <div className='mt-2 mb-2'>
                    {isMultiPackage ? show ? (
                        <svg
                            className={`mr-2 cursor-pointer bi bi-chevron-down`}
                            xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"
                        >
                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708" />
                        </svg>
                    ) : (
                        <svg
                            className={"mr-2 cursor-pointer bi bi-chevron-up"}
                            xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"
                        >
                            <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z" />
                        </svg>
                    ) : null}
                    <span>{order?.pack_no ? `Kiện hàng ${order?.pack_no}: ` : `Mã kiện hàng: `}</span>
                    <span>{order?.system_package_number || '--'}</span>
                    <OverlayTrigger overlay={<Tooltip><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                        <span style={{ cursor: 'pointer' }} onClick={(e) => {
                            e.stopPropagation()
                            onCopyToClipBoard(order?.system_package_number || '')
                        }}>
                            <span className='ml-2 mr-4'><i style={{ fontSize: 12 }} class="far fa-copy text-info"></i></span>
                        </span>
                    </OverlayTrigger>
                    {renderStatusColor}
                </div>
                <div className='mt-2 mb-2'>
                    {formatMessage({ defaultMessage: `Mã vận đơn: ` })}{' '}
                    <span>{order?.trackingNumber || '--'}</span>
                    <OverlayTrigger overlay={<Tooltip><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                        <span style={{ cursor: 'pointer' }} onClick={(e) => {
                            e.stopPropagation()
                            onCopyToClipBoard(order?.trackingNumber || '')
                        }}>
                            <span className='ml-2 mr-4'><i style={{ fontSize: 12 }} class="far fa-copy text-info"></i></span>
                        </span>
                    </OverlayTrigger>
                </div>
            </div>
        )
    }, [isMultiPackage, order, show, isCopied])

    const warehouseView = useMemo(() => {
        return (
            <>
                <div className='row mb-2 mt-4'>
                    <div className='col-4 d-flex align-items-center'>
                        <span>{formatMessage({ defaultMessage: 'Kho vật lý' })}: <strong>{smeWarehouseOrder?.name || '--'}</strong></span>
                    </div>
                    {!!store?.enable_multi_warehouse &&
                        <div className='col-8 d-flex align-items-center'>
                            <span>{formatMessage({ defaultMessage: 'Kho kênh bán' })}: <strong>{scWarehouseOrder?.warehouse_name || '--'}</strong></span>
                        </div>}
                    <div className={`${(!!store?.enable_multi_warehouse || ['return', 'faildelivery'].includes(currentStatus)) ? 'row w-100' : 'col-8'} d-flex`}>
                        <div className='d-flex justify-content-between mr-2' style={{ flex: '1' }}>
                            {order?.fulfillment_provider_connected_id && !['return', 'faildelivery', 'product'].includes(currentStatus) &&
                                <div className='d-flex justify-content-between' style={{ flex: '1' }}>
                                    <div className='d-flex justify-conetent-between align-items-center' style={{ marginLeft: '30px' }}>
                                        <span className='mr-2'>{formatMessage({ defaultMessage: 'Trạng thái OR' })}</span>
                                        <TooltipWrapper note={formatMessage({ defaultMessage: "Trạng thái đơn hàng ở kho dịch vụ." })}>
                                            {TOOLTIP_SVG}
                                        </TooltipWrapper>
                                        <span>: </span>
                                        <strong className='ml-3' style={{ color: infoStatusOr?.color }}>
                                            {infoStatusOr?.text || '--'}
                                        </strong>
                                        {!!order?.provider_or_id && order?.wms_hold == 1 && <span className='ml-1'>({formatMessage({ defaultMessage: 'Tạm hoãn xử lý' })})</span>}
                                        {infoStatusOr?.status == PROVIDER_STATUS_ERROR && (
                                            <TooltipWrapper note={order?.provider_or_error}>
                                                <img style={{ cursor: 'pointer', marginLeft: '4px' }} src={toAbsoluteUrl("/media/warningsvg.svg")}></img>
                                            </TooltipWrapper>
                                        )}
                                    </div>
                                    <div className='ml-4' >
                                        <AuthorizationWrapper keys={['order_detail_provider_outbound_cancel']}>
                                            {!!order?.show_cancel_outbound && <button
                                                disabled={loadingOrderCancelProviderOutbound}
                                                onClick={onCancelProviderOutbound}
                                                className='btn btn-primary'
                                            >
                                                {formatMessage({ defaultMessage: "Hủy OR" })}
                                            </button>}
                                        </AuthorizationWrapper>
                                        <AuthorizationWrapper keys={['order_detail_provider_outbound_recreate']}>
                                            {/* {isShowButton && ( */}
                                            {!!order?.need_create_outbound && (
                                                <button disabled={loadingRecreate} onClick={async () => {
                                                    const { data } = await recreateProviderOutbound({
                                                        variables: {
                                                            order_id: order?.orderId,
                                                            package_id: order?.package_id
                                                        }
                                                    })
                                                    if (data?.recreateProviderOutbound?.success) {
                                                        refetch()
                                                        addToast(data?.recreateProviderOutbound?.message, { appearance: 'success' })
                                                    } else {
                                                        refetch()
                                                        addToast(data?.recreateProviderOutbound?.message, { appearance: 'error' })
                                                    }
                                                }} className='btn btn-primary ml-2'>{formatMessage({ defaultMessage: "Đẩy lại đơn" })}</button>
                                            )}
                                        </AuthorizationWrapper>
                                    </div>
                                </div>}
                        </div>
                        <AuthorizationWrapper keys={['order_detail_add_gift']}>
                            {currentStatus == 'connect' && !orderDetail?.is_old_order && !!order?.show_add_gift && <button
                                onClick={() => { setModalAddGift(true) }}
                                type="submit"
                                className="text-white btn btn-primary btn-elevate"
                                style={{
                                    width: 'max-content',
                                }}
                            >
                                {formatMessage({ defaultMessage: "Thêm quà tặng" })}
                            </button>}
                        </AuthorizationWrapper>
                    </div>
                </div>
                <div className='mb-2 mt-4 invalid-error'>
                    {!!orderDetail?.abnormal && (
                        <>
                            <span className='mb-2' style={{ color: '#F5222D' }}>{formatMessage({ defaultMessage: 'Đơn hàng có thay đổi, cụ thể' })} :</span>
                            {changeDetail.slice(0, showAll ? changeDetail.length : 2).map((item, index) => (
                                <p key={index}><strong>{item}</strong></p>
                            ))}
                            {changeDetail.length > 2 && (
                                <span
                                    role="button"
                                    className='text-primary'
                                    onClick={() => setShowAll(pre => !pre)}>
                                    {showAll ? formatMessage({ defaultMessage: 'Thu gọn' }) : formatMessage({ defaultMessage: 'Xem thêm' })}
                                </span>
                            )}
                        </>
                    )}
                </div>
            </>
        )
    }, [isMultiPackage, order, infoStatusOr, showAll])

    const returnOrderSectionView = useMemo(() => {
        return (
            <>
                {(currentStatus === 'return' || currentStatus == 'faildelivery') &&
                    <SectionReturn
                        refetch={() => {
                            refetch()
                            refetchWarehouseBill()
                        }}
                        smeWarehouses={smeWarehouses}
                        warehouseBillInfo={warehouseBillInfo}
                        currentStatus={currentStatus}
                        orderDetail={orderDetail}
                    />}
                {currentStatus === 'connect' && !isMultiPackage && (
                    <div className='py-3 px-4 d-flex align-items-center' style={{ background: '#cef4fc', borderTopRightRadius: 6, border: '1px solid #D9D9D9', borderBottom: 'unset' }}>
                        <i className="mr-2 fs-14 fas fa-info-circle" style={{ color: '#578e9b' }}></i>
                        <span style={{ color: '#578e9b' }}>{formatMessage({ defaultMessage: 'Thông tin liên kết của hàng hóa kho với đơn hàng trên sàn. Thao tác liên kết/ ngắt liên kết chỉ ảnh hưởng liên kết với đơn hàng.' })}</span>
                    </div>
                )}
                {currentStatus === 'connect' && !!order?.need_create_outbound && (
                    <div className='py-3 px-4 d-flex align-items-center' style={{ background: '#cef4fc', borderTopRightRadius: 6, border: '1px solid #D9D9D9', borderBottom: 'unset' }}>
                        {LIGHT_BULB}
                        <span style={{ color: '#578e9b' }}>
                            {formatMessage({ defaultMessage: 'Cần khắc phục đơn trạng thái OR lỗi. Thao tác' })}
                            <span className="mx-2"
                                onClick={async () => {
                                    if (loadingRecreate) return
                                    const { data } = await recreateProviderOutbound({
                                        variables: {
                                            order_id: order?.orderId,
                                            package_id: order?.package_id
                                        }
                                    })
                                    if (data?.recreateProviderOutbound?.success) {
                                        refetch()
                                        addToast(data?.recreateProviderOutbound?.message, { appearance: 'success' })
                                    } else {
                                        refetch()
                                        addToast(data?.recreateProviderOutbound?.message, { appearance: 'error' })
                                    }
                                }}
                                style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                                {formatMessage({ defaultMessage: 'Đẩy đơn lại' })}
                            </span>
                            <span>{formatMessage({ defaultMessage: 'để tạo đơn sang hệ thống Vietful.' })}</span>
                        </span>
                    </div>
                )}
            </>
        )
    }, [currentStatus, order, isMultiPackage])
    return (
        <div className='mb-4' key={index}>
            <LoadingDialog show={loadingRetryWarehouseActionByPackage || loadingOrderCancelProviderOutbound} />
            {isMultiPackage ? (
                <>
                    <Accordion style={{ minHeight: 0 }} defaultActiveKey="pack">
                        <div id='pack'>
                            <CustomToggle eventKey="pack" content={packView} />
                            <Accordion.Collapse eventKey="pack">
                                <>
                                    {errorView}
                                    {warehouseView}
                                    {returnOrderSectionView}
                                    {renderTable}
                                </>
                            </Accordion.Collapse>
                        </div>
                    </Accordion>
                </>
            ) : (
                <>
                    {errorView}
                    {warehouseView}
                    {returnOrderSectionView}
                    {renderTable}

                </>
            )}
            {modalAddGift && <ModalAddGift show={modalAddGift}
                onHide={() => { setModalAddGift(false) }}
                smeWarehouseOrder={order}
            />}
        </div>
    )
};

export default OrderDetailTable;