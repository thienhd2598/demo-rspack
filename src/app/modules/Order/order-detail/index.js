import React, { memo, useMemo, useEffect, Fragment, useState, } from 'react';
import {
    Card,
    CardBody,
} from "../../../../_metronic/_partials/controls";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useSubheader } from "../../../../_metronic/layout/_core/MetronicSubheader";
import { useMutation, useQuery } from "@apollo/client";
import { useParams } from 'react-router-dom';
import _ from 'lodash';
import { STATUS_ORDER_DETAIL, queryGetSmeProductVariants } from '../OrderUIHelpers';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import OrderDetailTable from './OrderDetailTable';
import SVG from "react-inlinesvg";
import query_scGetOrder from '../../../../graphql/query_scGetOrder';
import OrderProductVariantDialog from '../dialog/OrderProductVariantDialog';
import DeleteProductOrder from '../dialog/DeleteProductOrder';
import ModalCombo from '../../Products/products-list/dialog/ModalCombo';
import { useIntl } from 'react-intl';
import query_scGetWarehouses from '../../../../graphql/query_scGetWarehouses';
import query_sme_catalog_stores from '../../../../graphql/query_sme_catalog_stores';
import { ConfirmDialog } from './ConfirmDialog';
import InfoUser from './components/InfoUser';
import InfoLogistic from './components/InfoLogistic';
import InfoPayment from './components/InfoPayment';
import InfoHistory from './components/InfoHistory';
import clsx from 'clsx';
import query_detailFinanceOrder from '../../../../graphql/query_detailFinanceOrder';
import EditableNoteVertical from './components/EditableNoteVertical';
import mutate_coUpdateOrderNote from '../../../../graphql/mutate_coUpdateOrderNote';
import LoadingDialog from '../../Products/product-new/LoadingDialog';
import { useToasts } from 'react-toast-notifications';
import { useLocation, useHistory } from 'react-router-dom'
import queryString from 'querystring'
import InfoCost from './components/InfoCost';
import { PackStatusName } from '../OrderStatusName';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';
const OrderDetail = memo(({ }) => {
    const params = useParams();

    const { formatMessage } = useIntl()
    const DELIVERY_METHOD = {
        1: formatMessage({ defaultMessage: 'ĐVVC đến lấy' }),
        2: formatMessage({ defaultMessage: 'Mang ra bưu cục' })
    };
    const location = useLocation();
    const history = useHistory();
    const paramsQuery = queryString.parse(location.search.slice(1, 100000));
    const { addToast } = useToasts();
    const { setBreadcrumbs } = useSubheader();
    const [isCopied, setIsCopied] = useState(false);
    const [scCurrentVariantSku, setScCurrentVariantSku] = useState(null);
    const [currentOrderItemId, setCurrentOrderItemId] = useState(null);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [currentComboItemId, setCurrentComboItemId] = useState(false);
    const [currentLstExist, setCurrentLstExist] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [dataCombo, setDataCombo] = useState(null);
    const [loadingSmeVariant, setLoadingSmeVariant] = useState(false);
    const [smeVariants, setSmeVariants] = useState(null);
    const [currentTabNote, setCurrentTabNote] = useState('buyer');
    const [currentStatus, setCurrentStatus] = useState(paramsQuery?.type || 'connect');
    const [addSmeNoteMutation, { loading: loadingAddSmeNote }] = useMutation(mutate_coUpdateOrderNote, {
        refetchQueries: ['findOrderDetail']
    })

    const { data: orderDetail, loading: loadingDetail, refetch, error } = useQuery(query_scGetOrder, {
        variables: {
            id: Number(params.id),
            context: 'order'
        },
        fetchPolicy: 'cache-and-network',
        onCompleted: async (data) => {
            if (data?.findOrderDetail) {
                setLoadingSmeVariant(true);
                const smeVariants = await queryGetSmeProductVariants(data?.findOrderDetail?.orderItems?.flatMap(item => {
                    if (item?.is_combo) {
                        return item?.comboItems?.map(combo => combo?.sme_variant_id)?.concat(item?.sme_variant_id)
                    }

                    return item?.sme_variant_id
                }));

                setLoadingSmeVariant(false);
                setSmeVariants(smeVariants);
            }
        }
    });
    const { data: dataDetailFinanceOrder, loading: loadingDetailFinanceOrder } = useQuery(query_detailFinanceOrder, {
        variables: {
            order_id: Number(params.id),
            object_type: 1
        },
        fetchPolicy: 'cache-and-network',
    });
    const { data: dataSmeWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataScWareHouse } = useQuery(query_scGetWarehouses, {
        fetchPolicy: 'cache-and-network'
    });
    const isOrderManual = useMemo(() => orderDetail?.findOrderDetail?.source != 'platform', [orderDetail]);

    let _store = useMemo(() => {
        if (!orderDetail) return null;
        let { sc_stores, findOrderDetail } = orderDetail;
        let _store = sc_stores.find(_st => _st.id == findOrderDetail?.store_id);

        return _store
    }, [orderDetail]
    );

    let _channel = useMemo(() => {
        if (!orderDetail) return null;
        let { op_connector_channels, findOrderDetail } = orderDetail;
        let _store = op_connector_channels.find(_st => _st.code == findOrderDetail?.connector_channel_code);

        return _store
    }, [orderDetail]
    );


    useEffect(() => {
        setBreadcrumbs([{ title: formatMessage({ defaultMessage: 'Chi tiết đơn hàng' }) }])
    }, []);

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => { setIsCopied(false) }, 1500)
    };

    const dataOrderPackage = useMemo(() => {
        if (!orderDetail?.findOrderDetail) return [];
        let orderPackage = []
        if (currentStatus == 'return' || currentStatus == 'faildelivery') {
            orderPackage = [{
                data: orderDetail?.findOrderDetail?.orderItems?.map(item => ({ ...item, is_old_order: orderDetail?.findOrderDetail?.is_old_order })),
                sme_warehouse_id: orderDetail?.findOrderDetail?.logisticsPackages[0]?.sme_warehouse_id,
                sc_warehouse_id: orderDetail?.findOrderDetail?.logisticsPackages[0]?.sc_warehouse_id,
                orderPackageStatus: orderDetail?.findOrderDetail?.logisticsPackages[0]?.order?.status,
                pack_status: orderDetail?.findOrderDetail?.logisticsPackages[0]?.pack_status,
                pack_no: orderDetail?.findOrderDetail?.logisticsPackages[0]?.pack_no,
                shipment_param_need_load: orderDetail?.findOrderDetail?.shipment_param_need_load,
                system_package_number: orderDetail?.findOrderDetail?.logisticsPackages[0]?.system_package_number || '--',
                trackingNumber: orderDetail?.findOrderDetail?.logisticsPackages[0]?.tracking_number || '--',
                connector_channel_error: orderDetail?.findOrderDetail?.logisticsPackages[0]?.connector_channel_error,
                logistic_provider_error: orderDetail?.findOrderDetail?.logisticsPackages[0]?.logistic_provider_error,
                warehouse_error_message: orderDetail?.findOrderDetail?.logisticsPackages[0]?.warehouse_error_message,
                wms_hold: orderDetail?.findOrderDetail?.logisticsPackages[0]?.wms_hold,
                provider_or_id: orderDetail?.findOrderDetail?.logisticsPackages[0]?.provider_or_id,
                need_create_outbound: orderDetail?.findOrderDetail?.logisticsPackages[0]?.need_create_outbound,
                show_add_gift: orderDetail?.findOrderDetail?.logisticsPackages[0]?.show_add_gift,
                show_cancel_outbound: orderDetail?.findOrderDetail?.logisticsPackages[0]?.show_cancel_outbound,
            }]
        } else {
            orderPackage = orderDetail?.findOrderDetail?.logisticsPackages?.length > 0
                ? orderDetail?.findOrderDetail?.logisticsPackages?.map((_package) => ({
                    title: `${formatMessage({ defaultMessage: 'Mã vận đơn' })}: ${_package?.tracking_number || '--'}`,
                    trackingNumber: _package?.tracking_number || '--',
                    system_package_number: _package?.system_package_number || '--',
                    sme_warehouse_id: _package?.sme_warehouse_id,
                    sc_warehouse_id: _package?.sc_warehouse_id,
                    pack_no: _package?.pack_no,
                    pack_status: _package?.pack_status,
                    data: orderDetail?.findOrderDetail?.orderItems?.filter(
                        _item => _item?.package_id === _package?.id
                    )?.map(item => ({ ...item, is_old_order: orderDetail?.findOrderDetail?.is_old_order })),
                    warehouse_error_message: _package?.warehouse_error_message,
                    connector_channel_error: _package?.connector_channel_error,
                    logistic_provider_error: _package?.logistic_provider_error,
                    provider_or_error: _package?.provider_or_error,
                    provider_or_id: _package?.provider_or_id,
                    orderPackageStatus: _package?.order?.status,
                    shipment_param_need_load: orderDetail?.findOrderDetail?.shipment_param_need_load,
                    provider_or_status: _package?.provider_or_status,
                    fulfillment_provider_connected_id: _package?.fulfillment_provider_connected_id,
                    orderId: orderDetail?.findOrderDetail?.id,
                    fulfillment_provider_type: _package?.fulfillment_provider_type,
                    package_id: _package?.id,
                    wms_hold: _package?.wms_hold,
                    need_create_outbound: _package?.need_create_outbound,
                    show_add_gift: _package?.show_add_gift,
                    show_cancel_outbound: _package?.show_cancel_outbound,
                })
                )
                : [{
                    title: formatMessage({ defaultMessage: "Mã vận đơn" }) + ": --",
                    trackingNumber: '--',
                    data: orderDetail?.findOrderDetail?.orderItems?.map(item => ({ ...item, is_old_order: orderDetail?.findOrderDetail?.is_old_order }))
                }]
        }

        return orderPackage || []
    }, [orderDetail?.findOrderDetail, currentStatus]
    );

    const TAB_STATUS = useMemo(() => {
        return [
            { key: 'connect', title: formatMessage({ defaultMessage: 'Thông tin xử lý kho' }) },
            { key: 'product', title: formatMessage({ defaultMessage: 'Thông tin sản phẩm' }) },
            (orderDetail?.findOrderDetail?.returnOrder ? { key: 'return', title: formatMessage({ defaultMessage: 'Thông tin trả hàng/hoàn tiền' }) } : null),
            (orderDetail?.findOrderDetail?.logistic_fail ? { key: 'faildelivery', title: formatMessage({ defaultMessage: 'Thông tin hủy bất thường' }) } : null),
        ]?.filter(Boolean);
    }, [orderDetail])

    const { status: statusPack, pack_status } = useMemo(() => {
        let { status, pack_status } = PackStatusName(
            dataOrderPackage[0]?.pack_status,
            dataOrderPackage[0]?.orderPackageStatus,
            dataOrderPackage[0]?.pack_status == 'pending' && !!dataOrderPackage[0]?.shipment_param_need_load
        )

        return { status, pack_status };
    }, [dataOrderPackage])

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
            case 'wait_shipping_carrier':
                color = '#171c72'
                break;
            case 'shipping':
                color = '#913f92'
                break;
            case 'in_cancel':
                color = '#0a4968'
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

    return (
        <Fragment>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Chi tiết đơn hàng" }) + " - UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Chi tiết đơn hàng" }) + " - UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Chi tiết đơn hàng" }) + " - UpBase"} />
            </Helmet>
            <LoadingDialog show={loadingAddSmeNote} />
            <ConfirmDialog
                show={(orderDetail?.findOrderDetail === null) || (params?.id == 'null')}
                onHide={() => {
                    try {
                        window.open("about:blank", "_self")
                        window.close()
                    } catch (err) {

                    }
                }} />
            <ModalCombo dataCombo={dataCombo} onHide={() => setDataCombo(null)} />
            <OrderProductVariantDialog
                show={showConnectModal}
                comboItemId={currentComboItemId}
                currentLstExist={currentLstExist}
                onHide={() => {
                    setScCurrentVariantSku(null);
                    setCurrentOrderItemId(null);
                    setCurrentLstExist(null);
                    setShowConnectModal(false);
                    setCurrentComboItemId(null)
                }}
                scVariantSku={scCurrentVariantSku}
                order_item_id={currentOrderItemId}
            />

            <DeleteProductOrder show={showDeleteModal} onHide={() => setShowDeleteModal(false)} order_item_id={currentOrderItemId} />
            {!loadingDetail && <div className='d-flex justify-content-between align-items-center'>
                <div className='d-flex align-items-center'>
                    <div className='align-items-center mr-12'>
                        {!!_channel?.logo_asset_url &&
                            <img src={_channel?.logo_asset_url} className='mr-1' style={{ width: 15, height: 15, objectFit: 'contain' }} alt="" />}
                        <span>{_store?.name}</span>
                    </div>
                    <div className='d-flex align-items-center'>
                        <span className='mr-1'>{formatMessage({ defaultMessage: 'Mã đơn hàng' })}:</span>
                        <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                            <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(orderDetail?.findOrderDetail?.ref_id)}>
                                {`${orderDetail?.findOrderDetail?.ref_id}`}
                                <span className='ml-2 mr-4'><i style={{ fontSize: 12 }} className="far fa-copy text-info"></i></span>
                            </span>
                        </OverlayTrigger>
                        {orderDetail?.findOrderDetail?.source == 'manual' && <div className='ml-4'>
                            <OverlayTrigger overlay={<Tooltip title='Đơn thủ công' style={{ color: 'red' }}><span>{formatMessage({ defaultMessage: 'Đơn thủ công' })}</span></Tooltip>}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-primary bi bi-hand-index" viewBox="0 0 16 16">
                                    <path d="M6.75 1a.75.75 0 0 1 .75.75V8a.5.5 0 0 0 1 0V5.467l.086-.004c.317-.012.637-.008.816.027.134.027.294.096.448.182.077.042.15.147.15.314V8a.5.5 0 1 0 1 0V6.435l.106-.01c.316-.024.584-.01.708.04.118.046.3.207.486.43.081.096.15.19.2.259V8.5a.5.5 0 0 0 1 0v-1h.342a1 1 0 0 1 .995 1.1l-.271 2.715a2.5 2.5 0 0 1-.317.991l-1.395 2.442a.5.5 0 0 1-.434.252H6.035a.5.5 0 0 1-.416-.223l-1.433-2.15a1.5 1.5 0 0 1-.243-.666l-.345-3.105a.5.5 0 0 1 .399-.546L5 8.11V9a.5.5 0 0 0 1 0V1.75A.75.75 0 0 1 6.75 1M8.5 4.466V1.75a1.75 1.75 0 1 0-3.5 0v5.34l-1.2.24a1.5 1.5 0 0 0-1.196 1.636l.345 3.106a2.5 2.5 0 0 0 .405 1.11l1.433 2.15A1.5 1.5 0 0 0 6.035 16h6.385a1.5 1.5 0 0 0 1.302-.756l1.395-2.441a3.5 3.5 0 0 0 .444-1.389l.271-2.715a2 2 0 0 0-1.99-2.199h-.581a5 5 0 0 0-.195-.248c-.191-.229-.51-.568-.88-.716-.364-.146-.846-.132-1.158-.108l-.132.012a1.26 1.26 0 0 0-.56-.642 2.6 2.6 0 0 0-.738-.288c-.31-.062-.739-.058-1.05-.046zm2.094 2.025" />
                                </svg>
                            </OverlayTrigger>
                        </div>}
                    </div>
                </div>
                {isOrderManual && <div className='d-flex algin-items-center'>
                    {formatMessage({ defaultMessage: 'Người phụ trách: {name}' }, { name: orderDetail?.findOrderDetail?.person_in_charge || '--' })}
                </div>}
            </div>}
            {!!orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.connector_channel_error
                && <div className='mt-4'>
                    <div className='d-flex py-2 px-4 rounded-sm' style={{ background: 'rgba(254, 86, 41, 0.31)' }}>
                        <SVG src={toAbsoluteUrl("/media/svg/ic-warning.svg")} /> <span style={{ color: '#F80D0D', wordBreak: 'break-word' }} className='ml-4'>{orderDetail?.findOrderDetail?.logisticsPackages?.[0]?.connector_channel_error}</span>
                    </div>
                </div>}
            <div className='row'>
                <div className='col-4 my-6'>
                    <InfoUser orderDetail={orderDetail} />
                </div>
                <div className='col-4 my-6'>
                    <InfoLogistic
                        orderDetail={orderDetail}
                        isOrderManual={isOrderManual}
                        deliveryMethods={DELIVERY_METHOD}
                    />
                </div>
                <div className='col-4 my-6'>
                    <InfoPayment
                        orderDetail={orderDetail}
                        isOrderManual={isOrderManual}
                        isCopied={isCopied}
                        onCopyToClipBoard={onCopyToClipBoard}
                    />
                </div>
            </div>
            <div className='row'>

                <div className='col-order-left'>
                    <Card>
                        <CardBody>
                            <div className='d-flex col-12 align-items-center justify-content-between'>
                                <strong className='fs-14'>
                                </strong>
                                {loadingDetailFinanceOrder && <span className="spinner spinner-primary"></span>}
                                {!loadingDetailFinanceOrder && !!dataDetailFinanceOrder?.detailFinanceOrder && <strong className='fs-14 d-flex align-items-center'>
                                    <span>{formatMessage({ defaultMessage: 'Chứng từ bán hàng' })}:</span>
                                    <span className='text-primary cursor-pointer ml-1' onClick={() => window.open(`/finance/${dataDetailFinanceOrder?.detailFinanceOrder?.id}`, '_blank')}>
                                        {dataDetailFinanceOrder?.detailFinanceOrder?.code}
                                    </span>
                                    <OverlayTrigger overlay={<Tooltip><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                                        <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(dataDetailFinanceOrder?.detailFinanceOrder?.code || '')}>
                                            <span className='ml-2 mr-4'><i style={{ fontSize: 12 }} class="far fa-copy text-info"></i></span>
                                        </span>
                                    </OverlayTrigger>
                                </strong>}
                            </div>

                            {dataOrderPackage?.length == 1 && (
                                <div className='mb-2 mt-4 d-flex align-items-center justify-content-between'>
                                    <div className='mt-2 mb-2'>
                                        <span>{dataOrderPackage[0]?.pack_no ? `Kiện hàng ${dataOrderPackage[0]?.pack_no}: ` : `Mã kiện hàng: `}</span>
                                        <span>{dataOrderPackage[0]?.system_package_number || '--'}</span>
                                        <OverlayTrigger overlay={<Tooltip><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                                            <span style={{ cursor: 'pointer' }} onClick={(e) => {
                                                e.stopPropagation()
                                                onCopyToClipBoard(dataOrderPackage[0]?.system_package_number || '')
                                            }}>
                                                <span className='ml-2 mr-4'><i style={{ fontSize: 12 }} class="far fa-copy text-info"></i></span>
                                            </span>
                                        </OverlayTrigger>
                                        {renderStatusColor}
                                    </div>
                                    <div className='mt-2 mb-2'>
                                        {formatMessage({ defaultMessage: `Mã vận đơn: ` })}{' '}
                                        <span>{dataOrderPackage[0]?.trackingNumber || '--'}</span>
                                        <OverlayTrigger overlay={<Tooltip><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                                            <span style={{ cursor: 'pointer' }} onClick={(e) => {
                                                e.stopPropagation()
                                                onCopyToClipBoard(dataOrderPackage[0]?.trackingNumber || '')
                                            }}>
                                                <span className='ml-2 mr-4'><i style={{ fontSize: 12 }} class="far fa-copy text-info"></i></span>
                                            </span>
                                        </OverlayTrigger>
                                    </div>
                                </div>
                            )}

                            <div className="d-flex w-100" style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 1 }}>
                                <div style={{ flex: 1, marginTop: 20 }} >
                                    <ul className="nav nav-tabs" id="myTab" role="tablist" >
                                        {TAB_STATUS?.map((_status, index) => {
                                            return (
                                                <li className={`nav-item ${currentStatus === _status?.key ? 'active' : ''}`} key={`order-product-connect-${index}`}>
                                                    <a className={`nav-link font-weight-normal ${currentStatus === _status?.key ? 'active' : ''}`}
                                                        style={{ fontSize: '1.15rem' }}
                                                        onClick={e => {
                                                            e.preventDefault();
                                                            history.push(`${location.pathname}?${queryString.stringify({ ...paramsQuery, type: _status?.key })}`.replaceAll("%2C", ","));
                                                            setCurrentStatus(_status?.key)
                                                        }}
                                                    >
                                                        {_status?.title}
                                                    </a>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            </div>
                            {currentStatus === 'connect' && dataOrderPackage?.length > 1 && (
                                <div className='py-3 px-4 d-flex align-items-center' style={{ background: '#cef4fc', borderTopRightRadius: 6, border: '1px solid #D9D9D9', borderBottom: 'unset' }}>
                                    <i className="mr-2 fs-14 fas fa-info-circle" style={{ color: '#578e9b' }}></i>
                                    <span style={{ color: '#578e9b' }}>{formatMessage({ defaultMessage: 'Thông tin liên kết của hàng hóa kho với đơn hàng trên sàn. Thao tác liên kết/ ngắt liên kết chỉ ảnh hưởng liên kết với đơn hàng.' })}</span>
                                </div>
                            )}


                            {!!loadingDetail && <div className='col-12 d-flex justify-content-center'>
                                <span className="spinner spinner-primary mt-8"></span>
                            </div>}
                            {!loadingDetail && dataOrderPackage?.map((_order, _index) => {
                                let totalPrice = _.sum(_order?.data?.map(item => item?.original_price * item?.quantity_purchased)) || 0;
                                return (
                                    <>
                                        <div>
                                            <OrderDetailTable
                                                isMultiPackage={dataOrderPackage?.length > 1}
                                                currentStatus={currentStatus}
                                                setCurrentStatus={setCurrentStatus}
                                                smeWarehouses={dataSmeWarehouse?.sme_warehouses}
                                                index={_index + 1}
                                                dataScWareHouse={dataScWareHouse}
                                                totalPrice={totalPrice}
                                                loading={loadingDetail || !orderDetail?.findOrderDetail}
                                                store={_store}
                                                order={_order}
                                                orderDetail={orderDetail?.findOrderDetail}
                                                isOrderManual={isOrderManual}
                                                refetch={refetch}
                                                smeVariants={smeVariants}
                                                loadingSmeVariant={loadingSmeVariant}
                                                onSetVariant={(sku, orderItemId, comboItemId, lstExist) => {
                                                    setShowConnectModal(true)
                                                    setScCurrentVariantSku(sku)
                                                    setCurrentOrderItemId(orderItemId)

                                                    if (comboItemId) {
                                                        setCurrentLstExist(lstExist);
                                                        setCurrentComboItemId(comboItemId)
                                                    }
                                                }}
                                                onSetCombo={combo => setDataCombo(combo)}
                                                onUnLink={id => {
                                                    setCurrentOrderItemId(id)
                                                    setShowDeleteModal(true);
                                                }}
                                            />
                                        </div>
                                    </>
                                )
                            }
                            )}

                            {currentStatus == 'product' && <div className='mt-8 row d-flex justify-content-end'>
                                <div className='col-4'>
                                    <InfoCost
                                        dataOrderPackage={!isOrderManual ? dataOrderPackage.map(item => {
                                            return {
                                                ...item,
                                                data: item?.data?.filter(product => !(product?.is_gift && product?.ref_product_id == null))
                                            }
                                        }) : dataOrderPackage}
                                        orderDetail={orderDetail?.findOrderDetail}
                                    />
                                </div>
                            </div>}
                        </CardBody>
                    </Card>
                </div>
                <div className='col-order-right'>
                    <Card className="p-4 mb-4" style={{ minHeight: 150 }}>
                        <div className="pb-4" style={{ fontSize: 14, color: '#000' }}>
                            <strong>{formatMessage({ defaultMessage: 'Ghi chú' })}</strong>
                        </div>
                        <ul className="nav nav-tabs mb-4" id="myTab" role="tablist" >
                            {[{ status: 'buyer', title: formatMessage({ defaultMessage: 'Người mua' }) }, { status: 'sell', title: formatMessage({ defaultMessage: 'Người bán' }) },]?.map((item, index) => (
                                <li key={`order-note-${index}`} className={clsx(`nav-item`, { active: currentTabNote === item?.status })}>
                                    <a className={clsx(`nav-link font-weight-normal`, { active: currentTabNote === item?.status })}
                                        style={{ fontSize: '1.1rem', padding: 6 }}
                                        onClick={e => {
                                            e.preventDefault();
                                            setCurrentTabNote(item?.status)
                                        }}
                                    >
                                        {item?.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                        {currentTabNote == 'buyer'
                            ? <span>{orderDetail?.findOrderDetail?.note}</span>
                            : <AuthorizationWrapper keys={['order_list_order_update_note']}>
                                <EditableNoteVertical
                                    id={orderDetail?.findOrderDetail?.id}                                    
                                    text={orderDetail?.findOrderDetail?.sme_note}
                                    onConfirm={async (body, callback) => {
                                        const { data } = await addSmeNoteMutation({ variables: body })

                                        callback();
                                        if (!!data?.coUpdateOrderNote?.success) {
                                            addToast(formatMessage({ defaultMessage: 'Cập nhật ghi chú người bán thành công' }), { appearance: 'success' });
                                        } else {
                                            addToast(formatMessage({ defaultMessage: 'Cập nhật ghi chú người bán thất bại' }), { appearance: 'error' });
                                        }
                                    }}
                                />
                            </AuthorizationWrapper>
                        }
                    </Card>
                    <InfoHistory
                        orderId={Number(params?.id)}
                        statusOrderDetail={STATUS_ORDER_DETAIL}
                        orderDetail={orderDetail}
                    />
                </div>
            </div >
        </Fragment >
    )
});

export default OrderDetail;

export const actionKeys = {
    "order_detail_view": {
        router: "/orders/:id",
        actions: [
            "findOrderDetail", "sc_stores", "op_connector_channels", "sme_catalog_product_variant", "sme_catalog_product_variant_aggregate", "scGetWarehouses",
            "sme_warehouses", "detailFinanceOrder", "warehouse_bills", "warehouse_bills_aggregate", "scGetProduct", "sme_catalog_product_variant_by_pk", "sc_product_variant"
        ],
        name: 'Xem chi tiết đơn hàng',
        group_code: 'order_detail',
        group_name: 'Chi tiết đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_detail_add_gift": {
        router: '',
        actions: [
            "sme_catalog_inventory_items", "sme_catalog_inventory_items_aggregate", "coAddItemGiftOrder", "findOrderDetail"
        ],
        name: 'Thêm quà tặng',
        group_code: 'order_detail',
        group_name: 'Chi tiết đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_detail_product_connect_to_order": {
        router: '',
        actions: [
            "sme_catalog_product_variant", "coLinkSmeProductOrder", "findOrderDetail", "coLinkComboItem"
        ],
        name: 'Liên kết đơn hàng với sản phẩm kho',
        group_code: 'order_detail',
        group_name: 'Chi tiết đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_detail_provider_outbound_cancel": {
        router: '/orders/:id',
        actions: [
            "orderCancelProviderOutbound", "findOrderDetail"
        ],
        name: 'Hủy OR',
        group_code: 'order_detail',
        group_name: 'Chi tiết đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    },
    "order_detail_provider_outbound_recreate": {
        router: '/orders/:id',
        actions: [
            "recreateProviderOutbound", "findOrderDetail"
        ],
        name: 'Đẩy lại đơn (đối với gian dùng fulfillment Provider)',
        group_code: 'order_detail',
        group_name: 'Chi tiết đơn',
        cate_code: 'order_service',
        cate_name: 'Quản lý đơn hàng',
    }
};