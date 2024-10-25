import { useMutation, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { omitBy } from "lodash";
import React, { useCallback, useMemo, useState } from "react";
import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { injectIntl, useIntl } from "react-intl";
import { useHistory } from "react-router";
import Select from "react-select";
import makeAnimated from 'react-select/animated';
import { useToasts } from "react-toast-notifications";
import DateRangePicker from 'rsuite/DateRangePicker';
import LoadingDialog from "../../../ProductsStore/product-new/LoadingDialog";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import mutate_crmExportCustomer from "../../../../../graphql/mutate_crmExportCustomer";
import query_crmExportCustomerAggregate from "../../../../../graphql/query_crmExportCustomerAggregate";

const animatedComponents = makeAnimated();

function ExportCustomerDialog({ show, onHide, optionsTags, optionsChannelCode }) {
    const { formatMessage } = useIntl()
    const history = useHistory();
    const { addToast } = useToasts();
    const { combine, allowedMaxDays, afterToday } = DateRangePicker;    

    const [channel, setChannel] = useState();
    const [store, setStore] = useState();
    const [tags, setTags] = useState();
    const [valueRangeTime, setValueRangeTime] = useState(null);

    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    useMemo(() => {
        if (!!show) {
            setValueRangeTime([
                new Date(dayjs().subtract(6, "day").startOf("day")),
                new Date(dayjs().startOf("day")),
            ]);
        }
    }, [show]);

    const range_time = useMemo(() => {
        if (valueRangeTime) {
            return [
                dayjs(valueRangeTime[0])
                    .startOf("day")
                    .unix(),
                dayjs(valueRangeTime[1])
                    .endOf("day")
                    .unix(),
            ]
        }
    }, [valueRangeTime])

    const list_store = useMemo(() => {
        if (!store?.length) return null;

        return store?.map(st => {
            return !!st ? {
                connector_channel_code: st?.connector_channel_code,
                name_store: st?.name,
                store_id: st?.id
            } : {}
        })
    }, [store, channel])

    const whereCondition = useMemo(() => {
        return {
            list_channel: channel?.length > 0
                ? channel?.map(channel => channel?.value)
                : optionsChannelCode?.map(cn => cn?.value),
            list_store: list_store?.map(store => +store?.store_id),
            list_tag: tags?.length > 0 ? tags?.map(tag => tag?.value) : null,
            range_time: range_time,
        }
    }, [list_store, range_time, channel, tags, dataStore, optionsTags])

    const { data, loading } = useQuery(query_crmExportCustomerAggregate, {
        variables: {
            ...omitBy(whereCondition, (v) => v == 0 ? v : !v)
        },
        fetchPolicy: "cache-and-network",
        skip: !valueRangeTime
    },
    );


    const [crmExportCustomer, { loading: loadingExport }] = useMutation(mutate_crmExportCustomer,
        {
            variables: { ...omitBy(whereCondition, (v) => v == 0 ? v : !v) },
            onCompleted: (data) => {
                if (!!data?.crmExportCustomer?.success) {
                    addToast(formatMessage({ defaultMessage: 'Gửi yêu cầu xuất file khách hàng thành công' }), { appearance: 'success' })
                    history.push('/customer-service/export-histories')
                } else {
                    addToast(data?.crmExportCustomer?.message || formatMessage({ defaultMessage: 'Thất bại' }), { appearance: 'error' })
                    onHide();
                }
            },
        }
    );

    const disabledFutureDate = useCallback((date) => {
        const unixDate = dayjs(date).unix();
        const today = dayjs().startOf('day').add(1, 'day').unix();

        return unixDate >= today;
    }, []);

    return (
        <>
            <LoadingDialog show={loadingExport} />
            {!loadingExport && <Modal
                size="md"
                show={show}
                dialogClassName="modal-export-income"
                aria-labelledby="example-modal-sizes-title-lg"
                centered
                onHide={onHide}
            >
                <Modal.Header style={{ justifyContent: 'center', border: 'none', paddingBottom: 0 }}>
                    <Modal.Title>
                        {formatMessage({ defaultMessage: 'Xuất thông tin khách hàng' })}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default" >
                    <p style={{ fontStyle: 'italic' }} >* {formatMessage({ defaultMessage: 'Thông tin được tải về dưới dạng file excel' })}</p>
                    <div className="col-12" >
                        <div className="row mt-3 display-flex align-items-center " >
                            <div className="col-4" >{formatMessage({ defaultMessage: 'Kênh bán' })}</div>
                            <div className="col-8 ml-0 pl-0">
                                <Select
                                    options={optionsChannelCode}
                                    className='w-100'
                                    placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                                    isClearable
                                    value={channel}
                                    isLoading={loadingStore}
                                    isMulti
                                    onChange={value => {
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
                                        return <div className="d-flex align-items-center">
                                            {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
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
                                    placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
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
                                        return <div className="d-flex align-items-center">
                                            {!!option.chanel?.logo_asset_url && <img src={option.chanel?.logo_asset_url} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                            {option.label}
                                        </div>
                                    }}
                                />
                            </div>
                        </div>
                        <div className="row mt-3 display-flex align-items-center " >
                            <div className="col-4" >{formatMessage({ defaultMessage: 'Tag khách hàng' })}</div>
                            <div className="col-8 ml-0 pl-0">
                                <Select
                                    options={optionsTags}
                                    className='w-100 select-report-custom'
                                    placeholder={formatMessage({ defaultMessage: 'Chọn tag khách hàng' })}
                                    components={animatedComponents}
                                    isClearable
                                    styles={{
                                        container: (styles) => ({
                                            ...styles,
                                            zIndex: 9999997
                                        }),
                                    }}
                                    isMulti
                                    isLoading={false}
                                    onChange={values => {
                                        setTags(values);
                                    }}
                                    formatOptionLabel={(option, labelMeta) => {
                                        return <div className='d-flex align-items-center'>
                                            {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 8 }} />}
                                            <span>{option.label}</span>
                                        </div>
                                    }}
                                />
                            </div>
                        </div>

                        <div className="row mt-3 display-flex align-items-center " >
                            <div className="col-4">
                                <span>{formatMessage({ defaultMessage: 'Thời gian cập nhật' })}</span>
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip>
                                            {formatMessage({ defaultMessage: 'Thời gian cập nhật khách hàng lên hệ thống' })}
                                        </Tooltip>
                                    }
                                >
                                    <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                        <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                        </svg>
                                    </span>
                                </OverlayTrigger>
                            </div>
                            <div className="col-8 ml-0 pl-0">
                                <DateRangePicker
                                    style={{ float: 'right', width: '100%' }}
                                    character={' - '}
                                    format={'dd/MM/yyyy'}
                                    value={valueRangeTime}
                                    placeholder={'dd/mm/yyyy - dd/mm/yyyy'}
                                    placement={'auto'}
                                    onChange={values => {
                                        setValueRangeTime(values)
                                    }}
                                    disabledDate={combine(allowedMaxDays(365), afterToday())}
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
                        {!!valueRangeTime && <div className="row mt-4 display-flex align-items-center ">
                            <div className="col-4" >{formatMessage({ defaultMessage: 'Tổng khách hàng đã chọn' })}</div>
                            <div className="col-8" >
                                <strong>
                                    {loading ? (<span className="ml-3 mr-6 spinner spinner-primary"></span>) : (data?.crmExportCustomerAggregate?.count || 0)}
                                </strong>
                            </div>
                        </div>}
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
                            disabled={loading || !data?.crmExportCustomerAggregate?.count}
                            onClick={async () => await crmExportCustomer()}
                        >
                            {formatMessage({ defaultMessage: 'Xác nhận' })}
                        </button>
                    </div>
                </Modal.Footer>
            </Modal >}
        </>
    );
}

export default injectIntl(ExportCustomerDialog);
