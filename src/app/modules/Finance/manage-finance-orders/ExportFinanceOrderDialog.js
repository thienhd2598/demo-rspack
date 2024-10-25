import React, { useMemo, useState, useCallback } from "react";
import { Modal } from "react-bootstrap";
import { injectIntl } from "react-intl";
import Select from "react-select";
import { useHistory } from "react-router";
import DateRangePicker from 'rsuite/DateRangePicker';
import { useMutation, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import _ from "lodash";
import { useToasts } from "react-toast-notifications";
import { useIntl } from 'react-intl'
import mutate_cfExportFinanceOrder from '../../../../graphql/mutate_cfExportFinanceOrder'
import query_cfGetTemplateExport from '../../../../graphql/query_cfGetTemplateExport'
import { TooltipWrapper } from '../payment-reconciliation/common/TooltipWrapper'
import query_cfExportFinanceOrderAggregate from '../../../../graphql/query_cfExportFinanceOrderAggregate'
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic'
import { omitBy } from "lodash";
import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";
import { MISA_TEMPLATE_STATUS, ORDER_STATUS, RETURN_ORDER_STATUS, TAB_RETURN_SELL_PRODUCT, TAB_SELL_PRODUCT } from "./constants";

function ExportFinanceOrderDialog({ status, show, onHide, params }) {

    const { formatMessage } = useIntl()
    const history = useHistory()
    const { addToast } = useToasts();

    const [channel, setChannel] = useState()
    const [store, setStore] = useState()
    const [valueRangeTime, setValueRangeTime] = useState(null);
    const [typeTime, setTypeTime] = useState('order_at');
    const [templateId, setTemplateId] = useState(null);
    const [typeExport, setTypeExport] = useState();
    const [typeOrder, setTypeOrder] = useState();

    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network',
        variables: {
            context: 'order'
         },
    });

    const { data: dataTemplateExport, loading: loadingGetTemplateExport } = useQuery(query_cfGetTemplateExport, {
        skip: params?.tab == TAB_RETURN_SELL_PRODUCT,
        fetchPolicy: "cache-and-network"
    });


    const optionsSearchByTimes = [
        {
            value: "order_at",
            label: formatMessage({ defaultMessage: "Thời gian đặt hàng" }),
        },
        {
            value: "completed_at",
            label: formatMessage({ defaultMessage: "Ngày hoàn thành" }),
        },
        {
            value: "received_at",
            label: formatMessage({ defaultMessage: "Thời gian giao cho người mua" }),
        },
        {
            value: "wh_exported_at",
            label: formatMessage({ defaultMessage: "Thời gian xuất kho" })
        }
    ];

    const optionsTemplate = [
        {
            value: null,
            label: formatMessage({ defaultMessage: "Mẫu thông tin cơ bản" }),
        },
    ];

    const optionsTypeExport = [
        {
            value: 1,
            label: formatMessage({ defaultMessage: "Đã xuất" }),
        },
        {
            value: 0,
            label: formatMessage({ defaultMessage: "Chưa xuất" }),
        },
    ];

    const optionsTypeOrder = [
        {
            value: 0,
            label: formatMessage({ defaultMessage: "Đơn không có thay đổi" }),
        },
        {
            value: 1,
            label: formatMessage({ defaultMessage: "Đơn có thay đổi" }),
        },
    ];

    useMemo(() => {
        if (!!dataTemplateExport?.cfGetTemplateExport) {
            const templates = dataTemplateExport?.cfGetTemplateExport?.map(template => ({
                value: template?.id,
                label: template?.name
            }))
            optionsTemplate.push(...templates)
        }
    }, [dataTemplateExport, optionsTemplate]);

    useMemo(() => {
        if (!!params?.is_old_order) {
            setValueRangeTime([
                new Date(dayjs().subtract(96, "day").startOf("day")),
                new Date(dayjs().subtract(90, "day").startOf("day")),
            ]);
        } else {
            setValueRangeTime(null);
        }
    }, [params?.is_old_order]);

    const range_time = useMemo(() => {
        if (valueRangeTime) {
            let [time_from, time_to] = [
                dayjs(valueRangeTime[0])
                    .startOf("day")
                    .unix(),
                dayjs(valueRangeTime[1])
                    .endOf("day")
                    .unix(),
            ];
            return {
                time_from,
                time_to
            }
        }
    }, [valueRangeTime])

    const list_store = useMemo(() => {
        if (!channel?.length && !store?.length) {
            return dataStore?.sc_stores.map(st => {
                return {
                    connector_channel_code: st?.connector_channel_code,
                    name_store: st?.name,
                    store_id: st?.id
                }
            })
        } else if (channel?.length && !store?.length) {
            const channel_code = channel?.map(cn => cn.code)
            return dataStore?.sc_stores?.map(st => {
                if (channel_code?.includes(st?.connector_channel_code)) {
                    return {
                        connector_channel_code: st?.connector_channel_code,
                        name_store: st?.name,
                        store_id: st?.id
                    }
                }
            }).filter(e => e)
        } else {
            return store?.map(st => {
                return !!st ? {
                    connector_channel_code: st?.connector_channel_code,
                    name_store: st?.name,
                    store_id: st?.id
                } : {}
            })
        }
    }, [store, channel])

    const abnormal = useMemo(() => {
        if(typeOrder == 0 || typeOrder) {
            return typeOrder
        } 
        return null
    }, [typeOrder])

    const whereCondition = useMemo(() => {
        return {
            list_store: list_store?.map(store => +store?.store_id),
            type: status == TAB_SELL_PRODUCT ? ORDER_STATUS : RETURN_ORDER_STATUS,
            time_from: range_time?.time_from,
            time_type: typeTime,
            time_to: range_time?.time_to,
            template_id: templateId,
            abnormal: abnormal,
            ...(params?.is_old_order ? {
                is_old_order: 1
            } : {})
        }
    }, [list_store, range_time,status, typeTime, params.is_old_order, templateId, abnormal])

    const { data, loading } = useQuery(
        query_cfExportFinanceOrderAggregate,
        {
            variables: {
                ...omitBy(whereCondition, (v) => v == 0 ? v : !v),
                invoice_exported: typeExport
            },
            fetchPolicy: "cache-and-network",
            skip: !valueRangeTime || !list_store?.length
        },
    );


    const [cfExportFinanceOrder, { loading: loadingExport }] = useMutation(mutate_cfExportFinanceOrder,
        {
            variables: { ...omitBy(whereCondition, (v) => v == 0 ? v : !v), invoice_exported: typeExport },
            onCompleted: (data) => {
                if (!!data?.cfExportFinanceOrder?.success) {
                    addToast(formatMessage({ defaultMessage: 'Gửi yêu cầu xuất đơn hàng thành công' }) || formatMessage({ defaultMessage: 'Thành công' }), { appearance: 'success' })
                    history.push(`/finance/exportfile-finance-order?type=${status}`);
                    return
                }
                addToast(data?.cfExportFinanceOrder?.message || formatMessage({ defaultMessage: 'Thất bại' }), { appearance: 'error' })
            },
        }
    );

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

    return (
        <>
            <LoadingDialog show={loadingExport} />
            <Modal
                size="md"
                show={show}
                dialogClassName="modal-export-income"
                aria-labelledby="example-modal-sizes-title-lg"
                centered
                onHide={onHide}
            >
                <Modal.Header style={{ justifyContent: 'center', border: 'none', paddingBottom: 0 }}>
                    <Modal.Title>
                        {formatMessage({ defaultMessage: 'Xuất dữ liệu' })}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default" >
                    <p style={{ fontStyle: 'italic' }} >* {formatMessage({ defaultMessage: 'Thông tin được tải về dưới dạng file excel' })}</p>
                    <div className="col-12" >
                        <div className="row mt-3 display-flex align-items-center " >
                            <div className="col-4" >{formatMessage({ defaultMessage: 'Sàn' })}</div>
                            <div className="col-8 ml-0 pl-0">
                                <Select options={dataStore?.op_connector_channels?.map(_chanel => ({ ..._chanel, label: _chanel.name, value: _chanel.code }))}
                                    className='w-100'
                                    placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                                    isClearable
                                    value={channel}
                                    isLoading={loadingStore}
                                    isMulti
                                    onChange={value => {
                                        console.log('value', value)
                                        setChannel(value)
                                        setStore(null)
                                    }}

                                    styles={{
                                        container: (styles) => ({
                                            ...styles,
                                            zIndex: 9999999
                                        }),
                                    }}
                                    formatOptionLabel={(option, labelMeta) => {
                                        return <div>
                                            {!!option.logo_asset_url && <img src={option.logo_asset_url} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                            {option.label}
                                        </div>
                                    }}
                                />
                            </div>
                        </div>
                        <div className="row mt-3 display-flex align-items-center " >
                            <div className="col-4" >{formatMessage({ defaultMessage: 'Gian hàng' })}</div>
                            <div className="col-8 ml-0 pl-0">
                                <Select
                                    options={dataStore?.sc_stores?.filter(_store => !channel || channel.length == 0 || channel.some(__ch => __ch.value == _store.connector_channel_code)).map(_store => ({ ..._store, chanel: dataStore?.op_connector_channels?.find(__ch => __ch.code == _store.connector_channel_code), label: _store.name, value: _store.id }))}
                                    className='w-100'
                                    placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                                    isClearable
                                    isMulti
                                    value={store}
                                    onChange={value => {
                                        setStore(value)
                                    }}
                                    styles={{
                                        container: (styles) => ({
                                            ...styles,
                                            zIndex: 9999998
                                        }),
                                    }}
                                    formatOptionLabel={(option, labelMeta) => {
                                        return <div>
                                            {!!option.chanel?.logo_asset_url && <img src={option.chanel?.logo_asset_url} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                            {option.label}
                                        </div>
                                    }}
                                />
                            </div>
                        </div>

                        <div className="row mt-4 display-flex align-items-center " >
                            <div className="col-4 m-0 p-0">
                                <Select
                                    options={optionsSearchByTimes}
                                    className="w-100 custom-select-order"
                                    style={{ padding: 0 }}
                                    value={optionsSearchByTimes.find(
                                        (_op) => _op.value == typeTime
                                    )}
                                    onChange={(value) => {
                                        if (!!value) {
                                            setTypeTime(value.value)
                                        }
                                    }}
                                    formatOptionLabel={(option, labelMeta) => {
                                        return <div>{option.label}</div>;
                                    }}
                                />
                            </div>
                            <div className="col-8 ml-0 pl-0">
                                <DateRangePicker
                                    style={{ float: 'right', width: '100%' }}
                                    className="date-range-export-income"
                                    character={' - '}
                                    format={'dd/MM/yyyy'}
                                    value={valueRangeTime}
                                    placeholder={'dd/mm/yyyy - dd/mm/yyyy'}
                                    placement={'auto'}
                                    onChange={values => {
                                        setValueRangeTime(values)
                                    }}
                                    disabledDate={disabledFutureDate}
                                    size='sm'
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
                        </div>
                        {params?.tab != TAB_RETURN_SELL_PRODUCT && (
                            <div className="row mt-3 display-flex align-items-center " >
                                <div className="col-4">
                                    {formatMessage({ defaultMessage: 'Loại tệp dữ liệu' })}
                                    <TooltipWrapper note={formatMessage({ defaultMessage: "Chọn loại tệp dữ liệu theo mẫu bạn muốn xuất." })}>
                                        <i className="fas fa-info-circle fs-14 ml-2"></i>
                                    </TooltipWrapper>
                                </div>

                                <div className="col-8 ml-0 pl-0">
                                    <Select
                                        options={optionsTemplate}
                                        className="w-100 custom-select-order"
                                        style={{ padding: 0 }}
                                        disabled={loadingGetTemplateExport}
                                        value={optionsTemplate.find((_op) => _op.value == templateId)}
                                        onChange={({ value }) => {
                                            if (!!value) {
                                                setTemplateId(value)
                                            } else {
                                                setTemplateId(null)
                                            }

                                        }}
                                        formatOptionLabel={(option, labelMeta) => {
                                            return <div>{option.label}</div>;
                                        }}
                                    />
                                </div>

                            </div>
                        )}

                        <div className="row mt-3 display-flex align-items-center " >
                            <div className="col-4">
                                {formatMessage({ defaultMessage: 'Trạng thái xuất hóa đơn' })}
                            </div>

                            <div className="col-8 ml-0 pl-0">
                                <Select
                                    options={optionsTypeExport}
                                    className="w-100 custom-select-order"
                                    style={{ padding: 0 }}
                                    placeholder={formatMessage({defaultMessage: 'Tất cả'})}
                                    disabled={loadingGetTemplateExport}
                                    isClearable
                                    value={optionsTypeExport.find((_op) => _op?.value == typeExport) || null}
                                    onChange={(option) => {
                                        if (!!option?.value || option?.value == 0) {
                                            setTypeExport(option?.value)
                                        } else {
                                            setTypeExport(null)
                                        }

                                    }}
                                    formatOptionLabel={(option, labelMeta) => {
                                        return <div>{option.label}</div>;
                                    }}
                                />
                            </div>

                        </div>
                        <div className="row mt-3 display-flex align-items-center " >
                            <div className="col-4">
                                {formatMessage({ defaultMessage: 'Loại đơn hàng' })}
                            </div>

                            <div className="col-8 ml-0 pl-0">
                                <Select
                                    options={optionsTypeOrder}
                                    className="w-100 custom-select-order"
                                    style={{ padding: 0 }}
                                    placeholder={formatMessage({defaultMessage: 'Tất cả'})}
                                    isClearable
                                    value={optionsTypeOrder.find((_op) => _op?.value == typeOrder) || null}
                                    onChange={(option) => {
                                        if (!!option?.value || option?.value == 0) {
                                            setTypeOrder(option?.value)
                                        } else {
                                            setTypeOrder(null)
                                        }

                                    }}
                                    formatOptionLabel={(option, labelMeta) => {
                                        return <div>{option.label}</div>;
                                    }}
                                />
                            </div>

                        </div>

                        {(valueRangeTime && list_store?.length) ? (
                            <div className="row mt-4 display-flex align-items-center " >
                                <div className="col-4" >{formatMessage({ defaultMessage: 'Số lượng đơn hàng' })}</div>
                                <div className="col-8" >
                                    <strong>
                                        {loading ? (<span className="ml-3 mr-6 spinner spinner-primary"></span>) : (data?.cfExportFinanceOrderAggregate?.count || 0)}
                                    </strong> {formatMessage({ defaultMessage: 'đơn' })}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </Modal.Body>
                <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
                    <div className="form-group">
                        <button
                            type="button"
                            onClick={onHide}
                            className="btn btn-light btn-elevate mr-3"
                            style={{ width: 100 }}
                        >
                            {formatMessage({ defaultMessage: 'Đóng' })}
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary btn-elevate"
                            style={{ width: 100 }}
                            disabled={loading || !data?.cfExportFinanceOrderAggregate?.count}
                            onClick={async () => await cfExportFinanceOrder()}
                        >
                            {formatMessage({ defaultMessage: 'Xác nhận' })}
                        </button>
                    </div>
                </Modal.Footer>
            </Modal >
        </>
    );
}

export default injectIntl(ExportFinanceOrderDialog);