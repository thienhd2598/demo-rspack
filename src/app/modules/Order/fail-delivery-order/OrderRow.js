import React, { Fragment, memo, useCallback, useMemo, useState } from 'react'
import _ from 'lodash';
import { formatNumberToCurrency } from '../../../../utils';
import { useHistory, useLocation } from 'react-router-dom';
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import dayjs from 'dayjs';
import OrderProductRow from './OrderProductRow';
import { Checkbox } from '../../../../_metronic/_partials/controls';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';

import duration from 'dayjs/plugin/duration';
import { useToasts } from 'react-toast-notifications';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useIntl } from "react-intl";
import OrderSmeProductRow from '../order-list/OrderSmeProductRow';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';
dayjs.extend(duration);

export default memo(({ params, order, key, op_connector_channels, sc_stores, setIds, isSelected, setDataOrder, coReloadOrder, setDataCancellationReason, setDataRepositoryNote, setDataOrderDetail, smeVariants, loadingSmeVariant }) => {
    const history = useHistory();
    const [isCopied, setIsCopied] = useState(false);
    const [isExpand, setIsExpand] = useState(false);
    const location = useLocation()
    const { addToast } = useToasts();
    const { formatMessage } = useIntl()


    let _store = sc_stores.find(_st => _st.id == order.store_id);
    let _channel = op_connector_channels.find(_st => _st.code == order.connector_channel_code);
    let canExpand = order?.orderItems?.length > 3;
    const [loading, setLoading] = useState(false)


    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(
            () => {
                setIsCopied(false);
            }, 1500
        )
    };

    const renderReturnProcessStatusColor = useMemo(
        () => {
            let color = '';
            let name = '';
            switch (order?.return_process_status) {
                case 'returning':
                    name = formatMessage({ defaultMessage: 'Đang trở về' })
                    color = '#135a36'
                    break;
                case 'returned_logistic':
                    name = formatMessage({ defaultMessage: 'ĐVVC đã giao-chưa xử lý' })
                    color = '#cc4420'
                    break;
                case 'processed':
                    name = formatMessage({ defaultMessage: 'Đã xử lý' })
                    color = '#0d66c0'
                    break;
                case 'returned_wh':
                    name = formatMessage({ defaultMessage: 'Kho đã nhận-chưa xử lý' })
                    color = '#171c72'
                    break;
                default:
                    name = formatMessage({ defaultMessage: 'Khác' })
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
                }}>{name}</span>
            )
        }, [order]
    )

    const statusNoteWarehouse = useMemo(
        () => {
            let color = '';
            let name = '';
            switch (order?.returnWarehouseImport?.import_type) {
                case 1:
                    name = formatMessage({ defaultMessage: 'Không nhập kho' })
                    color = '#f3252e'
                    break;
                case 2:
                    name = formatMessage({ defaultMessage: 'Nhập kho 1 phần' })
                    color = '#ffa500'
                    break;
                case 3:
                    name = formatMessage({ defaultMessage: 'Nhập kho toàn bộ ' })
                    color = '#00DB6D'
                    break;

            }
            return (
                <span className='fs-12' style={{
                    color: '#fff',
                    backgroundColor: color,
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    borderRadius: '4px'
                }}>{name}</span>
            )
        }, [order]
    )

    const renderFieldHandle = useMemo(
        () => {
            const now = dayjs().unix();
            return (
                <div>
                    <div>{formatMessage({ defaultMessage: 'Thời gian tạo' })}: <br /> {dayjs(order?.order_at * 1000).format('DD/MM/YYYY HH:mm ')}</div>
                    <div className='my-2'>{formatMessage({ defaultMessage: 'Thời gian trở về' })}: <br /> {order?.returned_time ? dayjs(order?.returned_time * 1000).format('DD/MM/YYYY HH:mm ') : '--'}</div>
                    {
                        order?.returnWarehouseImport && <div>{formatMessage({ defaultMessage: 'Thời gian xử lý trả hàng' })}: <br /> {dayjs(order?.returnWarehouseImport?.created_at).format('DD/MM/YYYY HH:mm ')} </div>
                    }
                </div>
            )
        }, [order]
    )


    const renderAction = useMemo(() => {
        return (
            <Dropdown drop='down' >
                <Dropdown.Toggle className='btn-outline-secondary' >
                    {formatMessage({ defaultMessage: 'Chọn' })}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <AuthorizationWrapper keys={['refund_order_detail_view']}>
                        <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                            e.preventDefault();

                            window.open(`/orders/${order?.id}`, '_blank')

                        }} >{formatMessage({ defaultMessage: 'Chi tiết' })}</Dropdown.Item>
                    </AuthorizationWrapper>

                    {!params?.is_old_order && <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                        coReloadOrder([order?.id])
                        return
                    }} >{formatMessage({ defaultMessage: 'Tải lại' })}</Dropdown.Item>}
                    <AuthorizationWrapper keys={['refund_order_import_warehouse']}>
                        {(order?.return_process_status == 'returned' || order?.return_process_status == 'returning') && !params?.is_old_order && <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                            setDataOrder(order)
                            return
                        }} >{formatMessage({ defaultMessage: 'Xử lý trả hàng' })}</Dropdown.Item>}
                    </AuthorizationWrapper>
                </Dropdown.Menu>
            </Dropdown>
        )
    }, [location.pathname, order, params?.is_old_order])


    return (
        <Fragment key={key}>
            <LoadingDialog show={loading} />
            <tr>
                <td colSpan='7' className='p-0'>
                    <div className='d-flex align-items-center justify-content-between' style={{ background: '#D9D9D9', padding: '8px' }}>
                        <div className='d-flex align-items-center'>
                            {!params?.is_old_order && <Checkbox
                                inputProps={{
                                    'aria-label': 'checkbox',
                                }}
                                size='checkbox-md'
                                isSelected={isSelected}
                                onChange={(e) => {
                                    if (isSelected) {
                                        setIds(prev => prev.filter(_id => _id.id != order.id))
                                    } else {
                                        setIds(prev => prev.concat([order]))
                                    }
                                }}
                            />}
                            <span className='mx-4'>
                                <img
                                    src={_channel?.logo_asset_url}
                                    style={{ width: 20, height: 20, objectFit: 'contain' }}
                                />
                                <span className='ml-1'>{_store?.name}</span>
                            </span>                            
                            <span
                                style={{ cursor: 'pointer' }}
                                onClick={() => window.open(`/orders/${order?.id}`, "_blank")}
                            >
                                {`${formatMessage({ defaultMessage: 'Mã đơn hàng' })}: ${order?.ref_id}`}

                            </span>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip title='#1234443241434'>
                                        <span>
                                            {isCopied ? `Copied!` : `Copy to clipboard`}
                                        </span>
                                    </Tooltip>
                                }
                            >
                                <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(order?.ref_id)} className='ml-2'><i style={{ fontSize: 12 }} className="far fa-copy text-info"></i></span>

                            </OverlayTrigger>
                            {order?.source == 'manual' && <div className='ml-4'>
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip title='Đơn thủ công'>
                                            <span>
                                                {formatMessage({ defaultMessage: 'Đơn thủ công' })}
                                            </span>
                                        </Tooltip>
                                    }
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-primary bi bi-hand-index" viewBox="0 0 16 16">
                                        <path d="M6.75 1a.75.75 0 0 1 .75.75V8a.5.5 0 0 0 1 0V5.467l.086-.004c.317-.012.637-.008.816.027.134.027.294.096.448.182.077.042.15.147.15.314V8a.5.5 0 1 0 1 0V6.435l.106-.01c.316-.024.584-.01.708.04.118.046.3.207.486.43.081.096.15.19.2.259V8.5a.5.5 0 0 0 1 0v-1h.342a1 1 0 0 1 .995 1.1l-.271 2.715a2.5 2.5 0 0 1-.317.991l-1.395 2.442a.5.5 0 0 1-.434.252H6.035a.5.5 0 0 1-.416-.223l-1.433-2.15a1.5 1.5 0 0 1-.243-.666l-.345-3.105a.5.5 0 0 1 .399-.546L5 8.11V9a.5.5 0 0 0 1 0V1.75A.75.75 0 0 1 6.75 1M8.5 4.466V1.75a1.75 1.75 0 1 0-3.5 0v5.34l-1.2.24a1.5 1.5 0 0 0-1.196 1.636l.345 3.106a2.5 2.5 0 0 0 .405 1.11l1.433 2.15A1.5 1.5 0 0 0 6.035 16h6.385a1.5 1.5 0 0 0 1.302-.756l1.395-2.441a3.5 3.5 0 0 0 .444-1.389l.271-2.715a2 2 0 0 0-1.99-2.199h-.581a5 5 0 0 0-.195-.248c-.191-.229-.51-.568-.88-.716-.364-.146-.846-.132-1.158-.108l-.132.012a1.26 1.26 0 0 0-.56-.642 2.6 2.6 0 0 0-.738-.288c-.31-.062-.739-.058-1.05-.046zm2.094 2.025" />
                                    </svg>
                                </OverlayTrigger>
                            </div>}
                            {order?.returnWarehouseImport &&
                                (
                                    <>
                                        <div className='ml-5'>
                                            {statusNoteWarehouse}
                                            <AuthorizationWrapper keys={['refund_order_detail_view']}>
                                            <span
                                                className="text-primary cursor-pointer ml-3"
                                                onClick={() => {
                                                    setDataOrderDetail(order);
                                                }}
                                            >
                                                {formatMessage({ defaultMessage: 'Chi tiết' })}
                                            </span>
                                            </AuthorizationWrapper>
                                            {/* {order?.returnWarehouseImport?.import_note ?
                                                (
                                                    <OverlayTrigger
                                                        overlay={
                                                            <Tooltip
                                                                title="#1234443241434"
                                                                style={{ color: "red" }}
                                                            >
                                                                <span>{formatMessage({defaultMessage: 'Ghi chú nhập kho'})}</span>
                                                            </Tooltip>
                                                        }
                                                    >
                                                        <img
                                                            className='ml-3'
                                                            onClick={() => {
                                                                setDataRepositoryNote(order?.returnWarehouseImport)
                                                            }}
                                                            src={toAbsoluteUrl("/media/journal_check.png")}
                                                            style={{
                                                                cursor: "pointer",
                                                                width: "16.88px",
                                                                height: "18px",
                                                            }}
                                                        />
                                                    </OverlayTrigger>
                                                ) : (
                                                    <OverlayTrigger
                                                        overlay={
                                                            <Tooltip
                                                                title="#1234443241434"
                                                                style={{ color: "red" }}
                                                            >
                                                                <span>{formatMessage({defaultMessage: 'Thêm ghi chú nhập kho'})}</span>
                                                            </Tooltip>
                                                        }
                                                    >
                                                        <img
                                                            className='ml-3'
                                                            onClick={() => {
                                                                setDataRepositoryNote(order?.returnWarehouseImport)

                                                            }}
                                                            src={toAbsoluteUrl("/media/journal-plus.png")}
                                                            style={{
                                                                cursor: "pointer",
                                                                width: "16.88px",
                                                                height: "18px",
                                                            }}
                                                        />
                                                    </OverlayTrigger>
                                                )
                                            } */}
                                        </div>
                                    </>
                                )
                            }

                        </div>

                        <div>
                            <span className='mr-5 fs-14 col-3'>
                                {formatMessage({ defaultMessage: 'Nguyên nhân hủy' })}: <a
                                    onClick={() => {
                                        setDataCancellationReason({
                                            cancel_by: order?.cancel_by,
                                            cancel_reason: order?.cancel_reason,
                                        })
                                    }}
                                    style={{
                                        fontSize: "14px",
                                        color: "#FE5629",
                                        fontWeight: 400,
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Chi tiết' })}
                                </a>
                            </span>
                            {renderReturnProcessStatusColor}
                        </div>
                    </div>
                </td>
            </tr>
            <tr>
                <td style={{ verticalAlign: 'top' }} className="p-0">
                    {
                        order?.orderItems?.slice(0, (canExpand && !isExpand) ? 3 : order?.orderItems?.length)
                            ?.map((item, index) => {
                                let length = (canExpand && !isExpand) ? 3 : order?.orderItems?.length
                                let isBorder = index + 1 !== length
                                const smeVariant = smeVariants?.find(variant => variant?.id == item?.sme_variant_id);                                

                                return (
                                    <Fragment>
                                        {order?.source == 'platform' && <OrderProductRow
                                            key={`order-product-${index}`}
                                            refProductId={item.ref_product_id}
                                            ref_variant_id={item.ref_variant_id}
                                            isGift={item?.is_gift}
                                            connector_channel_code={item.connector_channel_code}
                                            product_name={item.product_name}
                                            variant_name={item.variant_name}
                                            errOrder={item.warehouse_error_message ? item.warehouse_error_message : null}
                                            variant_image={item.variant_image}
                                            variant_sku={item.variant_sku}
                                            quantity_purchased={item.quantity_purchased}
                                            ref_store_id={order.ref_store_id}
                                            isBorder={isBorder}
                                        />}
                                        {order?.source == 'manual' && <OrderSmeProductRow
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
                                            ref_store_id={order.ref_store_id}
                                            isBorder={isBorder}
                                        />}
                                    </Fragment>
                                )
                            })
                    }
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    <div className='d-flex flex-column'>
                        <div className="pb-2">{formatNumberToCurrency(order?.paid_price)} đ</div>
                        <div>{order?.payment_method || ''}</div>
                    </div>
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    {order?.platform_status_text}
                    {/* <OrderMapStatusSeller platform_status={order?.platform_status} channel_code={order?.connector_channel_code} /> */}
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    {renderFieldHandle}
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    <div className='d-flex flex-column'>
                        {order?.logisticsPackages?.map(
                            _logistic => <div key={`logistic-${_logistic.id}`} className="d-flex flex-column mb-2">
                                <p className='my-0'>{_logistic?.shipping_carrier}</p>
                                <p className='text-secondary-custom my-0'>{formatMessage({ defaultMessage: 'Mã vận đơn' })}:</p>
                                <p className='my-0'>{_logistic?.tracking_number ? _logistic?.tracking_number : '--'}</p>
                            </div>
                        )}

                        {order?.logisticsPackages?.length == 0 &&
                            <p className='text-secondary-custom my-0'>{formatMessage({ defaultMessage: 'Mã vận đơn' })}: --</p>
                        }
                    </div>
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    <div className='d-flex flex-column'>
                        <p>{order?.customer?.user_name || ''}</p>
                    </div>
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1 text-center'>
                    {renderAction}
                </td>
            </tr>
            {canExpand && (
                <tr>
                    <td colSpan='1' className='pt-0 pl-6' >
                        <a
                            className='d-flex align-items-center'
                            onClick={e => {
                                e.preventDefault();
                                setIsExpand(prev => !prev);
                            }}
                        >
                            <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                            <span
                                className='font-weight-normal mx-4'
                                style={{ color: 'rgba(0,0,0,0.85)' }}
                            >
                                {!isExpand ? `${formatMessage({ defaultMessage: 'Xem thêm' })}` : `${formatMessage({ defaultMessage: 'Thu gọn' })}`}
                            </span>
                            <span style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1 }} />
                        </a>
                    </td>
                </tr>
            )}
            {/* {order?.logisticsPackages.map((packg => (
                packg?.connector_channel_error
                    ? (<tr style={{ background: 'rgba(254, 86, 41, 0.31)' }}>
                        <td colSpan={7}>
                            <div className='d-flex'>
                                <SVG src={toAbsoluteUrl("/media/svg/ic-warning.svg")} /> <span style={{ color: '#F80D0D', wordBreak: 'break-word' }} className='ml-4'>Lỗi: {packg?.connector_channel_error
                                }</span>
                            </div>

                        </td>
                    </tr>) : null
            )))} */}
        </Fragment>
    )
});