import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import React, { Fragment, memo, useMemo, useState } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import SVG from "react-inlinesvg";
import { useIntl } from 'react-intl';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { Checkbox } from '../../../../../_metronic/_partials/controls';
import { TooltipWrapper } from '../../../Finance/payment-reconciliation/common/TooltipWrapper';
import { PackStatusName } from '../../../Order/OrderStatusName';
import { STATUS_PACK_TAB } from '../../../Order/OrderUIHelpers';
import OrderProductRow from '../../../Order/order-list/OrderProductRow';
import OrderSmeProductRow from '../../../Order/order-list/OrderSmeProductRow';
dayjs.extend(duration);

export default memo(({
        onSetSmeNote, order: orderPack, key,
        optionsChannel, optionsStore,
        setIds, isSelected, dataSmeWarehouse,
        dataScWareHouse, loadingSmeVariant, smeVariants 
    }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isExpand, setIsExpand] = useState(false);
    const { formatMessage } = useIntl()

    let _store = optionsStore.find(_st => _st.id == orderPack.store_id);
    let _channel = optionsChannel.find(_st => _st.code == orderPack.connector_channel_code);
    let canExpand = orderPack?.orderItems?.length > 3;

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1500)
    };

    const warehouseOrder = useMemo(() => {
        const { sc_warehouse_id, sme_warehouse_id } = orderPack

        const scWarehouse = dataScWareHouse?.scGetWarehouses?.filter(wh => wh?.warehouse_type == 1)?.find(wh => wh?.id == sc_warehouse_id);
        const smeWarehouse = dataSmeWarehouse?.find(wh => wh?.id == sme_warehouse_id);

        return (
            <div className='d-flex flex-column'>
                <span className='mb-2'>{smeWarehouse?.name || '--'}</span>
                {_store?.enable_multi_warehouse ? (
                    <>
                        <span className='text-secondary-custom'>
                            {formatMessage({ defaultMessage: 'Kho kênh bán:' })}
                        </span>
                        <span>{scWarehouse?.warehouse_name || '--'}</span>
                    </>
                ) : null}
            </div>
        )
    }, [_store, dataScWareHouse, dataSmeWarehouse, orderPack]);

    const { status, pack_status } = useMemo(() => {
        let { status, pack_status } = PackStatusName(
            orderPack?.pack_status, 
            orderPack?.order?.status, 
        )

        return { status, pack_status };
    }, [orderPack])

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
        }, [orderPack, STATUS_PACK_TAB]
    );


    const renderFieldHandle = useMemo(() => {
            let tts_expired = orderPack?.order?.tts_expired;
            let shipped_at = orderPack?.order?.shipped_at;
            return (
                <div>
                    {['waiting_for_packing', 'pending', 'packing', 'packed', 'cancelled'].includes(pack_status) &&
                        <>
                         {tts_expired ? tts_expired - dayjs().unix() > 0 ? 
                                !!orderPack?.order?.expiring_soon ? 
                                <div style={{color: 'F80D0D'}}>
                                    <span style={{color: '#f5222d', fontWeight: 'bold'}}>{formatMessage({defaultMessage: 'Rủi ro giao hàng trễ'})}</span>
                                    <TooltipWrapper note={<div><span className='text-primary'>{formatMessage({defaultMessage: 'Còn lại'})}: </span>{Math.floor((tts_expired - dayjs().unix()) / 3600)} {formatMessage({defaultMessage: 'giờ'})} {Math.floor(((tts_expired - dayjs().unix()) % 3600) / 60)} {formatMessage({defaultMessage: 'phút'})}</div>}>
                                      <img style={{ cursor: 'pointer', marginLeft: '4px' }} src={toAbsoluteUrl("/media/warningsvg.svg")} alt=""></img>
                                    </TooltipWrapper>
                                </div> : <div>{formatMessage({defaultMessage: 'Còn lại'})}:  
                                    <span className='text-primary'>
                                        {Math.floor((tts_expired - dayjs().unix()) / 3600)} giờ {Math.floor(((tts_expired - dayjs().unix()) % 3600) / 60)} phút
                                    </span></div> : 
                                <div>
                                    {formatMessage({defaultMessage: 'Còn lại'})}: <span className='text-primary'>{formatMessage({defaultMessage: 'Quá hạn'})}</span>
                                </div> : '--'}
                            {/* <p className='my-0'>{formatMessage({ defaultMessage: 'Còn lại' })} : 
                            <span className='text-primary'>
                                {tts_expired ? tts_expired - dayjs().unix() > 0 ? Math.floor((tts_expired - dayjs().unix()) / 3600) + ` ${formatMessage({ defaultMessage: 'giờ' })}` + Math.floor(((tts_expired - dayjs().unix()) % 3600) / 60) + ` ${formatMessage({ defaultMessage: 'phút' })}` : ` ${formatMessage({ defaultMessage: 'Quá hạn' })}` : '--'}
                            </span></p> */}
                        </>
                    }

                    <p className='d-flex align-items-center my-0'>
                        <span className='text-secondary-custom'> {formatMessage({ defaultMessage: 'Giao trước' })}</span> 
                    <OverlayTrigger overlay={<Tooltip>{formatMessage({ defaultMessage: 'Thời gian muộn nhất để giao kiện hàng cho đơn vị vận chuyển' })}</Tooltip>}>
                        <i className="fs-14 mx-1 fas fa-info-circle"></i>
                    </OverlayTrigger>: </p>
                    <span> {tts_expired ? dayjs(tts_expired * 1000).format('DD/MM/YYYY HH:mm') : '--'} </span>

                    {['shipped', 'completed'].includes(pack_status) &&
                        <>
                            <p className='d-flex align-items-center my-0'>
                                <span className='text-secondary-custom'>{formatMessage({ defaultMessage: 'Ngày giao' })}</span>
                            <OverlayTrigger overlay={<Tooltip>{formatMessage({ defaultMessage: 'Thời gian nhà bán hàng giao kiện hàng cho đơn vị vận chuyển' })}</Tooltip>}>
                                <i className="fs-14 mx-1 fas fa-info-circle"></i>
                            </OverlayTrigger>: </p>
                            <span> {shipped_at ? dayjs(shipped_at * 1000).format('DD/MM/YYYY HH:mm') : '--'} </span>
                        </>
                    }
                    <div className='d-flex mt-2'>
                    {(1 & orderPack?.print_status) == 1 &&
                        <OverlayTrigger overlay={<Tooltip>{formatMessage({ defaultMessage: 'Đã in vận đơn' })}</Tooltip>}>
                            <SVG className="mr-2" src={toAbsoluteUrl("/media/svg/print1.svg")} />
                        </OverlayTrigger>}
                    {(2 & orderPack?.print_status) == 2 && <OverlayTrigger overlay={<Tooltip>{formatMessage({ defaultMessage: 'Đã in phiếu xuất kho' })}</Tooltip>}>
                            <SVG className="mr-2" src={toAbsoluteUrl("/media/svg/print2.svg")} />
                        </OverlayTrigger>
                    }
                    {(4 & orderPack?.print_status) == 4 && <OverlayTrigger overlay={<Tooltip>{formatMessage({ defaultMessage: 'Đã in phiếu bàn giao' })}</Tooltip>}>
                            <SVG className="mr-2" src={toAbsoluteUrl("/media/svg/print3.svg")} />
                        </OverlayTrigger>}
                    </div>
                </div>
            )
        }, [orderPack]);

    return (
        <Fragment key={key}>
            <tr>
                <td colSpan='7' className='p-0'>
                    <div className='d-flex align-items-center justify-content-between' style={{ background: '#D9D9D9', padding: '8px' }}>
                        <div className='d-flex'>
                            <Checkbox
                                inputProps={{'aria-label': 'checkbox'}}
                                size='checkbox-md'
                                isSelected={isSelected}
                                onChange={(e) => {
                                    if (isSelected) {
                                        setIds(prev => prev.filter(_id => _id.id != orderPack.id))
                                    } else {                                        
                                        setIds(prev => prev.concat([orderPack]))
                                    }
                                }}
                            />
                            <span className='mx-4 d-flex align-items-center'>
                                <img src={_channel?.logo_asset_url} style={{ width: 20, height: 20, objectFit: 'contain' }}/>
                                <span className='ml-2'>{_store?.name}</span>
                            </span>
                            <span style={{ cursor: 'pointer', maxWidth: 500 }}  onClick={() => window.open(`/orders/${orderPack?.order?.id}`, "_blank")}>
                                {`${formatMessage({ defaultMessage: 'Mã đơn hàng' })}: ${orderPack?.order?.ref_id}`}
                            </span>
                            {!!orderPack?.pack_no && <span className='ml-2 text-primary'>({`Kiện ${orderPack?.pack_no}`})</span>}
                            <OverlayTrigger
                                overlay={
                                <Tooltip title='#1234443241434' 
                                    style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span>
                                </Tooltip>}
                            >
                                <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(orderPack?.order?.ref_id)} className='ml-2'><i style={{ fontSize: 12 }} className="far fa-copy text-info"></i></span>

                            </OverlayTrigger>
                            {orderPack?.order?.source == 'manual' && <div className='ml-4'>
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip title='Đơn thủ công' style={{ color: 'red' }}>
                                            <span>{formatMessage({ defaultMessage: 'Đơn thủ công' })}</span>
                                        </Tooltip>
                                    }
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-primary bi bi-hand-index" viewBox="0 0 16 16">
                                        <path d="M6.75 1a.75.75 0 0 1 .75.75V8a.5.5 0 0 0 1 0V5.467l.086-.004c.317-.012.637-.008.816.027.134.027.294.096.448.182.077.042.15.147.15.314V8a.5.5 0 1 0 1 0V6.435l.106-.01c.316-.024.584-.01.708.04.118.046.3.207.486.43.081.096.15.19.2.259V8.5a.5.5 0 0 0 1 0v-1h.342a1 1 0 0 1 .995 1.1l-.271 2.715a2.5 2.5 0 0 1-.317.991l-1.395 2.442a.5.5 0 0 1-.434.252H6.035a.5.5 0 0 1-.416-.223l-1.433-2.15a1.5 1.5 0 0 1-.243-.666l-.345-3.105a.5.5 0 0 1 .399-.546L5 8.11V9a.5.5 0 0 0 1 0V1.75A.75.75 0 0 1 6.75 1M8.5 4.466V1.75a1.75 1.75 0 1 0-3.5 0v5.34l-1.2.24a1.5 1.5 0 0 0-1.196 1.636l.345 3.106a2.5 2.5 0 0 0 .405 1.11l1.433 2.15A1.5 1.5 0 0 0 6.035 16h6.385a1.5 1.5 0 0 0 1.302-.756l1.395-2.441a3.5 3.5 0 0 0 .444-1.389l.271-2.715a2 2 0 0 0-1.99-2.199h-.581a5 5 0 0 0-.195-.248c-.191-.229-.51-.568-.88-.716-.364-.146-.846-.132-1.158-.108l-.132.012a1.26 1.26 0 0 0-.56-.642 2.6 2.6 0 0 0-.738-.288c-.31-.062-.739-.058-1.05-.046zm2.094 2.025" />
                                    </svg>
                                </OverlayTrigger>
                            </div>}
                        </div>
                        <div className='d-flex align-items-center'>
                            {!!orderPack?.order?.sme_note && (
                                <div style={{ cursor: 'pointer' }} onClick={() => onSetSmeNote(true, !['READY_TO_SHIP', 'PENDING'].includes(orderPack?.order?.status))} className='mx-2'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff5629" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-more"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 10h.01" /><path d="M12 10h.01" /><path d="M16 10h.01" /></svg>
                                </div>
                            )}
                            <span className='mr-4 fs-14'>
                                {formatMessage({ defaultMessage: 'Đặt lúc' })}: {dayjs(orderPack?.order?.order_at * 1000).format('DD/MM/YYYY HH:mm ')}
                            </span>
                            {renderStatusColor}
                        </div>
                    </div>
                </td>
            </tr>
            <tr>
                <td style={{ verticalAlign: 'top' }} className="p-0">
                    {orderPack?.orderItems?.slice(0, (canExpand && !isExpand) ? 3 : orderPack?.orderItems?.length)
                            ?.map((item, index) => {
                                let length = (canExpand && !isExpand) ? 3 : orderPack?.orderItems?.length
                                let isBorder = index + 1 !== length
                                const smeVariant = smeVariants?.find(variant => variant?.id == item?.sme_variant_id);

                                return (
                                    <Fragment>
                                    {orderPack?.order?.source == 'platform' && 
                                        <OrderProductRow
                                            errOrder={item.warehouse_error_message ? item.warehouse_error_message : null}
                                            key={`order-product-${index}`}
                                            refProductId={item.ref_product_id}
                                            ref_variant_id={item.ref_variant_id}
                                            connector_channel_code={item.connector_channel_code}
                                            product_name={item.product_name}
                                            variant_name={item.variant_name}
                                            variant_image={item.variant_image}
                                            variant_sku={item.variant_sku}
                                            quantity_purchased={item.quantity_purchased}
                                            ref_store_id={orderPack?.order.ref_store_id}
                                            isBorder={isBorder}
                                            smeVariant={smeVariant}
                                            sme_variant_id={item.sme_variant_id}
                                            sc_variant_id={item.sc_variant_id}
                                            isGift={item?.is_gift}
                                        />}
                                    {(orderPack?.order?.source == 'manual' || orderPack?.order?.source == 'pos') && 
                                        <OrderSmeProductRow
                                            key={`order-product-${index}`}
                                            smeVariant={smeVariant}
                                            refProductId={item.ref_product_id}
                                            ref_variant_id={item.ref_variant_id}
                                            isGift={item?.is_gift}
                                            loadingSmeVariant={loadingSmeVariant}
                                            connector_channel_code={item.connector_channel_code}
                                            product_name={item.product_name}
                                            variant_name={item.variant_name}
                                            errOrder={item.warehouse_error_message ? item.warehouse_error_message : null}
                                            variant_image={item.variant_image}
                                            variant_sku={item.variant_sku}
                                            quantity_purchased={item.quantity_purchased}
                                            ref_store_id={orderPack?.order.ref_store_id}
                                            isBorder={isBorder}
                                        />}
                                    </Fragment>
                                )
                            })
                    }
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    {warehouseOrder}
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    {renderFieldHandle}
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    <div className='d-flex flex-column'>
                     <div className="d-flex flex-column mb-2">
                                <p className='my-0'>{orderPack?.shipping_carrier}</p>
                                <p className='text-secondary-custom my-0'>{formatMessage({ defaultMessage: 'Mã kiện hàng' })}:</p>
                                <p className='my-0'>{orderPack?.system_package_number ? orderPack?.system_package_number : '--'}</p>
                                <p className='text-secondary-custom my-0'>{formatMessage({ defaultMessage: 'Mã vận đơn' })}:</p>
                                <p className='my-0'>{orderPack?.tracking_number ? orderPack?.tracking_number : '--'}</p>
                                <p className='my-0'>{orderPack?.order?.p_delivery_method == 1 ? `[${formatMessage({ defaultMessage: 'ĐVVC đến lấy' })}]` : ''}</p>
                                <p className='my-0'>{orderPack?.order?.p_delivery_method == 2 ? `[${formatMessage({ defaultMessage: 'Mang ra bưu cục' })}]` : ''}</p>
                            </div>
                    </div>
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

                {orderPack?.connector_channel_error
                    && <tr style={{ background: 'rgba(254, 86, 41, 0.31)' }}>
                        <td colSpan={7}>
                            <div className='d-flex'>
                                <SVG src={toAbsoluteUrl("/media/svg/ic-warning.svg")} /> 
                                <span style={{ color: '#F80D0D', wordBreak: 'break-word' }} className='ml-4'>{formatMessage({ defaultMessage: 'Lỗi' })}: {orderPack?.connector_channel_error}</span>
                            </div>
                        </td>
                    </tr>}
        </Fragment>
    )
});