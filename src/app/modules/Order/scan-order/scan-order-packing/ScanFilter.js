import queryString from 'querystring';
import React, { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useIntl } from "react-intl";
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import { useToasts } from 'react-toast-notifications';
import { Card, CardBody, CardHeader, CardHeaderToolbar } from '../../../../../_metronic/_partials/controls';
import useScanDetection from '../../../../../hooks/useScanDetection';

const ScanFilter = ({
    isValidOrder, handleReadyToShipPackage, loadingOrder, warehouse,
    resetValue, isReadyDeliver, optionWarehouses, setWarehouse, infoOrder,
}) => {
    const history = useHistory();
    const location = useLocation();
    const inputRefOrder = useRef(null);
    const refSelectOrder = useRef(null);
    const params = queryString.parse(location.search.slice(1, 100000));
    const { formatMessage } = useIntl()

    const [typOrder, setTypeOrder] = useState('system_package_number');
    const [focus, setFocus] = useState(0);
    const { addToast } = useToasts();

    useLayoutEffect(() => inputRefOrder.current.focus(), [])

    useEffect(() => {
        if (!isValidOrder && !loadingOrder) {
            history.push(`/orders/scan-order-packing?${queryString.stringify({
                ...params,
                q: ''
            })}`)
        }
    }, [isValidOrder, loadingOrder]);



    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.keyCode === 112) {
                // Phím F1 có keyCode là 112
                event.preventDefault(); // Ngăn chặn hành vi mặc định của phím F1 (ví dụ: mở trình độ trợ giúp)
                if (!isValidOrder) {
                    addToast(formatMessage({ defaultMessage: 'Chưa có thông tin kiện, xin vui lòng quét thông tin kiện' }), { appearance: 'error' })
                    return
                }
                if (!isReadyDeliver) {
                    handleReadyToShipPackage()

                    setTimeout(() => {
                        inputRefOrder.current.focus();
                    }, 800);

                } else {
                    addToast(formatMessage({ defaultMessage: 'Số lượng sản phẩm chưa đủ' }), { appearance: 'error' });
                }

                // Thực hiện các hành động khác tại đây
            }
            if (event.keyCode === 113) {
                // Phím F2 có keyCode là 113
                event.preventDefault();

                resetValueRef()
            }
        };


        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isValidOrder, isReadyDeliver]);

    const resetValueRef = () => {
        inputRefOrder.current.value = ''

        setTimeout(() => {
            inputRefOrder.current.focus();
        }, 800);

        resetValue()
    }
    useScanDetection({
        onComplete: async (value) => {
            if (document?.activeElement != inputRefOrder?.current) return;

            if (focus == 'order') {
                history.push(`/orders/scan-order-packing?${queryString.stringify({
                    ...params,
                    q: value
                })}`)
            }

        }
    });

    useEffect(() => {
        inputRefOrder.current.value = params.q || ''
    }, [params.q]);

    useEffect(() => {
        setTypeOrder(params.search_type || 'tracking_number')
    }, [params.search_type]);

    const optionsSearch = [
        {
            value: "system_package_number",
            label: formatMessage({ defaultMessage: "Mã kiện hàng" }),
        },
        {
            value: "tracking_number",
            label: formatMessage({ defaultMessage: "Mã vận đơn" }),
        },
        {
            value: "warehouse_bill_code",
            label: formatMessage({ defaultMessage: "Quét phiếu xuất kho" }),
        },
    ]


    return (
        <Card>
            <CardHeader title={formatMessage({ defaultMessage: `Quét mã vạch` })}>
                <CardHeaderToolbar>
                </CardHeaderToolbar>
            </CardHeader>
            <CardBody className='py-5'>
                <div className='row d-flex justify-content-between' style={{ fontSize: '15px' }}>
                    <div className={`col-md-4`} >
                        <div className="pr-4 d-flex align-items-center" style={{ zIndex: 3 }}>
                            <label className="mb-0 flex-3" style={{ lineHeight: '37px' }}>{formatMessage({ defaultMessage: "Kho xử lý" })}</label>
                            <Select
                                options={optionWarehouses}
                                className="w-100 custom-select-order flex-7"
                                style={{ borderRadius: 0 }}
                                value={optionWarehouses?.find((_op) => _op.value === warehouse?.value)}
                                styles={{
                                    container: (styles) => ({
                                        ...styles,
                                        zIndex: 9
                                    }),
                                }}
                                onChange={(value) => {
                                    setWarehouse(value);
                                }}
                                formatOptionLabel={(option, labelMeta) => {
                                    return <div>{option.name}</div>;
                                }}
                                isDisabled={infoOrder?.length}
                            />
                        </div>
                    </div>
                    <div className={`col-md-6`} >
                        <div className='row' >
                            <div className='col-4 pr-0' style={{ zIndex: 2 }}>
                                <Select options={optionsSearch}
                                    ref={refSelectOrder}
                                    className='w-100 custom-select-order'
                                    style={{ borderRadius: 0 }}
                                    isDisabled={isValidOrder}
                                    value={optionsSearch.find(_op => _op.value == typOrder)}
                                    onKeyDown={e => {
                                        if (e.keyCode === 39 && !e.target.value) {
                                            inputRefOrder.current.focus();
                                            return;
                                        }
                                    }}
                                    onChange={value => {
                                        inputRefOrder.current.focus();
                                        setTypeOrder(value.value)
                                        if (!!value) {
                                            history.push(`/orders/scan-order-packing?${queryString.stringify({
                                                ...params,
                                                search_type: value.value
                                            })}`)
                                        } else {
                                            history.push(`/orders/scan-order-packing?${queryString.stringify({
                                                ...params,
                                                search_type: undefined
                                            })}`)
                                        }
                                    }}
                                    formatOptionLabel={(option, labelMeta) => {
                                        return <div>{option.label}</div>
                                    }}
                                />
                            </div>
                            <div className="col-8 input-icon pl-0" style={{ height: 'fit-content' }} >
                                <input
                                    ref={inputRefOrder}
                                    disabled={isValidOrder}
                                    type="text"
                                    className="form-control"
                                    placeholder={typOrder == 'system_package_number' 
                                        ? formatMessage({ defaultMessage: "Quét hoặc nhập mã kiện hàng" }) 
                                        : (typOrder == 'warehouse_bill_code' ? formatMessage({ defaultMessage: "Quét hoặc nhập phiếu xuất kho" }) : formatMessage({ defaultMessage: "Quét hoặc nhập mã vận đơn" }))
                                    }
                                    style={{ height: 37, borderRadius: 0, paddingLeft: '50px', fontSize: '15px' }}
                                    onFocus={() => setFocus('order')}
                                    onKeyDown={e => {
                                        if (e.keyCode === 37 && !e.target.value) {
                                            refSelectOrder.current.focus();
                                            return;
                                        }

                                        if (e.keyCode == 13 && e.target.value) {
                                            history.push(`/orders/scan-order-packing?${queryString.stringify({
                                                ...params,
                                                q: e.target.value
                                            })}`)
                                        }
                                    }}
                                />
                                <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='d-flex align-items-center justify-content-end my-6'>
                    <button
                        disabled={isReadyDeliver}
                        className="btn btn-primary btn-elevate mr-4"
                        onClick={e => {
                            e.preventDefault();
                            handleReadyToShipPackage()
                        }}
                        style={{ fontSize: '15px', fontWeight: 700 }}
                    >
                        {formatMessage({ defaultMessage: 'XÁC NHẬN ĐÓNG GÓI VÀ SẴN SÀNG GIAO (F1)' })}
                    </button>
                    <button
                        className="btn btn-primary btn-elevate"
                        onClick={e => {
                            resetValueRef()
                        }}
                        style={{ background: '#6C757D', border: '#6C757D', fontSize: '15px', fontWeight: 700 }}
                    >
                        {formatMessage({ defaultMessage: 'XÓA VÀ QUÉT TIẾP (F2)' })}
                    </button>
                </div>
            </CardBody>
        </Card>
    )
};

export default memo(ScanFilter);