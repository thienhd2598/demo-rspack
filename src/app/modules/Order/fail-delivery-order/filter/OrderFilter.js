import React, { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import Select from "react-select";
import queryString from 'querystring';
import op_connector_channels from "../../../../../graphql/op_connector_channels";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import { OPTIONS_SOURCE_ORDER, STATUS_FAIL_DELIVERY_ORDER } from '../../OrderUIHelpers';
import OrderCount from './OrderCount';
import _, { omit, xor } from 'lodash';
import DateRangePicker from 'rsuite/DateRangePicker';
import dayjs from 'dayjs';
import ExportDialog from '../ExportDialog';
import { HistoryRounded } from '@material-ui/icons';
import DrawerModal from '../../../../../components/DrawerModal';
import OrderFilterDrawer from './OrderFilterDrawer';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
// import { STATUS_WAREHOUSING } from '../../return-order/utils/contants';
import { useIntl } from "react-intl";
import makeAnimated from 'react-select/animated';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';

const OrderFilter = memo(({dataWarehouse, channelAndStores, whereCondition, ids, coReloadOrder, pxSticky, dataStore, loadingStore, valueRangeTime, setValueRangeTime }) => {
    const { formatMessage } = useIntl();
    const {currentChannels, channelsActive, currentStores, optionsStores} = channelAndStores || {}
    const STATUS_WAREHOUSING = [
        {
            value: 0,
            label: formatMessage({ defaultMessage: "Chưa xử lý" })
        },
        {
            value: 1,
            label: formatMessage({ defaultMessage: "Không nhập kho" }),
        },
        {
            value: 2,
            label: formatMessage({ defaultMessage: "Nhập kho một phần" }),
        },
        {
            value: 3,
            label: formatMessage({ defaultMessage: "Nhập kho toàn bộ" }),
        },
    ];

    const SEARCH_DATE_OPTIONS = [
        { value: 'order_at', label: formatMessage({ defaultMessage: "Thời gian tạo đơn" }) },
        { value: 'returned_time', label: formatMessage({ defaultMessage: "Thời gian trở về" }) },
        { value: 'return_processing_time', label: formatMessage({ defaultMessage: "Thời gian xử lý trả hàng" }) },
    ];

    const location = useLocation();
    const history = useHistory();
    const animatedComponents = makeAnimated();
    const params = queryString.parse(location.search.slice(1, 100000));
    let currentChannel = params?.channel || '';
    const [showExportDialog, setshowExportDialog] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(STATUS_FAIL_DELIVERY_ORDER[0]?.title || '')
    const [isOpenDrawer, setOpenDrawer] = useState(false);
    const onToggleDrawer = useCallback(() => setOpenDrawer(prev => !prev), [setOpenDrawer]);

    const [search, setSearch] = useState('');
    const [searchType, setSearchType] = useState('ref_order_id');

    const disabledFutureDate = useCallback((date) => {
        const unixDate = dayjs(date).unix();
        const fromDate = dayjs().startOf('day').add(-89, 'day').unix();
        const toDate = !!params?.is_old_order
            ? dayjs().endOf('day').add(-90, 'day').unix()
            : dayjs().endOf("day").unix();

        return !!params?.is_old_order
            ? unixDate > toDate
            : (unixDate < fromDate || unixDate > toDate);
    }, [params?.is_old_order]);

    useEffect(() => {
        setSearch(params.q)
    }, [params.q]);

    useEffect(() => {
        setSearchType(params.search_type || 'ref_order_id')
    }, [params.search_type]);

    const checkedFilterBoxOrders = useMemo(
        () => {
            const KEYS_IN_BOX_SEARCH = ['import_type', 'payments', 'processed_warehouse'];

            let checked = KEYS_IN_BOX_SEARCH?.some(
                _key => _key in params
            );

            return checked;
        }, [location.search]
    );


    const optionsSearch = [
        {
            value: 'ref_order_id',
            label: formatMessage({ defaultMessage: 'Mã đơn hàng' })
        },
        {
            value: 'tracking_number',
            label: formatMessage({ defaultMessage: 'Mã vận đơn' })
        },
        {
            value: 'sku',
            label: formatMessage({ defaultMessage: 'SKU hàng hóa sàn' })
        },
        {
            value: 'product_name',
            label: formatMessage({ defaultMessage: 'Tên sản phẩm' })
        },
    ]

    const RETURN_PROCESS_STATUS = [
        {
            value: 'returning',
            label: formatMessage({ defaultMessage: 'Đang trở về' })
        },
        {
            value: 'returned_logistic',
            label: formatMessage({ defaultMessage: 'ĐVVC đã giao-chưa xử lý' })
        },
        {
            value: 'processed',
            label: formatMessage({ defaultMessage: 'Đã xử lý' })
        },
        {
            value: 'returned_wh',
            label: formatMessage({ defaultMessage: 'Kho đã nhận-chưa xử lý' })
        },
    ];

    const OPTIONS_MAP_SME = [
        {
            value: '0',
            label: formatMessage({ defaultMessage: 'Kiện hàng chưa liên kết kho' })
        },
        {
            value: '1',
            label: formatMessage({ defaultMessage: 'Kiện hàng đã liên kết kho' })
        },
    ];

    useMemo(() => {
            if (!params?.gt || !params?.lt) return;

            let rangeTimeConvert = [params?.gt, params?.lt]?.map(
                _range => new Date(_range * 1000)
            );
            setValueRangeTime(rangeTimeConvert)
        }, [params?.gt, params?.lt]
    );



    const filterBlock = useMemo(() => {

            let _options = dataStore?.sc_stores?.filter(_store => !currentChannel || _store.connector_channel_code == currentChannel)
                .map(_store => {
                    let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
                    return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
                }) || [];
            // let parseParamsStores = params?.stores?.split(',')
            // let blockStores = _options?.filter(
            //     _option => parseParamsStores?.some(param => param == _option?.value)
            // );

            let blockPayments = params?.payments?.split(',')
            let parseParamsImportType = params?.import_type?.split(',')
            let blockImportType = STATUS_WAREHOUSING?.filter(
                _option => parseParamsImportType?.some(param => param == _option?.value)
            );

            let parseParamsFilterMapSme = params?.filter_map_sme?.split(",");
            let blockFilterMapSme = OPTIONS_MAP_SME?.filter((_option) =>
                parseParamsFilterMapSme?.some((param) => param == _option?.value)
            );

            let parseParamsSmeWarehouse = params?.processed_warehouse?.split(",");
            let blockSmeWarehouse = dataWarehouse?.filter((_option) => parseParamsSmeWarehouse?.some((param) => param == _option?.id));


            const blockListSource = OPTIONS_SOURCE_ORDER?.filter((_option) =>
                params?.list_source?.split(",")?.some((param) => param == _option?.value)
            );

            return (
                <div className="d-flex flex-wrap" style={{ gap: 10 }}>

                    {blockPayments?.length > 0 && (
                        <span
                            className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
                            style={{ border: '1px solid #ff6d49', borderRadius: 20, background: 'rgba(255,109,73, .1)' }}
                        >
                            <span>{`${formatMessage({ defaultMessage: 'Hình thức thanh toán' })}: ${blockPayments?.join(', ')}`}</span>
                            <i
                                className="fas fa-times icon-md ml-4"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    history.push(`${location.pathname}?${queryString.stringify({
                                        ..._.omit(params, 'payments')
                                    })}`.replaceAll('%2C', '\,'));
                                }}
                            />
                        </span>
                    )}

                    {blockFilterMapSme?.length > 0 && (
                        <span
                            className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
                            style={{
                                border: "1px solid #ff6d49",
                                borderRadius: 20,
                                background: "rgba(255,109,73, .1)",
                            }}
                        >
                            <span>{`${formatMessage({
                                defaultMessage: "Trạng thái liên kết hàng hoá kho",
                            })}: ${_.map(blockFilterMapSme, "label")?.join(", ")}`}</span>
                            <i
                                className="fas fa-times icon-md ml-4"
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                    history.push(
                                        `${location.pathname}?${queryString.stringify({
                                            ..._.omit(params, "filter_map_sme"),
                                        })}`.replaceAll("%2C", ",")
                                    );
                                }}
                            />
                        </span>
                    )}

                    {blockListSource?.length > 0 && (
                        <span
                            className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
                            style={{
                                border: "1px solid #ff6d49",
                                borderRadius: 20,
                                background: "rgba(255,109,73, .1)",
                            }}
                        >
                            <span>{`${formatMessage({
                                defaultMessage: "Loại đơn",
                            })}: ${_.map(blockListSource, item => formatMessage(item.label))?.join(", ")}`}</span>
                            <i
                                className="fas fa-times icon-md ml-4"
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                    history.push(
                                        `${location.pathname}?${queryString.stringify({
                                            ..._.omit(params, "list_source"),
                                        })}`.replaceAll("%2C", ",")
                                    );
                                }}
                            />
                        </span>
                    )}

                    {blockImportType?.length > 0 && (
                        <span
                            className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
                            style={{ border: '1px solid #ff6d49', borderRadius: 20, background: 'rgba(255,109,73, .1)' }}
                        >
                            <span>{`${formatMessage({ defaultMessage: 'Trạng thái nhập kho' })}: ${_.map(blockImportType, 'label')?.join(', ')}`}</span>
                            <i
                                className="fas fa-times icon-md ml-4"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    history.push(`${location.pathname}?${queryString.stringify({
                                        ..._.omit(params, 'import_type')
                                    })}`.replaceAll('%2C', '\,'));
                                }}
                            />
                        </span>
                    )}

                {parseParamsSmeWarehouse?.length > 0 && (
                        <span
                            className="mb-4 py-2 px-4 d-flex justify-content-between align-items-center"
                            style={{ border: '1px solid #ff6d49', borderRadius: 20, background: 'rgba(255,109,73, .1)' }}
                        >
                            <span>{`${formatMessage({ defaultMessage: 'Kho nhập hàng' })}: ${_.map(blockSmeWarehouse, 'name')?.join(', ')}`}</span>
                            <i
                                className="fas fa-times icon-md ml-4"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    history.push(`${location.pathname}?${queryString.stringify({..._.omit(params, 'processed_warehouse')})}`.replaceAll('%2C', '\,'));
                                }}
                            />
                        </span>
                    )}

                </div>
            )
        }, [location?.search, dataStore]



    );


    return (
        <Fragment>
            <DrawerModal
                open={isOpenDrawer}
                onClose={onToggleDrawer}
                direction="right"
                size={500}
                enableOverlay={true}
            >
                <OrderFilterDrawer
                    dataWarehouse={dataWarehouse}
                    isOpenDrawer={isOpenDrawer}
                    onToggleDrawer={onToggleDrawer}
                    dataStore={dataStore}
                    whereCondition={whereCondition}
                    OPTIONS_MAP_SME={OPTIONS_MAP_SME}
                    RETURN_PROCESS_STATUS={RETURN_PROCESS_STATUS}
                />
            </DrawerModal>
            <div className="d-flex align-items-center py-2 px-4 my-4" style={{ backgroundColor: '#CFF4FC', border: '1px solid #B6EFFB', borderRadius: 4 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" style={{ color: '#055160' }} className="bi bi-lightbulb mr-2" viewBox="0 0 16 16">
                    <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z" />
                </svg>
                <span className="fs-14" style={{ color: '#055160' }}>
                    {formatMessage({ defaultMessage: 'Các đơn hàng có thời gian hơn 90 ngày sẽ được chuyển vào Lịch sử và không thể xử lý được nữa.' })}
                </span>
            </div>

            <div className="d-flex w-100 mb-4" style={{ zIndex: 1 }}>
                <div style={{ flex: 1 }}>
                    <ul className="nav nav-tabs">
                        {[
                            { key: 1, title: formatMessage({ defaultMessage: 'Trong vòng 90 ngày' }) },
                            { key: 2, title: formatMessage({ defaultMessage: 'Lịch sử' }) },
                        ].map((tab) => {
                            const isTabActive = (tab.key == 1 && !params?.is_old_order) || (tab.key == 2 && !!params?.is_old_order);
                            return (
                                <li
                                    key={`tab-${tab.key}`}
                                    onClick={() => {
                                        history.push(
                                            `${location.pathname}?${queryString.stringify({
                                                page: 1,
                                                ...(tab.key == 2 ? { is_old_order: 1 } : {}),
                                            })}`
                                        );
                                    }}
                                >
                                    <a style={{ fontSize: "16px" }} className={`nav-link ${isTabActive ? "active" : ""}`}>
                                        {tab.title}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            <div className='my-4 '>
                <div className='row'>
                    <div className='col-2 pr-0' style={{ zIndex: 93 }}>
                        <Select
                            className='w-100 custom-select-warehouse'
                            theme={(theme) => ({
                                ...theme,
                                borderRadius: 0,
                                colors: {
                                    ...theme.colors,
                                    primary: '#ff5629'
                                }
                            })}
                            isLoading={false}
                            value={
                                _.find((SEARCH_DATE_OPTIONS), _option => _option?.value == params?.search_type_date)
                                || SEARCH_DATE_OPTIONS[0]
                            }
                            defaultValue={SEARCH_DATE_OPTIONS[0]}
                            options={SEARCH_DATE_OPTIONS}
                            onChange={value => {
                                history.push(`/orders/fail-delivery-order?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    search_type_date: value.value
                                })}`);
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>{option.label}</div>
                            }}
                        />
                    </div>
                    <div className='col-4 pl-0'>
                        <DateRangePicker
                            style={{ float: 'right', width: '100%' }}
                            character={' - '}
                            className='date-select-options'
                            format={"HH:mm dd/MM/yyyy"}
                            value={valueRangeTime}
                            placeholder={"hh:mm dd/mm/yyyy - hh:mm dd/mm/yyyy"}
                            placement={'bottomEnd'}
                            disabledDate={disabledFutureDate}
                            onChange={values => {
                                let queryParams = {};
                                setValueRangeTime(values)

                                if (!!values) {
                                    let [gtCreateTime, ltCreateTime] = [dayjs(values[0]).unix(), dayjs(values[1]).unix()];
                                    queryParams = _.omit({
                                        ...params, gt: gtCreateTime,
                                        lt: ltCreateTime,
                                        page: 1
                                    }, ['payments'])

                                } else {
                                    queryParams = _.omit({
                                        ...params,
                                        page: 1
                                    }, ['payments', 'gt', 'lt'])
                                }

                                history.push(`/orders/fail-delivery-order?${queryString.stringify(queryParams)}`);
                            }}
                            locale={{
                                sunday: 'CN',
                                monday: 'T2',
                                tuesday: 'T3',
                                wednesday: 'T4',
                                thursday: 'T5',
                                friday: 'T6',
                                saturday: 'T7',
                                ok: formatMessage({ defaultMessage: 'Đồng ý' }),
                                today: formatMessage({ defaultMessage: 'Hôm nay' }),
                                yesterday: formatMessage({ defaultMessage: 'Hôm qua' }),
                                hours: formatMessage({ defaultMessage: 'Giờ' }),
                                minutes: formatMessage({ defaultMessage: 'Phút' }),
                                seconds: formatMessage({ defaultMessage: 'Giây' }),
                                formattedMonthPattern: 'MM/yyyy',
                                formattedDayPattern: 'dd/MM/yyyy',
                                // for DateRangePicker
                                last7Days: formatMessage({ defaultMessage: '7 ngày qua' })
                            }}
                        />
                    </div>
                    
                    <div className='col-3' style={{ zIndex: 95 }}>
                        <div className='d-flex align-items-center'>
                            <Select
                            options={channelsActive}
                            className='w-100 select-report-custom'
                            placeholder={formatMessage({ defaultMessage: 'Chọn sàn' })}
                            components={animatedComponents}
                            isClearable
                            isMulti
                            value={currentChannels}
                            isLoading={loadingStore}
                            onChange={values => {
                                const channelsPush = values?.length > 0 ? _.map(values, 'value')?.join(',') : undefined;
                                history.push(`/orders/fail-delivery-order?${queryString.stringify(_.omit({...params,page: 1, channel: channelsPush,}, ['stores', 'shipping_unit', 'payments']))}`)
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>
                                {!!option.logo && <img src={option.logo} alt="" style={{ width: 15, height: 15, marginRight: 4 }} />}
                                {option.label}
                                </div>
                            }}
                            />
                        </div>
                    </div>
                    <div className='col-3' style={{ zIndex: 95 }}>
                        <div className='d-flex align-items-center'>
                            <Select
                            options={optionsStores}
                            className='w-100 select-report-custom'
                            placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
                            components={animatedComponents}
                            isClearable
                            isMulti
                            value={currentStores}
                            isLoading={loadingStore}
                            onChange={values => {
                                const stores = values?.length > 0 ? _.map(values, 'value')?.join(',') : undefined;
                                history.push(`/orders/fail-delivery-order?${queryString.stringify(_.omit({...params,page: 1,stores: stores}, ['shipping_unit', 'payments']))}`)
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>
                                {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                {option.label}
                                </div>
                            }}
                            />
                        </div>
                    </div>
            </div>
                
            </div>
            


            <div>
                <div className="form-group row my-4">
                    <div className='col-2 pr-0' style={{ zIndex: 2 }}>
                        <Select options={optionsSearch}
                            className='w-100 custom-select-order'
                            style={{ borderRadius: 0 }}
                            isLoading={loadingStore}
                            value={optionsSearch.find(_op => _op.value == searchType)}
                            onChange={value => {
                                setSearchType(value)
                                if (!!value) {
                                    history.push(`/orders/fail-delivery-order?${queryString.stringify({
                                        ...params,
                                        page: 1,
                                        search_type: value.value
                                    })}`)
                                } else {
                                    history.push(`/orders/fail-delivery-order?${queryString.stringify({
                                        ...params,
                                        page: 1,
                                        search_type: undefined
                                    })}`)
                                }
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>{option.label}</div>
                            }}
                        />
                    </div>
                    <div className="col-4 input-icon pl-0" style={{ height: 'fit-content' }} >
                        <input
                            type="text"
                            className="form-control"
                            placeholder={formatMessage({ defaultMessage: "Tìm đơn hàng" })}
                            style={{ height: 37, borderRadius: 0, paddingLeft: '50px' }}
                            onBlur={(e) => {
                                history.push(`/orders/fail-delivery-order?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    q: e.target.value
                                })}`)
                            }}
                            value={search || ''}
                            onChange={(e) => {
                                setSearch(e.target.value)
                            }}
                            onKeyDown={e => {
                                if (e.keyCode == 13) {
                                    history.push(`/orders/fail-delivery-order?${queryString.stringify({
                                        ...params,
                                        page: 1,
                                        q: e.target.value
                                    })}`)
                                }
                            }}
                        />
                        <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                    </div>
                    <div className="col-3" style={{ zIndex: 94 }}>
                        <Select
                            placeholder={formatMessage({ defaultMessage: "Chọn trạng thái trả hàng" })}
                            isClearable
                            value={RETURN_PROCESS_STATUS.filter(x => x.value == params?.return_process_status)}
                            options={RETURN_PROCESS_STATUS}
                            onChange={value => {
                                if (!!value) {

                                    history.push(`/orders/fail-delivery-order?${queryString.stringify(_.omit({
                                        ...params,
                                        return_process_status: value.value
                                    }, ['payments']))}`)
                                } else {
                                    history.push(`/orders/fail-delivery-order?${queryString.stringify(_.omit({
                                        ...params,
                                        return_process_status: undefined
                                    }, ['payments']))}`)
                                }
                            }}
                        />
                    </div>
                    <div className="col-3">
                        <div
                            className="d-flex align-items-center justify-content-between px-4 py-2"
                            style={{
                                color: checkedFilterBoxOrders ? '#ff6d49' : '',
                                border: `1px solid ${checkedFilterBoxOrders ? '#ff6d49' : '#ebecf3'}`,
                                borderRadius: 6, height: 40, cursor: 'pointer'
                            }}
                            onClick={onToggleDrawer}
                        >
                            <span>{formatMessage({ defaultMessage: 'Lọc đơn hàng nâng cao' })}</span>
                            <span><i style={{ color: checkedFilterBoxOrders ? '#ff6d49' : '' }} className="fas fa-filter icon-md ml-6"></i></span>
                        </div>
                    </div>
                </div>

                <div className='mt-4'>
                    {filterBlock}
                </div>

            </div>
            <div style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 1 }}>
                <div className={`col-12 d-flex align-items-center py-4 ${!params?.is_old_order ? 'justify-content-between' : 'justify-content-end'}`}>
                    {!params?.is_old_order && <div className='d-flex align-items-center'>
                        <div className="mb-2 mr-4 text-primary" style={{ fontSize: 14 }}>{formatMessage({ defaultMessage: 'Đã chọn' })}: {ids?.length} {formatMessage({ defaultMessage: 'đơn hàng' })}</div>
                        <button
                            type="button"
                            onClick={() => coReloadOrder(ids.map(_ord => _ord.id))}
                            className="btn btn-elevate btn-primary mr-3 px-8"
                            disabled={ids?.length == 0}
                            style={{ color: 'white', width: 120, background: ids?.length == 0 ? '#6c757d' : '', border: ids?.length == 0 ? '#6c757d' : '' }}
                        >
                            {formatMessage({ defaultMessage: 'Tải lại' })}
                        </button>

                    </div>}

                    <div className='d-flex justify-content-end'>
                        <div className='d-flex justify-content-center align-items-center'
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
                            <AuthorizationWrapper keys={['refund_order_import_warehouse']}>
                                {!params?.is_old_order && <button
                                    className="btn btn-primary btn-elevate mr-2"
                                    onClick={e => {
                                        e.preventDefault();
                                        history.push('/orders/process-return-order-fail')
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Xử lý hàng loạt' })}
                                </button>}
                            </AuthorizationWrapper>
                            <AuthorizationWrapper keys={['refund_order_export_file']}>
                                <button
                                    className="btn btn-primary btn-elevate"
                                    onClick={e => {
                                        e.preventDefault();
                                        setshowExportDialog(true)
                                    }}
                                    style={{ flex: 1, }}
                                >
                                    {formatMessage({ defaultMessage: 'Xuất đơn hàng' })}
                                </button>
                                <button
                                    className="btn btn-secondary btn-elevate ml-1"
                                    onClick={e => {
                                        e.preventDefault();
                                        history.push('/orders/fail-delivery-export-histories')
                                    }}
                                    style={{}}
                                >
                                    <HistoryRounded />
                                </button>
                            </AuthorizationWrapper>
                        </div>
                    </div>
                </div>
                <div className='d-flex w-100 mt-3'>
                    <div style={{ flex: 1 }} >
                        <ul className="nav nav-tabs" id="myTab" role="tablist" style={{ borderBottom: 'none' }} >
                            {
                                STATUS_FAIL_DELIVERY_ORDER.map((_tab, index) => {
                                    const { title, status, sub } = _tab;
                                    const isActive =
                                        (!params.logistic_fail && status == STATUS_FAIL_DELIVERY_ORDER[0].status)
                                        || (params.logistic_fail && (status === params?.logistic_fail || sub?.some(_sub => _sub?.status === params?.logistic_fail)))

                                    return (
                                        <li
                                            key={`tab-order-${index}`}
                                            className={`nav-item ${isActive ? 'active' : null} `}
                                        >
                                            <a className={`nav-link font-weight-normal ${isActive ? 'active' : ''}`}
                                                style={{ fontSize: '13px', padding: '11px' }}
                                                onClick={() => {
                                                    setCurrentStatus(title);

                                                    const findedIndexOrderDefault = _.findIndex(sub, _sub => !!_sub?.default);

                                                    history.push(`/orders/fail-delivery-order?${queryString.stringify({
                                                        ...params,
                                                        page: 1,
                                                        logistic_fail: sub?.length > 0
                                                            ? sub[findedIndexOrderDefault].status
                                                            : status
                                                    })}`)
                                                }}
                                            >
                                                {!status && sub.length == 0
                                                    ? <>{title}</>
                                                    : (
                                                        <>
                                                            {title} ({
                                                                <OrderCount
                                                                    whereCondition={{
                                                                        ...whereCondition,
                                                                        logistic_fail: sub.length > 0 ? _.map(sub, 'status') : [status]

                                                                    }}
                                                                />
                                                            })
                                                        </>
                                                    )}
                                            </a>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </div>
                </div>
                {_.find(STATUS_FAIL_DELIVERY_ORDER, { title: currentStatus })?.sub?.length > 0 && (
                    <div className="d-flex flex-wrap py-2" style={{ position: 'sticky', top: 90, background: '#fff', zIndex: 1, gap: 20, marginBottom: '5px' }}>
                        {
                            _.find(STATUS_FAIL_DELIVERY_ORDER, { title: currentStatus })
                                ?.sub
                                ?.map((sub_status, index) => (
                                    <span
                                        key={`sub-status-order-${index}`}
                                        className="py-2 px-6 d-flex justify-content-between align-items-center"
                                        style={{
                                            borderRadius: 20,
                                            background: sub_status?.status === params?.type ? '#ff6d49' : '#828282',
                                            color: '#fff',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                            history.push(`/orders/fail-delivery-order?${queryString.stringify({
                                                ...params,
                                                page: 1,
                                                type: sub_status?.status
                                            })}`)
                                        }}
                                    >
                                        {sub_status?.name} ({
                                            <OrderCount
                                                whereCondition={{
                                                    ...whereCondition,
                                                    status: [sub_status?.status]
                                                }}
                                            />
                                        })
                                    </span>
                                ))
                        }
                    </div>
                )}
            </div>
            <ExportDialog
                params={params}
                show={showExportDialog}
                onHide={() => setshowExportDialog(false)}
                onChoosed={_channel => {
                }}
            />
        </Fragment>
    );
})

export default OrderFilter;
