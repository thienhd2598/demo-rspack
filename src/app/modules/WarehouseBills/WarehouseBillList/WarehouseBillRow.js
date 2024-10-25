import React, { memo, useMemo, useState } from "react";
import { Dropdown } from "react-bootstrap";
import dayjs from 'dayjs';
import _ from "lodash";
import { PROTOCOL_IN, PROTOCOL_OUT } from "../WarehouseBillsUIHelper";
import { useHistory } from 'react-router-dom';
import { formatNumberToCurrency } from "../../../../utils";
import { useIntl } from 'react-intl';
import StoreView from "../../../../components/StoreView";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
import mutate_warehouseUserDeleteBill from "../../../../graphql/mutate_warehouseUserDeleteBill";
import LoadingDialog from "../../Products/product-new/LoadingDialog";
import { useMutation } from "@apollo/client";
import { useToasts } from "react-toast-notifications";
import queryString from 'querystring'
import ModalConfirm from "../components/ModalConfirm";
import mutate_warehouseUserCancelWaitingBillInbound from "../../../../graphql/mutate_warehouseUserCancelWaitingBillInbound";

const WarehouseBillRow = ({ key, wareHouseBill, onDelete, onPrint, onConfirm, stores, channels, onCancel, relateBill }) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const { addToast } = useToasts();
    const [modalConfirm, setModalConfirm] = useState(false)
    const [mutate, {loading: loadingDelete}] = useMutation(mutate_warehouseUserDeleteBill, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_bills']
    })

    const [mutateCancelBill, {loading: loadingCancelBill}] = useMutation(mutate_warehouseUserCancelWaitingBillInbound, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_bills', "warehouse_bills_aggregate"]
    })
    
    const renderAction = useMemo(
        () => {
            return (
                <Dropdown drop='down' >
                    <Dropdown.Toggle className='btn-outline-secondary' >
                        {formatMessage({ defaultMessage: 'Chọn' })}
                    </Dropdown.Toggle>

                    {wareHouseBill?.status == 'new' && (
                        <Dropdown.Menu>
                            <AuthorizationWrapper keys={['warehouse_bill_out_action']}>
                                {wareHouseBill?.type == 'out' && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    disabled={!!wareHouseBill?.order_id}
                                    onClick={async e => {
                                        e.preventDefault();

                                        onConfirm(wareHouseBill?.id)
                                    }}>
                                    {formatMessage({ defaultMessage: 'Duyệt phiếu' })}
                                </Dropdown.Item>}
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['warehouse_bill_in_approve']}>
                                {wareHouseBill?.type == 'in' && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    disabled={!!wareHouseBill?.order_id}
                                    onClick={async e => {
                                        e.preventDefault();

                                        onConfirm(wareHouseBill?.id)
                                    }}>
                                    {formatMessage({ defaultMessage: 'Duyệt phiếu' })}
                                </Dropdown.Item>}
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['warehouse_bill_view']}>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();

                                        history.push(`/products/warehouse-bill/${wareHouseBill?.type}/${wareHouseBill?.id}`);
                                    }}>
                                    {formatMessage({ defaultMessage: 'Chi tiết' })}
                                </Dropdown.Item>
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['warehouse_bill_out_action']}>
                                {wareHouseBill?.type == 'out' && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    disabled={!!wareHouseBill?.order_id}
                                    onClick={async e => {
                                        e.preventDefault();
                                        onCancel(+wareHouseBill?.id);
                                    }}
                                    >
                                    {formatMessage({ defaultMessage: 'Hủy phiếu' })}
                                </Dropdown.Item>}
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['warehouse_bill_in_action']}>
                                {wareHouseBill?.type == 'in' && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault(); 

                                        onDelete(wareHouseBill?.id);
                                    }}>
                                    {formatMessage({ defaultMessage: 'Xóa' })}
                                </Dropdown.Item>}
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['warehouse_bill_in_create']}>
                                {wareHouseBill?.type == 'in' && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        history.push(`/products/warehouse-bill/create?${queryString.stringify({
                                            type: wareHouseBill?.type,
                                            billId: wareHouseBill?.id
                                        })}`);
                                    }}>
                                    {formatMessage({ defaultMessage: 'Sao chép' })}
                                </Dropdown.Item>}
                            </AuthorizationWrapper>
                        </Dropdown.Menu>
                    )}

                    {wareHouseBill?.status == 'waiting' && (
                        <Dropdown.Menu>
                            <AuthorizationWrapper keys={['warehouse_bill_view']}>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();

                                        history.push(`/products/warehouse-bill/in/${wareHouseBill?.id}?status=notyet`);
                                    }}>
                                    {formatMessage({ defaultMessage: 'Chi tiết' })}
                                </Dropdown.Item>
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['warehouse_bill_in_cancel']}>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        setModalConfirm(true)
                                    }}>
                                    {formatMessage({ defaultMessage: 'Hoãn nhập' })}
                                </Dropdown.Item>
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['warehouse_bill_out_action']}>
                                {wareHouseBill?.type == 'out' && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();

                                        onPrint(wareHouseBill?.id);
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'In' })}
                                </Dropdown.Item>}
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['warehouse_bill_in_action']}>
                                {wareHouseBill?.type == 'in' && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();

                                        onPrint(wareHouseBill?.id);
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'In' })}
                                </Dropdown.Item>}
                            </AuthorizationWrapper>
                        </Dropdown.Menu>
                    )}

                    {wareHouseBill?.status == 'complete' && (
                        <Dropdown.Menu>
                            <AuthorizationWrapper keys={['warehouse_bill_view']}>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        history.push(`/products/warehouse-bill/${wareHouseBill?.type}/${wareHouseBill?.id}`)
                                    }}>
                                    {formatMessage({ defaultMessage: 'Chi tiết' })}
                                </Dropdown.Item>
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['warehouse_bill_out_action']}>
                                {wareHouseBill?.type == 'out' && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();

                                        onPrint(wareHouseBill?.id);
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'In' })}
                                </Dropdown.Item>}
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['warehouse_bill_in_action']}>
                                {wareHouseBill?.type == 'in' && <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();

                                        onPrint(wareHouseBill?.id);
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'In' })}
                                </Dropdown.Item>}
                            </AuthorizationWrapper>
                        </Dropdown.Menu>
                    )}

                    {wareHouseBill?.status == 'cancel' && (
                        <Dropdown.Menu>
                            <AuthorizationWrapper keys={['warehouse_bill_view']}>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        history.push(`/products/warehouse-bill/${wareHouseBill?.type}/${wareHouseBill?.id}`)
                                    }}>
                                    {formatMessage({ defaultMessage: 'Chi tiết' })}
                                </Dropdown.Item>
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['warehouse_bill_out_action']}>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={async e => {
                                        e.preventDefault();
                                        let { data } = await mutate({
                                            variables: { id: +wareHouseBill?.id }
                                        });
                            
                                        if (data?.warehouseUserDeleteBill?.success) {
                                            addToast(formatMessage({ defaultMessage: `Xóa phiếu xuất kho thành công` }), { appearance: 'success' });
                                        } else {
                                            addToast(
                                                data?.warehouseUserDeleteBill?.message || formatMessage({ defaultMessage: `Xóa phiếu xuất kho thất bại` }),{ appearance: 'error' });
                                        }
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Xoá' })}
                                </Dropdown.Item>
                            </AuthorizationWrapper>
                        </Dropdown.Menu>
                    )}
                </Dropdown>
            )
        }, [wareHouseBill]
    );

    const protocolBill = useMemo(
        () => {
            if (!wareHouseBill) return '--';
            const parseProtocol = _.find(
                wareHouseBill?.type === 'out' ? PROTOCOL_OUT : PROTOCOL_IN,
                (_bill) => _bill?.value == wareHouseBill?.protocol
            );

            return parseProtocol?.label || '--'
        }, [PROTOCOL_IN, PROTOCOL_OUT, wareHouseBill]
    );

    const [_store, _channel] = useMemo(() => {
        let _s = stores?.find?.(__ => __.id == wareHouseBill?.store_id)
        let _c = channels?.find(__ => __.code == _s?.connector_channel_code)
        return [_s, _c]
    }, [wareHouseBill?.store_id, stores, channels])
    const colorText = useMemo(() => {
        if(wareHouseBill?.total_quantity == wareHouseBill?.total_quantity_plan) {
            return '#000'
        } else if (wareHouseBill?.total_quantity > wareHouseBill?.total_quantity_plan) {
            return '#0ADC70'
        } else {
            return '#ff2a2d'
        }
    }, [wareHouseBill])

    const billFound = useMemo(() => {
        if (!relateBill?.length) return {}
        return relateBill?.find(item => item?.id == wareHouseBill?.related_warehouse_bill_id)
    }, [relateBill, wareHouseBill])
    return (
        <>
                <LoadingDialog show={loadingDelete || loadingCancelBill} />
                {!!modalConfirm && <ModalConfirm 
                    show={modalConfirm}
                    onHide={() => {setModalConfirm(false)}}
                    title={formatMessage({ defaultMessage: 'Hệ thống sẽ chuyển phiếu nhập về trạng thái Chờ duyệt, bạn không thể thao tác nhập kho được nữa. Bạn có đồng ý hoãn nhập?' })}
                    onConfirm={async() => {
                        let {data} = await mutateCancelBill({
                            variables: {
                                id: Number(wareHouseBill?.id)
                            }
                        })
                        if (data?.warehouseUserCancelWaitingBillInbound?.success) {
                            addToast(formatMessage({defaultMessage: "Hoãn phiếu nhập thành công"}), {appearance: 'success'})
                        } else {
                            addToast(data?.warehouseUserCancelWaitingBillInbound?.message || formatMessage({defaultMessage: "Hoãn phiếu nhập thất bại"}), {appearance: 'error'})
                        }
                        setModalConfirm(false)
                    }}
                />}
                <tr key={key} style={{ borderBottom: '1px solid #D9D9D9' }}>
                    <td style={{ verticalAlign: 'top' }}>
                        <div className="d-flex flex-column">
                            <span className='my-0' style={{cursor: 'pointer'}} onClick={() => {history.push(`/products/warehouse-bill/${wareHouseBill?.type}/${wareHouseBill?.id}`)}}>{wareHouseBill?.code || '--'}</span>
                            {(wareHouseBill?.type === 'in' ? wareHouseBill?.protocol == 0 : wareHouseBill?.protocol == 0) && (
                                <>
                                    <span className='text-secondary-custom mt-2'>{formatMessage({ defaultMessage: 'Mã đơn hàng' })}:</span>
                                    <span className='my-0'>{wareHouseBill?.order_code || '--'}</span>
                                    <span className='text-secondary-custom mt-2'>{formatMessage({ defaultMessage: 'Mã vận đơn' })}:</span>
                                    <span className='my-0'>{wareHouseBill?.shipping_code || '--'}</span>
                                </>
                            )}
                            {wareHouseBill?.type === 'in' && wareHouseBill?.related_warehouse_bill_id && (
                                <>
                                    <span className='text-secondary-custom mt-2'>{formatMessage({ defaultMessage: 'Phiếu liên quan' })}:</span>
                                    <span className='my-0' style={{cursor: 'pointer'}} onClick={() => {history.push(`/products/warehouse-bill/${billFound?.type}/${billFound?.id}`)}}>{billFound?.code || '--'}</span>
                                </>
                            )}
                        </div>
                    </td>
                    {wareHouseBill?.type != 'in' && <td style={{ verticalAlign: 'top' }}>
                        <div className="d-flex flex-column">
                            <div className="d-flex align-items-center">
                                <span>{formatMessage({ defaultMessage: 'Số lượng hàng hóa' })}:</span>
                                <span className='my-0 ml-2'><strong>{formatNumberToCurrency(wareHouseBill?.bill_items_aggregate?.aggregate?.count || 0)}</strong></span>
                            </div>
                            <div className="d-flex align-items-center mt-2">
                                <span>
                                    {formatMessage({ defaultMessage: 'Số lượng xuất kho' })}:
                                </span>
                                <span className='my-0 ml-2'><strong>{formatNumberToCurrency(_.sumBy(wareHouseBill?.bill_items, (_bill) => _bill?.quantity) || 0)}</strong></span>
                            </div>
                        </div>
                    </td>}
                    {wareHouseBill?.type == 'in' && <td style={{ verticalAlign: 'top' }}>
                        <div className="d-flex flex-column">
                            <div className="d-flex align-items-center">
                                <span>{formatMessage({ defaultMessage: 'Hàng hóa' })}:</span>
                                <span className='my-0 ml-2'><strong>{formatNumberToCurrency(wareHouseBill?.bill_items_aggregate?.aggregate?.count || 0)}</strong></span>
                            </div>
                            <div className="d-flex align-items-center mt-2">
                                <span>
                                    {formatMessage({ defaultMessage: 'Nhập kho' })}:
                                </span>
                                {wareHouseBill?.status == 'complete'
                                ? <span className='my-0 ml-2'><span style={{color: colorText}}><strong>{formatNumberToCurrency(wareHouseBill?.total_quantity || 0)}</strong></span>/</span>
                                : <></>}
                                <span className='my-0 ml-2'><strong>{formatNumberToCurrency(wareHouseBill?.total_quantity_plan) || 0}</strong></span>
                            </div>
                        </div>
                    </td>}
                    <td style={{ verticalAlign: 'top' }}>
                        <p style={{ color: '#888484' }} >Kho:</p>
                        <span>{wareHouseBill?.warehouse?.name || '--'}</span>
                        <p style={{ color: '#888484' }} >Gian hàng:</p>
                        <StoreView store={_store} channel={_channel} />
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                        <span>{protocolBill}</span>
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                        <div className="d-flex flex-column">
                            <span className='text-secondary-custom'>{formatMessage({ defaultMessage: 'Thời gian tạo' })}:</span>
                            <span className='my-0'>{dayjs(wareHouseBill?.created_at).format('DD/MM/YYYY HH:mm')}</span>
                            {
                                wareHouseBill?.type == 'in' || wareHouseBill?.status == 'new' ? <>
                                    <span className='text-secondary-custom mt-2'>{formatMessage({ defaultMessage: 'Thời gian cập nhật' })}:</span>
                                    <span className='my-0'>{dayjs(wareHouseBill?.updated_at).format('DD/MM/YYYY HH:mm')}</span>
                                </> : <>
                                    <span className='text-secondary-custom mt-2'>{formatMessage({ defaultMessage: 'Thời gian in phiếu' })}:</span>
                                    <span className='my-0'>{wareHouseBill?.printed_date ? dayjs.unix(wareHouseBill?.printed_date).format('DD/MM/YYYY HH:mm') : '--'}</span>
                                </>
                            }
                        </div>
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                        {wareHouseBill?.created_by_email || '--'}
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                        {renderAction}
                    </td>
                </tr>
        </>
    )
};

export default memo(WarehouseBillRow);