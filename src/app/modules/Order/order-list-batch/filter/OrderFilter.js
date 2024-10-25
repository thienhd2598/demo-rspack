import React, { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import queryString from 'querystring';
import OrderCount from './OrderCount';
import _, { sum, xor } from 'lodash';
import dayjs from 'dayjs';
import ExportDialog from '../ExportDialog';
import StoreLackOrderDialog from "../../order-list/StoreLackOrderDialog";
import { Checkbox } from '../../../../../_metronic/_partials/controls';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from "react-intl";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'
import clsx from 'clsx';
import { useSelector } from 'react-redux';

const OrderFilter = memo(({
    loadingListOrderChecking, listOrderCheckingQuantity,
    type, whereCondition, ids, coReloadOrder, currentStore,
    optionStores, optionsShippingUnit, currentShippingUnit,
    mappingSmeWarehouse, orderHandleBatch, getOrderLoading }) => {
    const user = useSelector((state) => state.auth.user);
    const location = useLocation();
    const history = useHistory();
    const paramsquery = queryString.parse(location.search.slice(1, 100000));
    const { is_check_status, ...params } = paramsquery

    const [showExportDialog, setshowExportDialog] = useState(false);
    const [typeSearchTime, setTypeSearchTime] = useState('product_name');
    const { formatMessage } = useIntl()

    const STATUS_ORDER = [
        {
            title: formatMessage({ defaultMessage: 'Đơn hợp lệ' }),
            value: ['not_error']
        },
        {
            title: formatMessage({ defaultMessage: 'Chờ phân bổ ĐVVC' }),
            value: 'wait_shipping_carrier'
        },
        {
            title: formatMessage({ defaultMessage: 'Lỗi sàn TMĐT' }),
            value: ['connector_channel_error']
        },
        {
            title: formatMessage({ defaultMessage: 'Lỗi kho' }),
            value: ['warehouse_error']
        },
        {
            title: formatMessage({ defaultMessage: 'Chưa có vận đơn' }),
            value: 'not_document'
        },
    ]

    const optionsSearch = [
        {
            label: formatMessage({ defaultMessage: 'Tên sản phẩm' }),
            value: 'product_name'
        },
        {
            label: formatMessage({ defaultMessage: 'SKU hàng hóa sàn' }),
            value: 'sku'
        },
        {
            label: formatMessage({ defaultMessage: 'Mã đơn hàng' }),
            value: 'ref_order_id'
        },
        {
            label: formatMessage({ defaultMessage: 'Mã kiện hàng' }),
            value: 'system_package_number'
        },
        {
            label: formatMessage({ defaultMessage: 'Mã phiếu xuất kho' }),
            value: 'print_code_xk'
        },
        {
            label: formatMessage({ defaultMessage: 'Mã phiếu đóng gói' }),
            value: 'print_code'
        },
    ]

    const optionsSearchByType = useMemo(() => {
        if (params?.type == 'packing') {
            return optionsSearch?.filter(option => option?.value != 'print_code_xk')
        }
        if (params?.type == 'packed') {
            return optionsSearch
        }
        return optionsSearch?.slice(0, -2)
    }, [optionsSearch, params?.type])

    const placeholderInput = useMemo(() => {
        const findType = optionsSearch?.find(({ value }) => value == typeSearchTime)
        return `Nhập ${findType?.label?.toLocaleLowerCase()}`
    }, [typeSearchTime, optionsSearch])

    const optionOrderBy = [
        {
            value: 'order_at',
            label: formatMessage({ defaultMessage: 'Thời gian đặt hàng' })
        },
        {
            value: 'last_wh_exported_at',
            label: formatMessage({ defaultMessage: 'Thời gian xuất kho' })
        },
        {
            value: 'tts_expired',
            label: formatMessage({ defaultMessage: 'Hạn giao hàng' })
        },
    ]

    const OPTIONS_TYPE_PARCEL = [
        {
            value: 1,
            label: formatMessage({ defaultMessage: 'Sản phẩm đơn lẻ (Số lượng 1)' }),
            note: formatMessage({ defaultMessage: 'Những đơn hàng có 1 sản phẩm và bán số lượng là 1.' })
        },
        {
            value: 2,
            label: formatMessage({ defaultMessage: 'Sản phẩm đơn lẻ (Số lượng nhiều)' }),
            note: formatMessage({ defaultMessage: 'Những đơn hàng có 1 sản phẩm và bán số lượng nhiều.' })
        },
        {
            value: 3,
            label: formatMessage({ defaultMessage: 'Nhiều sản phẩm' }),
            note: formatMessage({ defaultMessage: 'Những đơn hàng có nhiều sản phẩm trong đơn.' })
        },
        {
            value: 4,
            label: formatMessage({ defaultMessage: 'Có sản phẩm quà tặng' }),
        },

        {
            value: 5,
            label: formatMessage({ defaultMessage: 'Có ghi chú' }),
        },


    ]

    const TRANG_THAI_IN_VAN_DON = [
        {
            value: '!1',
            label: formatMessage({ defaultMessage: 'Chưa in vận đơn' })
        },
        {
            value: 1,
            label: formatMessage({ defaultMessage: 'Đã in vận đơn' })
        }
    ]

    const TRANG_THAI_IN_PHIEU_XUAT_KHO = [
        {
            value: '!2',
            label: formatMessage({ defaultMessage: 'Chưa in phiếu xuất kho' })
        },
        {
            value: 2,
            label: formatMessage({ defaultMessage: 'Đã in phiếu xuất kho' })
        }
    ]

    const TRANG_THAI_IN_PHIEU_TONG_HOP = [
        {
            value: '!16',
            label: formatMessage({ defaultMessage: 'Chưa in phiếu nhặt hàng' })
        },
        {
            value: 16,
            label: formatMessage({ defaultMessage: 'Đã in phiếu nhặt hàng' })
        },
    ]

    const STATUS = [
        {
            title: formatMessage({ defaultMessage: 'Chờ đóng gói' }),
            status: 'ready_to_ship'
        },
        {
            title: formatMessage({ defaultMessage: 'Đang đóng gói' }),
            status: 'packing'
        },
        {
            title: formatMessage({ defaultMessage: 'Chờ lấy hàng' }),
            status: 'packed'
        }
    ]

    const [currentStatus, setCurrentStatus] = useState(STATUS_ORDER[0]?.value || ['not_error'])

    const [dialogLackOrder, setDialogLackOrder] = useState(false);

    const [search, setSearch] = useState('');

    const [inVanDon, setInVanDon] = useState(false);

    const [inPhieuXuat, setInPhieuXuat] = useState(false);

    const [inPhieuTongHop, setInPhieuTongHop] = useState(false);

    const [orderBy, setOrderBy] = useState(optionOrderBy[0]);

    const [sort, setSort] = useState('asc');

    useEffect(() => {
        setSearch(params.q)
    }, [params.q]);

    useMemo(() => {
        setInVanDon(TRANG_THAI_IN_VAN_DON.find(element => element.value == params?.in_van_don) || false)
    }, [params?.in_van_don]);


    useMemo(() => {
        setOrderBy(optionOrderBy.find(element => element.value == params?.order_by) ?? optionOrderBy[0])
    }, [params?.order_by]);


    useMemo(() => {
        setInPhieuXuat(TRANG_THAI_IN_PHIEU_XUAT_KHO.find(element => element.value == params?.in_phieu_xuat_kho) || false)
    }, [params?.in_phieu_xuat_kho]);

    useMemo(() => {
        setInPhieuTongHop(TRANG_THAI_IN_PHIEU_TONG_HOP.find(element => element.value == params?.in_phieu_tong_hop) || false)
    }, [params?.in_phieu_tong_hop]);

    useMemo(() => {
        setSort(params?.sort ?? 'desc')
    }, [params?.sort]);

    useMemo(() => {
        if (!params.status) {
            setCurrentStatus(STATUS_ORDER[0]?.value)
            return
        }
        setCurrentStatus([params.status])
    }, [params?.status]);

    const CLOCK_SVG = <svg className='mx-2' xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#808080" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock-3"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16.5 12" /></svg>

    const listOrderCheckingView = useMemo(() => {
        const viewTick = !sum(listOrderCheckingQuantity?.map(order => order?.local_quantity - order?.seller_quantity)) ? <>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00DB6D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5" /></svg>
            <span className="mx-2" style={{ color: '#00DB6D', fontWeight: '600' }}>{formatMessage({ defaultMessage: 'Tất cả đơn hàng đã được cập nhật' })}</span>
        </> :
            <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                <span className="mx-2" style={{ color: '#FF0000', fontWeight: '600' }}>{formatMessage({ defaultMessage: `Cập nhật thiếu đơn hàng ({amount})` }, { amount: sum(listOrderCheckingQuantity?.map(order => order?.local_quantity - order?.seller_quantity)) })}</span>
            </>
        return (
            <div style={{ display: 'flex', position: 'relative', top: '-4px', marginLeft: 'auto', alignItems: 'center', padding: '7px', border: '1px solid #d9d9d9', borderRadius: '7px' }}>
                {viewTick}

                <OverlayTrigger overlay={
                    <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                        <span>
                            {formatMessage({ defaultMessage: 'Thời gian cập nhật gần nhất' })}
                        </span>
                    </Tooltip>
                }
                >
                    {CLOCK_SVG}
                </OverlayTrigger>

                <span className="mx-2 d-flex align-items-center" style={{ color: 'gray' }}>

                    {dayjs(listOrderCheckingQuantity?.at(0)?.check_time).format('HH:mm')}
                </span>
                <svg onClick={() => setDialogLackOrder(true)} style={{ cursor: 'pointer' }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff5629" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
            </div>
        )
    }, [listOrderCheckingQuantity])
    const optionSelect = [
        { key: "order_scan_packing_view", value: 1, label: formatMessage({ defaultMessage: 'Quét đóng gói' }) },
        {
            key: "order_scan_delivery_view", value: 2, label: formatMessage({ defaultMessage: 'Quét xác nhận đóng gói' })
        }].filter(item => (!user?.is_subuser || [item?.key]?.some(key => user?.permissions?.includes(key))))

    return (
        <Fragment>

            <div style={{ flex: 1 }} className="mb-8" >
                <ul className="nav nav-tabs">
                    {STATUS.map((_tab, index) => {
                        const { title, status } = _tab;
                        const isActive = status == (params?.type || 'ready_to_ship')
                        return (
                            <li key={`tab-order-${index}`} className="nav-item">
                                <a className={`nav-link font-weight-normal ${isActive ? 'active' : ''}`}
                                    style={{ fontSize: '16px' }}
                                    onClick={() => {
                                        history.push(`/orders/list-batch?${queryString.stringify(_.omit({ page: 1, type: status }))}`)
                                    }}
                                >
                                    {title}
                                </a>
                            </li>
                        )
                    })
                    }
                    {loadingListOrderChecking ? <>
                        <div style={{ display: 'flex', marginLeft: 'auto', alignItems: 'center' }}>
                            <Skeleton style={{ width: 370, height: 40, borderRadius: 4 }} count={1} />
                        </div>
                    </> :
                        listOrderCheckingView}
                </ul>

            </div>

            <div className="form-group mb-4 mt-8 border-bottom pb-4">
                <div className='mb-4 d-flex'>
                    <div className='text-right fs-16' style={{ width: '150px' }}>{formatMessage({ defaultMessage: 'Kho hàng' })}:</div>
                    <div className='col-10'>
                        <div className='d-flex flex-wrap' style={{ gap: '10px' }}>
                            {mappingSmeWarehouse?.map((wh, index) => {
                                const isWhActive = !!params?.warehouse_id ? params?.warehouse_id == wh?.id : (mappingSmeWarehouse?.some(wh => wh?.is_default) ? wh?.is_default : index == 0)
                                return (
                                    <span key={index} className="py-2 px-4 d-flex justify-content-between align-items-center" style={{ cursor: 'pointer', border: isWhActive ? '1px solid #FE5629' : '1px solid #D9D9D9' }}
                                        onClick={() => {
                                            history.push(`/orders/list-batch?${queryString.stringify(_.omit({ ...params, page: 1, warehouse_id: wh?.id }, ['stores', 'shipping_unit']))}`)
                                        }}
                                    >
                                        {`${wh?.name} (${wh?.number_package || 0})`}
                                    </span>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className='mb-4 d-flex '>
                    <div className='text-right fs-16' style={{ width: '150px' }}>{formatMessage({ defaultMessage: 'Gian hàng' })}:</div>
                    <div className='col-10'>
                        <div className='d-flex flex-wrap' style={{ gap: '10px' }}>
                            {optionStores?.map((store, index) => {
                                return (
                                    <div
                                        onClick={() => {
                                            history.push(`/orders/list-batch?${queryString.stringify(_.omit({ ...params, page: 1, stores: store.value }, ['shipping_unit', 'payments']))}`)
                                        }}
                                        style={{ cursor: 'pointer', border: (currentStore[0]?.value ?? optionStores[0]?.value) == store.value ? '1px solid #FE5629' : '1px solid #D9D9D9' }} className="text-center py-1 px-4 mr-2 fs-14">
                                        <img src={store?.logo}
                                            style={{ width: '20px', height: '20px', objectFit: 'cover' }}
                                            className='mr-2' alt="" />
                                        {`${store.label} (${store?.number_package || ''})`}
                                    </div>
                                )
                            })
                            }
                        </div>
                    </div>
                </div>

                <div className='mb-4 d-flex '>
                    <div className='text-right fs-16' style={{ width: '150px' }}>{formatMessage({ defaultMessage: 'Đơn vị vận chuyển' })}:</div>
                    <div className='col-10'>
                        <div className='d-flex flex-wrap' style={{ gap: '10px' }}>
                            {optionsShippingUnit?.map((shipping_unit, index) => {
                                return (
                                    <span onClick={() => {
                                        history.push(`/orders/list-batch?${queryString.stringify(_.omit({ ...params, page: 1, shipping_unit: shipping_unit.value }))}`)
                                    }}
                                        key={index} style={{ cursor: 'pointer', border: (currentShippingUnit[0]?.value ?? optionsShippingUnit[0]?.value) == shipping_unit?.value ? '1px solid #FE5629' : '1px solid #D9D9D9' }} className="py-2 px-4 d-flex justify-content-between align-items-center">
                                        {`${shipping_unit?.label} (${shipping_unit?.number_package})`}
                                    </span>
                                )
                            })
                            }
                        </div>

                    </div>
                </div>
                <div className='mb-4 d-flex align-items-center'>
                    <div className="col-4 mr-0 p-0" style={{ zIndex: 97 }}>
                        <Select
                            options={optionsSearchByType}
                            className="w-100 custom-select-order"
                            style={{ padding: 0 }}
                            value={!!params?.search_type ? optionsSearchByType.find((_op) => _op.value == typeSearchTime) : optionsSearchByType[0]}
                            onChange={(value) => {
                                setTypeSearchTime(value);
                                if (!!value) {
                                    history.push(`${location.pathname}?${queryString.stringify({ ...params, search_type: value.value })}`);
                                    setTypeSearchTime(value.value);
                                }
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>{option.label}</div>;
                            }}
                        />
                    </div>
                    <div className='col-8 p-0 input-icon' style={{ height: 'fit-content' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder={!!params?.search_type ? placeholderInput : `Nhập ${optionsSearchByType[0]?.label?.toLocaleLowerCase()}`}
                            style={{ height: 37, borderRadius: 0 }}
                            onBlur={(e) => {
                                history.push(`/orders/list-batch?${queryString.stringify({ ...params, page: 1, q: e.target.value })}`)
                            }}
                            value={search || ''}
                            onChange={(e) => {
                                setSearch(e.target.value)
                            }}
                            onKeyDown={e => {
                                if (e.keyCode == 13) {
                                    history.push(`/orders/list-batch?${queryString.stringify({ ...params, page: 1, q: e.target.value })}`)
                                }
                            }}
                        />
                        <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                    </div>
                </div>
                <div className='mb-4 mt-6 d-flex'>
                    <div className='col-2 text-right'>{formatMessage({ defaultMessage: 'Loại kiện hàng' })}:</div>
                    <div className='col-10'>
                        <div className="d-flex flex-wrap row">
                            {OPTIONS_TYPE_PARCEL?.map(_option => {
                                let parsePrintStatus = params?.type_parcel?.split(',')?.filter(type => type) ?? [];
                                return (
                                    <div className="mb-2 mr-4 d-flex align-items-center check-box-sm">
                                        <Checkbox
                                            className="check-box-sm"
                                            inputProps={{ 'aria-label': 'checkbox' }}
                                            title={_option.label}
                                            isSelected={parsePrintStatus?.find(element => element == _option.value) ? true : false}
                                            onChange={(e) => {
                                                if (parsePrintStatus?.find(element => element == _option.value)) {
                                                    history.push(`/orders/list-batch?${queryString.stringify({
                                                        ...params,
                                                        page: 1,
                                                        type_parcel: parsePrintStatus.filter(_value => _value != _option.value).join(),
                                                        ...(_option.value == 5 ? { have_sme_note: '' } : {})
                                                    })}`)
                                                } else {
                                                    history.push(`/orders/list-batch?${queryString.stringify({
                                                        ...params,
                                                        page: 1,
                                                        type_parcel: parsePrintStatus.concat([_option.value]).join(),
                                                        ...(_option.value == 5 ? { have_sme_note: true } : {})
                                                    })}`)
                                                }
                                            }}
                                        />
                                        {!!_option.note && (
                                            <OverlayTrigger overlay={<Tooltip>{_option.note}</Tooltip>}>
                                                <i className="fs-14 mx-1 fas fa-info-circle"></i>
                                            </OverlayTrigger>
                                        )}

                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                {(params?.type == 'packing' || params?.type == 'packed') && <div className='mb-4 d-flex '>
                    <div className='text-right fs-16' style={{ width: '100px' }}></div>
                    <div className='col-10'>
                        <div className="d-flex">
                            <div style={{ width: '230px', zIndex: 15 }} className="mr-4">
                                <Select
                                    placeholder={formatMessage({ defaultMessage: "Trạng thái in vận đơn" })}
                                    isClearable
                                    className="w-100"
                                    value={inVanDon}
                                    options={TRANG_THAI_IN_VAN_DON}
                                    onChange={values => {
                                        if (!values) {
                                            history.push(`/orders/list-batch?${queryString.stringify(_.omit({ ...params, }, ['in_van_don']))}`)
                                            return
                                        }
                                        history.push(`/orders/list-batch?${queryString.stringify({ ...params, page: 1, in_van_don: values.value })}`)
                                    }}
                                />
                            </div>
                            {params?.type == 'packed' && <div style={{ width: '230px', zIndex: 95 }} className="mr-4">
                                <Select
                                    placeholder={formatMessage({ defaultMessage: "Trạng thái in phiếu xuất" })}
                                    isClearable
                                    className="w-100"
                                    value={inPhieuXuat}
                                    options={TRANG_THAI_IN_PHIEU_XUAT_KHO}
                                    onChange={values => {
                                        if (!values) {
                                            history.push(`/orders/list-batch?${queryString.stringify(_.omit({ ...params, }, ['in_phieu_xuat_kho']))}`)
                                            return
                                        }
                                        history.push(`/orders/list-batch?${queryString.stringify({ ...params, page: 1, in_phieu_xuat_kho: values.value })}`)
                                    }}
                                />
                            </div>
                            }
                            <div style={{ width: '250px', zIndex: 95 }} className="mr-4">
                                <Select
                                    placeholder={formatMessage({ defaultMessage: "Trạng thái in phiếu nhặt hàng" })}
                                    isClearable
                                    className="w-100"
                                    value={inPhieuTongHop}
                                    options={TRANG_THAI_IN_PHIEU_TONG_HOP}
                                    onChange={values => {
                                        if (!values) {
                                            history.push(`/orders/list-batch?${queryString.stringify(_.omit({ ...params, }, ['in_phieu_tong_hop']))}`)
                                            return
                                        }
                                        history.push(`/orders/list-batch?${queryString.stringify({ ...params, page: 1, in_phieu_tong_hop: values.value })}`)
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                }

            </div>
            <div className='row d-flex justify-content-end py-4 mb-5' style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 10 }}>
                <div className='col-6 d-flex align-items-center'>
                    {orderHandleBatch?.source != 'manual' && !getOrderLoading && <div className='d-flex align-items-center'>
                        <div className="mb-2 mr-4 text-primary" style={{ fontSize: 14 }}>{formatMessage({ defaultMessage: 'Đã chọn' })}: {ids?.length} {formatMessage({ defaultMessage: 'kiện hàng' })}</div>
                        <button
                            type="button"
                            disabled={ids?.length == 0}
                            onClick={() => coReloadOrder(ids.map(_ord => _ord?.order?.id))}
                            className={clsx("btn mr-4 px-8", {
                                'btn-primary': ids?.length > 0,
                                'btn-darkk': ids?.length == 0
                            })}
                            style={{ width: 120, color: '#fff', cursor: ids?.length > 0 ? 'pointer' : 'not-allowed' }}
                        >
                            {formatMessage({ defaultMessage: 'Tải lại' })}

                        </button>
                    </div>}
                    {params?.type == 'packing' && <div style={{ flex: 1, zIndex: 10, maxWidth: 200 }}>
                        {optionSelect?.length > 0 && <Select
                            placeholder={formatMessage({ defaultMessage: "Quét mã vạch" })}
                            className="w-100 custom-select-box"
                            isClearable
                            options={optionSelect}
                            onChange={e => {
                                if (e.value == 1) {
                                    history.push(`/orders/scan-order-packing`)
                                } else {
                                    history.push(`/orders/scan-order-delivery`)
                                }
                            }}
                        />}
                    </div>}
                </div>
                <div className="col-6">

                    <div className='d-flex justify-content-end align-items-center'>
                        <div className='mr-3' style={{ width: '130px', textAlign: 'right' }}>
                            {formatMessage({ defaultMessage: 'Sắp xếp theo' })}:
                        </div>
                        <div style={{ width: '230px' }} className="mr-3">
                            <Select
                                className="w-100"
                                value={orderBy}
                                options={optionOrderBy}
                                onChange={values => {
                                    history.push(`/orders/list-batch?${queryString.stringify({
                                        ...params,
                                        page: 1,
                                        order_by: values.value
                                    })}`)
                                }}
                            />
                        </div>

                        <div onClick={() => {
                            history.push(`/orders/list-batch?${queryString.stringify({ ...params, page: 1, sort: 'desc' })}`)
                        }} style={{ height: '38px', width: '38px', cursor: 'pointer', border: sort == 'desc' ? '1px solid #FE5629' : '1px solid #D9D9D9' }} className="justify-content-center d-flex align-items-center mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sort-down" viewBox="0 0 16 16">
                                <path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293V2.5zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                            </svg>
                        </div>

                        <div onClick={() => {
                            history.push(`/orders/list-batch?${queryString.stringify({ ...params, page: 1, sort: 'asc' })}`)
                        }} style={{ height: '38px', width: '38px', cursor: 'pointer', border: sort == 'asc' ? '1px solid #FE5629' : '1px solid #D9D9D9' }} className="justify-content-center d-flex align-items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sort-up" viewBox="0 0 16 16">
                                <path d="M3.5 12.5a.5.5 0 0 1-1 0V3.707L1.354 4.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.498.498 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 3.707V12.5zm3.5-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {type != 'packed' && <div style={{ position: 'sticky', top: 109, background: '#fff', zIndex: 9 }}>
                <div className='d-flex w-100 mt-2'>
                    <div style={{ flex: 1 }} >
                        <ul className="nav nav-tabs" id="myTab" role="tablist" style={{ borderBottom: 'none' }} >
                            {(type !== 'ready_to_ship'
                                ? STATUS_ORDER.filter(tb => tb.value != 'wait_shipping_carrier' && tb.title !== `${formatMessage({ defaultMessage: 'Đang tạo vận đơn' })}`)
                                : STATUS_ORDER.filter(tb => tb.title !== `${formatMessage({ defaultMessage: 'Chưa có vận đơn' })}`)
                            )?.map((_tab, index) => {
                                    const { title, value } = _tab;
                                    const isActive = params?.not_document ? value == 'not_document' : currentStatus.toString() == value.toString()
                                    return (
                                        <li key={`tab-order-${index}`} className={`nav-item ${isActive ? 'active' : null}`}>
                                            <a className={`nav-link font-weight-normal ${isActive ? 'active' : ''}`} style={{ fontSize: '13px' }}
                                                onClick={() => {
                                                    history.push(`/orders/list-batch?${queryString.stringify(_.omit({ ...params, page: 1, ...(value == 'not_document' ? { not_document: 1 } : { status: value.toString() }) }, value == 'not_document' ? ['status'] : ['not_document']))}`)
                                                }}>
                                                <span className='mr-1'>{title}</span>
                                                ({<OrderCount
                                                    whereCondition={_.omit({
                                                        ...whereCondition,
                                                        ...(value == 'not_document' ?
                                                            { not_document: 1, list_status: ['packing'] } :
                                                            { list_status: [value.toString(), whereCondition?.list_status[0]] }),
                                                        wait_shipping_carrier: (!params?.type || params?.type == 'ready_to_ship') && value == 'wait_shipping_carrier' ? 1 : 2
                                                    }, value != 'not_document' ? ['not_document'] : [])}
                                                    search={{ ...whereCondition }}
                                                />})
                                            </a>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </div>
                </div>
            </div>}
            <StoreLackOrderDialog
                listOrderCheckingQuantity={listOrderCheckingQuantity}
                show={dialogLackOrder}
                onHide={() => setDialogLackOrder(false)}
            />
            <ExportDialog
                show={showExportDialog}
                onHide={() => setshowExportDialog(false)}
                onChoosed={_channel => {
                }} />
        </Fragment>
    );
})

export default OrderFilter;
