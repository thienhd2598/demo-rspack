import React, { Fragment, memo, useMemo, useState } from 'react'
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
import _ from 'lodash';
import { formatNumberToCurrency } from '../../../../utils';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import dayjs from 'dayjs';
import OrderProductRow from './OrderProductRow';
import { Checkbox } from '../../../../_metronic/_partials/controls';
import SVG from "react-inlinesvg";
import duration from 'dayjs/plugin/duration';
import { useIntl } from 'react-intl'
import { STATUS_EXPORT_BILL } from './constants';
dayjs.extend(duration);

export default memo(({ params, order, key,
    op_connector_channels, sc_stores, setIds, isSelected }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isExpand, setIsExpand] = useState(false);

    const { formatMessage } = useIntl()

    let _store = sc_stores.find(_st => _st.id == order.store_id);
    let _channel = op_connector_channels.find(_st => _st.code == order.connector_channel_code);
    let canExpand = order?.productSmeItems?.length > 3;

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1500)
    };

    const viewStatusIcon = useMemo(() => {
        return STATUS_EXPORT_BILL?.find(({ status }) => status == order?.invoice?.status)
    }, [order])

    return (
        <Fragment key={key}>
            <tr>
                <td colSpan='7' className='p-0'>
                    <div className='d-flex align-items-center justify-content-between' style={{ background: '#D9D9D9', padding: '8px' }}>
                        <div className='d-flex'>
                            <Checkbox inputProps={{ 'aria-label': 'checkbox', }}
                                size='checkbox-md'
                                isSelected={isSelected}
                                onChange={(e) => {
                                    if (isSelected) {
                                        setIds(prev => prev.filter(_id => _id.id != order.id))
                                    } else {
                                        setIds(prev => prev.concat([order]))
                                    }
                                }}
                            />
                            <span className='mx-4'>
                                <img src={_channel?.logo_asset_url} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />
                                <span className='ml-1'>{_store?.name}</span>
                            </span>

                            <div className='d-flex align-items-center' style={{ cursor: 'pointer' }} onClick={() => window.open(`/finance/${order?.id}`, "_blank")}>
                                <span>{formatMessage({ defaultMessage: 'Số chứng từ' })}:</span>
                                <span className='ml-2' style={{ color: '#FE5629' }}>{order?.code || '--'}</span>
                            </div>

                            <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                                <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(order?.code)} className='ml-2'><i style={{ fontSize: 12 }} className="far fa-copy"></i></span>

                            </OverlayTrigger>

                            <div className='d-flex align-items-center' style={{ cursor: `${order?.object_type == 1 || (order?.object_type == 2 && order?.status == "CANCELLED") ? 'pointer' : ''}`, marginLeft: '40px' }}
                            >
                                <span>{formatMessage({ defaultMessage: 'Mã đơn hàng' })}:</span>
                                <span className='ml-2' style={{ color: '#1472FF' }} onClick={() => {
                                    if (order?.object_type == 1 || (order?.object_type == 2 && order?.status == "CANCELLED")) {
                                        window.open(`/orders/${order?.sc_object_id}`, "_blank")
                                    }
                                }}>{order?.ref_id}</span>
                            </div>

                            <OverlayTrigger overlay={
                                <Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>
                            }
                            >
                                <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(order?.ref_id)} className='ml-2'><i style={{ fontSize: 12 }} className="far fa-copy"></i></span>
                            </OverlayTrigger>
                        </div>
                        <div className='d-flex align-items-center'>
                            {(order?.object_type == 1 || (order?.object_type == 2 && order?.status !== "RETURNED")) && <span className='mr-4 fs-14'>
                                {formatMessage({ defaultMessage: 'Thời gian đặt đơn' })}:   {!!order?.order_at ? dayjs(order?.order_at * 1000).format('DD/MM/YYYY HH:mm ') : '--'}
                            </span>}

                            {(order?.object_type == 2 && order?.status == "RETURNED") &&
                                <span className='mr-4 fs-14'>
                                    {formatMessage({ defaultMessage: 'Thời gian tạo hoàn' })}: {!!order?.reverse_request_time ? dayjs(order?.reverse_request_time * 1000).format('DD/MM/YYYY HH:mm ') : '--'}
                                </span>}
                            {(!!order?.invoice && !!order?.invc_exported) && (
                                <OverlayTrigger placement='left' overlay={
                                    <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                        {formatMessage(viewStatusIcon?.label) || ''}
                                    </Tooltip>
                                }>
                                    <div className='mx-2'>
                                        <svg style={{
                                            stroke: 'white',
                                            strokeWidth: 1,
                                            fill: viewStatusIcon?.color || 'black'
                                        }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-check"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="m9 15 2 2 4-4" /></svg>
                                    </div>
                                </OverlayTrigger>

                            )}

                        </div>

                    </div>
                </td>
            </tr>
            <tr>
                <td style={{ verticalAlign: 'top' }} className="p-0">
                    {
                        order?.productSmeItems?.slice(0, (canExpand && !isExpand) ? 3 : order?.productSmeItems?.length)
                            ?.map((item, index) => {
                                let length = (canExpand && !isExpand) ? 3 : order?.productSmeItems?.length
                                let isBorder = index + 1 !== length
                                return (
                                    <>
                                        <OrderProductRow
                                            isCombo={!!item?.is_combo}
                                            id={order?.sc_object_id}
                                            key={`order-product-${index}`}
                                            item={item}
                                            isBorder={isBorder}
                                        />
                                    </>
                                )
                            })
                    }
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1 text-right'>
                    <div className='d-flex flex-column'>
                        <div className="pb-2">{formatNumberToCurrency(order?.sum_paid_price)} đ</div>
                        <div>{order?.payment_method || ''}</div>
                    </div>
                </td>
                
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1 text-right'>
                    {formatNumberToCurrency(order?.sum_cost_price)} đ
                </td>
                
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1 text-right'>
                    {formatNumberToCurrency(order?.sum_discount)} đ
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    <span>{order?.statusName}</span>
                </td>
                <td style={{ verticalAlign: 'top' }} className='pt-4 pb-1'>
                    <div className='d-flex flex-column'>
                        <span>
                            <div>{formatMessage({ defaultMessage: "Mã tra cứu" })}:</div>
                            <div>{order?.invoice?.inv_transaction_id ? order?.invoice?.inv_transaction_id : '--'}</div>
                        </span>
                        {order?.object_type == 1 ? (
                            <span>
                                <div>{formatMessage({ defaultMessage: "Thời gian xuất" })}:</div>
                                <div>{order?.invoice?.created_at ? dayjs(order?.invoice?.created_at).format('DD/MM/YYYY HH:mm') : '--'}</div>
                            </span>
                        ) : (
                            <span>
                                <div>{formatMessage({ defaultMessage: "Trạng thái" })}:</div>
                                <div>{viewStatusIcon?.label ? formatMessage(viewStatusIcon?.label) : '--'}</div>
                            </span>
                        )}

                    </div>
                </td>
            </tr>
            {canExpand && (
                <tr>
                    <td colSpan='1' className='pt-0 pl-6' >
                        <a className='d-flex align-items-center' onClick={e => {
                            e.preventDefault();
                            setIsExpand(prev => !prev);
                        }}>
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

        </Fragment>
    )
});