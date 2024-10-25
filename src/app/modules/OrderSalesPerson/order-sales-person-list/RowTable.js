import React, { Fragment, memo, useCallback, useMemo, useState } from 'react'
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
import _ from 'lodash';
import { formatNumberToCurrency } from '../../../../utils';
import { useHistory, useLocation } from 'react-router-dom';
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import dayjs from 'dayjs';
import { Checkbox } from '../../../../_metronic/_partials/controls';
import queryString from 'querystring';
import SVG from "react-inlinesvg";
import duration from 'dayjs/plugin/duration';
import { useIntl } from 'react-intl'
import RowProduct from './RowProduct';
import { TooltipWrapper } from '../../Finance/payment-reconciliation/common/TooltipWrapper'
import { MANUAL_ORDER_SVG } from './Constant';
import { PackStatusName } from '../../Order/OrderStatusName';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';
import { useToasts } from 'react-toast-notifications';
dayjs.extend(duration);


export default memo(({ onSetSmeNote, onOpenConfirmDialog, dataSmeVariant, isSelected, setDataSelectedOrder, order }) => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const [isCopied, setIsCopied] = useState(false);
    const [isExpand, setIsExpand] = useState(false);
    const location = useLocation()
    const history = useHistory();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    let canExpand = order?.orderItems?.length > 3;
    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1500)
    };



    const { status, pack_status } = useMemo(() => {
        let { status, pack_status } = PackStatusName(order?.pack_status, order?.status)

        return { status: status, pack_status: pack_status };
    }, [order])
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
            }}>{formatMessage(status)}</span>
        )
    }, [params?.type, pack_status, order]
    );

    const renderAction = useMemo(() => {
        return (
            <Dropdown drop='down' >
                <Dropdown.Toggle className='btn-outline-secondary' >
                    {formatMessage({ defaultMessage: 'Chọn' })}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <AuthorizationWrapper keys={['order_sales_person_order_detail_view']}>
                        <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                            e.preventDefault();
                            window.open(`/orders/${order?.id}`, '_blank')
                        }} >
                            {formatMessage({ defaultMessage: 'Chi tiết' })}
                        </Dropdown.Item>                        
                    </AuthorizationWrapper>

                    {order?.status == 'PENDING' && !params?.is_old_order &&
                        <>
                            <AuthorizationWrapper keys={['order_sales_person_create_manual']}>
                                <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                                    e.preventDefault();
                                    if (!!order?.provider_or_id) {
                                        addToast(formatMessage({ defaultMessage: 'Không thể sửa do kiện hàng đã đẩy sang hệ thống Vietful' }), { appearance: 'error' });
                                        return;
                                    }

                                    window.open(`/order-sales-person/manual/${order?.id}?urlRedirect=${'/order-sales-person/list-order'}`, '_blank')
                                }} >
                                    {formatMessage({ defaultMessage: 'Sửa đơn hàng' })}
                                </Dropdown.Item>
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['order_sales_person_order_cancel']}>
                                <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                                    e.preventDefault();
                                    onOpenConfirmDialog(order?.packId)
                                }} >
                                    {formatMessage({ defaultMessage: 'Huỷ đơn ' })}
                                </Dropdown.Item>
                            </AuthorizationWrapper>

                        </>
                    }
                    {!params?.is_old_order && (
                        <AuthorizationWrapper keys={['order_sales_person_create_manual']}>
                            <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                                history.push({
                                    pathname: `/order-sales-person/manual/${order?.id}`,
                                    state: { isSale: true },
                                    search: `?urlRedirect=${'/order-sales-person/list-order'}`,
                                })
                            }} >{formatMessage({ defaultMessage: 'Tạo đơn sau bán hàng' })}
                            </Dropdown.Item>
                        </AuthorizationWrapper>
                    )}

                </Dropdown.Menu>
            </Dropdown>
        )
    }, [location.pathname, order])
    const renderFieldHandle = useMemo(() => {
        let ttsExpired = order?.ttsExpired;
        let shippedAt = order?.shippedAt;
        return (
            <div>
                {['creating', 'ready_to_ship', 'pending', 'packing', 'packed', 'cancelled'].includes(pack_status) &&
                    <>
                        {ttsExpired ? ttsExpired - dayjs().unix() > 0 ?
                            !!order?.expiring_soon ?
                                <div style={{ color: 'F80D0D' }}>
                                    <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{formatMessage({ defaultMessage: 'Rủi ro giao hàng trễ' })}</span>
                                    <TooltipWrapper note={<div><span>{formatMessage({ defaultMessage: 'Còn lại' })}:</span>{Math.floor((ttsExpired - dayjs().unix()) / 3600)}
                                        {formatMessage({ defaultMessage: 'giờ' })} {Math.floor(((ttsExpired - dayjs().unix()) % 3600) / 60)} {formatMessage({ defaultMessage: 'phút' })}</div>}>
                                        <img style={{ cursor: 'pointer', marginLeft: '4px' }} src={toAbsoluteUrl("/media/warningsvg.svg")} alt=""></img>
                                    </TooltipWrapper>
                                </div> : <div>{formatMessage({ defaultMessage: 'Còn lại' })}:
                                    <span className='text-primary'>
                                        {Math.floor((ttsExpired - dayjs().unix()) / 3600)} {formatMessage({ defaultMessage: 'giờ' })} {Math.floor(((ttsExpired - dayjs().unix()) % 3600) / 60)} {formatMessage({ defaultMessage: 'phút' })}
                                    </span></div> :
                            <div>
                                {formatMessage({ defaultMessage: 'Còn lại' })}: <span className='text-primary'>{formatMessage({ defaultMessage: 'Quá hạn' })}</span>
                            </div> : '--'}
                        {/* <p className='my-0'>{formatMessage({ defaultMessage: 'Còn lại' })} : <span className='text-primary'>
                                {ttsExpired ? ttsExpired - dayjs().unix() > 0 ? Math.floor((ttsExpired - dayjs().unix()) / 3600) + ` ${formatMessage({ defaultMessage: 'giờ' })} ` + Math.floor(((ttsExpired - dayjs().unix()) % 3600) / 60) + ` ${formatMessage({ defaultMessage: 'phút' })}` : `${formatMessage({ defaultMessage: 'Quá hạn' })}` : '--'}
                            </span> </p> */}
                    </>
                }

                <p className='d-flex align-items-center my-0'>
                    <span className='text-secondary-custom'> {formatMessage({ defaultMessage: 'Giao trước' })}</span>
                    <OverlayTrigger
                        overlay={<Tooltip>
                            {formatMessage({ defaultMessage: 'Thời gian muộn nhất để giao kiện hàng cho đơn vị vận chuyển' })}
                        </Tooltip>}>
                        <i className="fs-14 mx-1 fas fa-info-circle"></i>
                    </OverlayTrigger>: </p>
                <span> {ttsExpired ? dayjs(ttsExpired * 1000).format('DD/MM/YYYY HH:mm') : '--'} </span>

                {['shipped', 'shiping', 'completed'].includes(pack_status) &&
                    <>
                        <p className='d-flex align-items-center my-0'> <span className='text-secondary-custom'>{formatMessage({ defaultMessage: 'Ngày giao' })}</span>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Thời gian nhà bán hàng giao kiện hàng cho đơn vị vận chuyển' })}
                                    </Tooltip>
                                }
                            >
                                <i className="fs-14 mx-1 fas fa-info-circle"></i>
                            </OverlayTrigger>: </p>
                        <span> {shippedAt ? dayjs(shippedAt * 1000).format('DD/MM/YYYY HH:mm') : '--'} </span>
                    </>
                }
                <div className='d-flex mt-2'>
                    {(1 & order?.print_status) == 1 &&
                        <OverlayTrigger overlay={<Tooltip>{formatMessage({ defaultMessage: 'Đã in vận đơn' })}</Tooltip>}>
                            <SVG className="mr-2" src={toAbsoluteUrl("/media/svg/print1.svg")} />
                        </OverlayTrigger>}
                    {(2 & order?.print_status) == 2 && <OverlayTrigger
                        overlay={<Tooltip>{formatMessage({ defaultMessage: 'Đã in phiếu xuất kho' })}</Tooltip>}
                    >
                        <SVG className="mr-2" src={toAbsoluteUrl("/media/svg/print2.svg")} />
                    </OverlayTrigger>
                    }
                    {(4 & order?.print_status) == 4 && <OverlayTrigger
                        overlay={<Tooltip>{formatMessage({ defaultMessage: 'Đã in phiếu bàn giao' })}</Tooltip>}
                    >
                        <SVG className="mr-2" src={toAbsoluteUrl("/media/svg/print3.svg")} />
                    </OverlayTrigger>
                    }
                    {(8 & order?.print_status) == 8 && <OverlayTrigger overlay={<Tooltip>{formatMessage({ defaultMessage: 'Đã in hóa đơn' })}</Tooltip>}
                    >
                        <SVG className="mr-2" src={toAbsoluteUrl("/media/svg/print4.svg")} />
                    </OverlayTrigger>
                    }
                </div>
            </div>
        )
    }, [params?.type, order])

    return (
        <Fragment>
            <tr>
                <td colSpan='7' className='p-0'>
                    <div className='d-flex align-items-center justify-content-between' style={{ background: '#D9D9D9', padding: '8px' }}>
                        <div className='d-flex align-items-center'>
                            {(['pending']?.includes(params?.type) && !params?.is_old_order) && <Checkbox
                                inputProps={{
                                    'aria-label': 'checkbox',
                                }}
                                size='checkbox-md'
                                isSelected={isSelected}
                                onChange={(e) => {
                                    if (isSelected) {
                                        setDataSelectedOrder(prev => prev.filter(_id => _id.id != order.id))
                                    } else {
                                        setDataSelectedOrder(prev => prev.concat([order]))
                                    }
                                }}
                            />}
                            <span className='mx-4 d-flex align-items-center'>
                                {!!order?.imgChannel && <img src={order?.imgChannel} className='mr-1' style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />}
                                <span>{order?.storeName}</span>
                            </span>
                            <span style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    // if (order?.status == 'PENDING' && order?.source == 'manual') return;
                                    window.open(`/orders/${order?.id}`, "_blank")
                                }}
                            >
                                {`${formatMessage({ defaultMessage: 'Mã đơn hàng' })}: ${order?.refId}`}
                            </span>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>
                                }
                            >
                                <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(order?.refId)} className='ml-2'><i style={{ fontSize: 12 }} className="far fa-copy text-info"></i></span>

                            </OverlayTrigger>
                            {!!order?.pack_no && <span className='ml-2 text-primary'>({`Kiện ${order?.pack_no}`})</span>}
                            <div className='ml-4'>
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip title='Đơn thủ công' style={{ color: 'red' }}>
                                            <span>{formatMessage({ defaultMessage: 'Đơn thủ công' })}</span>
                                        </Tooltip>
                                    }
                                >
                                    {MANUAL_ORDER_SVG}
                                </OverlayTrigger>
                            </div>
                        </div>

                        <div className='d-flex align-items-center'>
                            {!!order?.smeNote && (
                                <div style={{ cursor: 'pointer' }} onClick={() => onSetSmeNote(true, !['READY_TO_SHIP', 'PENDING'].includes(order?.status))} className='mx-2'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff5629" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-more"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 10h.01" /><path d="M12 10h.01" /><path d="M16 10h.01" /></svg>
                                </div>
                            )}

                            <span className='mr-4 fs-14'>
                                {formatMessage({ defaultMessage: 'Đặt lúc' })}:   {dayjs(order?.orderAt * 1000).format('DD/MM/YYYY HH:mm ')}
                            </span>
                            {renderStatusColor}
                        </div>
                    </div>
                </td>
            </tr>
            <tr>
                <td style={{ verticalAlign: 'top' }} className="p-0">
                    {order?.orderItems?.slice(0, (canExpand && !isExpand) ? 3 : order?.orderItems?.length)?.map((item, index) => {
                        let length = (canExpand && !isExpand) ? 3 : order?.orderItems?.length
                        let isBorder = index + 1 !== length;
                        const smeVariant = dataSmeVariant?.smeVariants?.find(variant => variant?.id == item?.smeVariantId);
                        return (
                            <Fragment>
                                <RowProduct
                                    key={`order-product-${index}`}
                                    smeVariant={smeVariant}
                                    isGift={item?.is_gift}
                                    loadingSmeVariant={dataSmeVariant?.loadingSmeVariant}
                                    errOrder={item.errOrder ? item.errOrder : null}
                                    quantity_purchased={item.quantityPurchased}
                                    isBorder={isBorder}
                                />
                            </Fragment>
                        )
                    })}
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    <div className='d-flex flex-column'>
                        <div className="pb-2">{formatNumberToCurrency(order?.paidPrice)} đ</div>
                        <div>{order?.paymentMethod || ''}</div>
                    </div>
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    <div className='d-flex flex-column'>
                        <span className='mb-2'>{order?.warehouseOfOrder?.smeWhName || '--'}</span>
                        {!!order?.warehouseOfOrder?.enableMultiWarehouse ? (
                            <>
                                <span className='text-secondary-custom'>
                                    {formatMessage({ defaultMessage: 'Kho kênh bán:' })}
                                </span>
                                <span>{order?.warehouseOfOrder?.scWhName || '--'}</span>
                            </>
                        ) : null}
                    </div>
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    {renderFieldHandle}
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    <div className='d-flex flex-column'>
                        <div className="d-flex flex-column mb-2">
                            <p className='my-0'>{order?.shipping_carrier}</p>
                            <p className='text-secondary-custom my-0'>{formatMessage({ defaultMessage: 'Mã kiện hàng' })}:</p>
                            <p className='my-0'>{order?.system_package_number ? order?.system_package_number : '--'}</p>
                            <p className='text-secondary-custom my-0'>{formatMessage({ defaultMessage: 'Mã vận đơn' })}:</p>
                            <p className='my-0'>{order?.tracking_number ? order?.tracking_number : '--'}</p>
                            <p className='my-0'>{order?.pDeliveryMethod == 1 ? `[${formatMessage({ defaultMessage: 'ĐVVC đến lấy' })}]` : ''}</p>
                            <p className='my-0'>{order?.pDeliveryMethod == 2 ? `[${formatMessage({ defaultMessage: 'Mang ra bưu cục' })}]` : ''}</p>
                        </div>

                        {order?.logisticsPackages?.length == 0 &&
                            <p className='text-secondary-custom my-0'>{formatMessage({ defaultMessage: 'Mã vận đơn' })}: --</p>
                        }
                    </div>
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    <div className='d-flex flex-column'>
                        <p>{order?.customerRecipientAddress?.full_name || ''}</p>
                        <p>{order?.customerRecipientAddress?.state || ''}</p>
                    </div>
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1 text-center'>
                    {renderAction}
                </td>
            </tr>
            {canExpand && (
                <tr>
                    <td colSpan='1' className='pt-0 pl-6' >
                        <a className='d-flex align-items-center'
                            onClick={e => {
                                e.preventDefault();
                                setIsExpand(prev => !prev);
                            }}
                        >
                            <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                            <span className='font-weight-normal mx-4' style={{ color: 'rgba(0,0,0,0.85)' }}>
                                {!isExpand ? `${formatMessage({ defaultMessage: 'Xem thêm' })}` : `${formatMessage({ defaultMessage: 'Thu gọn' })}`}
                            </span>
                            <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                        </a>
                    </td>
                </tr>
            )}
            {!!order?.connector_channel_error && (!params?.type || params?.type == 'connector_channel_error') && <tr style={{ background: 'rgba(254, 86, 41, 0.31)' }}>
                <td colSpan={7}>
                    <div className='d-flex'>
                        <SVG src={toAbsoluteUrl("/media/svg/ic-warning.svg")} />
                        <span style={{ color: '#F80D0D', wordBreak: 'break-word' }}
                            className='ml-4'>{formatMessage({ defaultMessage: 'Lỗi' })}: {order?.connector_channel_error}</span>
                    </div>

                </td>
            </tr>}
            {!!order?.warehouse_error_message && (!params?.type || params?.type == 'warehouse_error') && <tr style={{ background: 'rgba(254, 86, 41, 0.31)' }}>
                <td colSpan={7}>
                    <div className='d-flex'>
                        <SVG src={toAbsoluteUrl("/media/svg/ic-warning.svg")} />
                        <span style={{ color: '#F80D0D', wordBreak: 'break-word' }}
                            className='ml-4'>{formatMessage({ defaultMessage: 'Lỗi' })}: {order?.warehouse_error_message}</span>
                    </div>

                </td>
            </tr>}
            {!!order?.logistic_provider_error && (!params?.type || params?.type == 'logistic_provider_error') && <tr style={{ background: 'rgba(254, 86, 41, 0.31)' }}>
                <td colSpan={7}>
                    <div className='d-flex'>
                        <SVG src={toAbsoluteUrl("/media/svg/ic-warning.svg")} />
                        <span style={{ color: '#F80D0D', wordBreak: 'break-word' }}
                            className='ml-4'>{formatMessage({ defaultMessage: 'Lỗi' })}: {order?.logistic_provider_error}</span>
                    </div>

                </td>
            </tr>}
        </Fragment>
    )
});