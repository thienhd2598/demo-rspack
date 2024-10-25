import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import {
    Card,
    CardBody,
} from "../../../../../_metronic/_partials/controls";
import Select from "react-select";
import _ from 'lodash';
import queryString from 'querystring';
import { useLocation, useHistory } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import op_connector_channels from "../../../../../graphql/op_connector_channels";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import FilterCalendar from './FilterCalendar';
import makeAnimated from 'react-select/animated';
import { useIntl, FormattedMessage } from 'react-intl';
import DateRangePicker from 'rsuite/DateRangePicker';
import dayjs from 'dayjs';
import { predefinedRanges } from '../../ReportUIHelper';
import { useToasts } from 'react-toast-notifications';
import { saveAs } from 'file-saver';
import mutate_report_chartsExport from '../../../../../graphql/mutate_report_chartsExport';
import { map } from 'lodash';

const animatedComponents = makeAnimated();
const OPTIONS_STATUS_ORDER = [
    { value: 0, label: <FormattedMessage defaultMessage='Tất cả' /> },
    { value: 1, label: <FormattedMessage defaultMessage='Đã thanh toán' /> },
    { value: 2, label: <FormattedMessage defaultMessage='Hoàn thành' /> },
    { value: 3, label: <FormattedMessage defaultMessage='Đơn đã xác nhận' /> },
];

const OPTIONs_SOURCE = [
    { value: 'platform', label: <FormattedMessage defaultMessage='Đơn từ sàn' /> },
    { value: 'manual', label: <FormattedMessage defaultMessage='Đơn thủ công' /> },
    { value: 'pos', label: <FormattedMessage defaultMessage='Đơn POS' /> },
];

export default memo(({ visible, variables }) => {
    const { formatMessage } = useIntl();
    const [collapse, setCollapse] = useState(true)
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const [valueRangeTime, setValueRangeTime] = useState([])
    const { addToast } = useToasts()
    const { data: dataChannel, loading: loadingChannel } = useQuery(op_connector_channels);
    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        variables: {
            context: 'order',
            context_channel: 'order'
        },
        fetchPolicy: 'cache-and-network'
    });

    const type_date = useMemo(
        () => {
            try {
                let type = params?.type || 'hours'

                return { type }
            } catch (error) {
                return {}
            }
        }, [params.type]
    );

    const [reportChartExport, { loading: loadingReportChartExport }] = useMutation(mutate_report_chartsExport);

    const currentStatus = useMemo(
        () => {
            if (!params?.status) return OPTIONS_STATUS_ORDER[0];

            let findedStatusOrder = OPTIONS_STATUS_ORDER?.find(
                _status => _status.value == Number(params?.status)
            );

            return findedStatusOrder;
        }, [params?.status, OPTIONS_STATUS_ORDER]
    );

    const [currentValueChannel, optionsChannel] = useMemo(
        () => {
            let _options = [{
                label: formatMessage({ defaultMessage: 'Tất cả' }),
                value: '',
                logo: ''
            }].concat(dataChannel?.op_connector_channels?.map(
                _channel => ({
                    label: _channel?.name,
                    logo: _channel?.logo_asset_url,
                    value: _channel?.code
                })
            ) || []);

            let _current = !!params?.channel
                ? _options?.filter(
                    _channel => !!_channel?.value && params?.channel?.split(',').some(_param => _param == _channel.value)
                )
                : [{
                    label: formatMessage({ defaultMessage: 'Tất cả' }),
                    value: '',
                    logo: ''
                }];

            return [_current, _options];
        }, [dataChannel, params?.channel]
    );

    const [currentStore, optionsStore] = useMemo(() => {
        let _options = [{
            label: formatMessage({ defaultMessage: 'Tất cả' }),
            value: '',
            logo: ''
        }].concat(dataStore?.sc_stores?.filter(_store => !!currentValueChannel && currentValueChannel?.some(ii => ii.value == _store.connector_channel_code || !ii.value))
            ?.map(_store => {
                let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
                return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
            }) || []);

        let _current = !!params?.store
            ? _options.filter(_store => !!_store?.value && params?.store?.split(',').some(_param => _param == _store.value))
            : [{
                label: formatMessage({ defaultMessage: 'Tất cả' }),
                value: '',
                logo: ''
            }];

        return [_current, _options]
    }, [dataStore, params, currentValueChannel]);
    const currentSource = useMemo(() => {
        let _current = !!params?.source
            ? OPTIONs_SOURCE?.filter(
                _source => !!_source?.value && params?.source?.split(',').some(_param => _param == _source.value)
            )
            : undefined;

        return _current
    }, [params?.source, OPTIONs_SOURCE]);

    const checkedMoreStore = useMemo(
        () => {
            if (currentStore?.length > 4) {
                return true;
            }

            return false;
        }, [currentStore]
    );
    
    const onChangeOptions = useCallback(
        (type, value) => {
            let paramsValue = {};
            let currentValue = {
                'channel': currentValueChannel,
                'store': currentStore
            }
            let checkedEmptyCurrentValue = currentValue[type]?.every(_current => !!value && !_current?.value);

            if (!!value) {
                let checkedEmptyValueMultilSelect = Array.isArray(value) && value?.length == 0;

                paramsValue = {
                    ...paramsValue,
                    ...((checkedEmptyValueMultilSelect || type === "channel") ? {
                        store: undefined
                    } : {}),
                    [type]: checkedEmptyCurrentValue
                        ? value.value
                        : _.map(
                            _.filter(value, _current => !!_current.value),
                            'value'
                        ).join(',')
                }
            } else {
                paramsValue = {
                    ...paramsValue,
                    ...(type === 'channel' ? {
                        channel: undefined,
                    } : {}),
                    store: undefined
                }
            }

            history.push(`/report/overview?${queryString.stringify({
                ...params,
                ...paramsValue
            })}`);

        }, [currentValueChannel, params, currentStore]
    );

    const disabledFutureDate = (date) => {
        const unixDate = dayjs(date).unix();
        const today = dayjs().startOf('day').add(1, 'day').unix();

        return unixDate >= today;
    }


    useMemo(
        () => { 
            if(params?.from && params?.to) {
                setValueRangeTime([new Date(params?.from*1000), new Date(params?.to*1000)])
            } else {
                setValueRangeTime([dayjs().startOf('day').toDate(), dayjs().endOf('day').toDate()])
            }
        }, [params?.to, params?.from]
    )
    const onExportFinanceReport = useCallback(async () => {
        try {
            const { data } = await reportChartExport({
                variables: {
                    ...variables,
                    ...type_date,
                    last_type: params?.type_filter || 'today'
                }
            });

            if (!!data?.report_chartsExport?.success) {
                const nameFileExport = `Baocaotongquan_${dayjs(valueRangeTime[0]).format('DD/MM/YYYY').replaceAll('/', '')}_${dayjs(valueRangeTime[1]).format('DD/MM/YYYY').replaceAll('/', '')}.xlsx`;
                saveAs(data?.report_chartsExport?.data, nameFileExport)
                addToast(formatMessage({ defaultMessage: 'Xuất file thành công' }), {
                    appearance: "success",
                });
            } else {
                addToast(formatMessage({ defaultMessage: 'Xuất file thất bại' }), {
                    appearance: "error",
                });
            }
        } catch (err) {
            addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), {
                appearance: "error",
            });
        }
    }, [variables, params, type_date])

    return (
        <Card>
            <CardBody>
                <div className={`row align-items-center justify-content-between ${!visible ? 'filter-report-fixed-top' : ''}`}>
                    <div className='col-12'>
                        <div className='row'>
                            <div className={checkedMoreStore ? 'col-6' : 'col-4'}>
                                <div className='d-flex align-items-center'>
                                    <div className='col-3 p-0' style={{ textAlign: 'end'}}>
                                        <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Thời gian' })}</span>
                                    </div>
                                    {/* <FilterCalendar /> */}
                                    <DateRangePicker 
                                        character={" - "}
                                        className='w-100 custom-range-picker'
                                        format={"dd/MM/yyyy"}
                                        value={valueRangeTime}
                                        style={{color: '#ff5629 !important'}}
                                        disabledDate={disabledFutureDate}
                                        placeholder={"dd/mm/yyyy - dd/mm/yyyy"}
                                        onClean={() => {
                                            setValueRangeTime([dayjs().startOf('day').toDate(), dayjs().endOf('day').toDate()])
                                        }}
                                        onChange={(values) => {
                                            let queryParams = {};
                                            setValueRangeTime(values);
                                            const todayStart = dayjs().startOf('day').unix();
                                            
                                            if (!!values && (dayjs(values[0]).startOf("day").unix() !== todayStart)) {
                                                let dateRange = dayjs(values[1]).diff(dayjs(values[0]), 'day');
                                                let type;
                                                let type_filter;
                                                let type_filter_option;
                                                let [ltCreateTime, gtCreateTime] = [dayjs(values[0]).startOf("day").unix(),dayjs(values[1]).endOf("day").unix()];

                                                queryParams = {...params, from: ltCreateTime,to: gtCreateTime, type, type_filter, type_filter_option};
                                            } else {
                                                queryParams = _.omit({ ...params }, ["to", "from", 'type', 'type_filter', 'type_filter_option']);
                                            }

                                            history.push(`/report/overview?${queryString.stringify(queryParams)}`);
                                        }}
                                        ranges={predefinedRanges}
                                        locale={{
                                            sunday: "CN",
                                            monday: "T2",
                                            tuesday: "T3",
                                            wednesday: "T4",
                                            thursday: "T5",
                                            friday: "T6",
                                            saturday: "T7",
                                            ok: formatMessage({ defaultMessage: "Đồng ý" }),
                                            today: formatMessage({ defaultMessage: "Hôm nay" }),
                                            yesterday: formatMessage({ defaultMessage: "Hôm qua" }),
                                            hours: formatMessage({ defaultMessage: "Giờ" }),
                                            minutes: formatMessage({ defaultMessage: "Phút" }),
                                            seconds: formatMessage({ defaultMessage: "Giây" }),
                                            formattedMonthPattern: "MM/yyyy",
                                            formattedDayPattern: "dd/MM/yyyy",
                                            last7Days: formatMessage({ defaultMessage: "7 ngày qua" }),
                                            last30Days: formatMessage({ defaultMessage: "30 ngày qua" })
                                        }}
                                    />      
                                </div>
                            </div>
                            <div className={checkedMoreStore ? 'col-5' : 'col-3'} style={{ zIndex: 9 }}>
                                <div className='d-flex align-items-center'>
                                    <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Sàn' })}</span>
                                    <Select
                                        options={optionsChannel}
                                        className='w-100 select-report-custom'
                                        placeholder='Sàn'
                                        components={animatedComponents}
                                        isClearable
                                        isMulti={currentValueChannel?.every(_channel => !_channel?.value) ? false : true}
                                        value={currentValueChannel}
                                        isLoading={loadingChannel}
                                        onChange={value => onChangeOptions('channel', value)}
                                        formatOptionLabel={(option, labelMeta) => {
                                            return <div>
                                                {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                                {option.label}
                                            </div>
                                        }}
                                    />
                                </div>
                            </div>
                            <div className={checkedMoreStore ? 'col-12 mt-4' : 'col-4'}>
                                <div className='d-flex align-items-center'>
                                    <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Gian hàng' })}</span>
                                    <Select
                                        value={currentStore?.map(
                                            _store => {
                                                let { label } = _store;
                                                let labelStore = label?.length < 10 ? label : `${label?.slice(0, 10)}...`;

                                                return {
                                                    ..._store,
                                                    label: labelStore
                                                }
                                            }
                                        )}
                                        options={optionsStore}
                                        components={animatedComponents}
                                        isMulti={currentStore?.every(_store => !_store?.value) ? false : true}
                                        className='w-100 select-report-custom'
                                        placeholder={formatMessage({ defaultMessage: 'Gian hàng' })}
                                        isClearable
                                        isLoading={loadingStore}
                                        onChange={value => onChangeOptions('store', value)}
                                        formatOptionLabel={(option, labelMeta) => {
                                            return <div>
                                                {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                                {option.label}
                                            </div>
                                        }}
                                    />
                                </div>
                            </div>
                            <div className='col-1 d-flex'>
                                <button
                                    type="submit"
                                    className="w-100 btn btn-primary btn-elevate"
                                    onClick={onExportFinanceReport}
                                >
                                    {formatMessage({ defaultMessage: 'Xuất file' })}
                                </button>
                            </div>
                        </div>
                        <div className='row mt-4'>
                            <div className='col-4'>
                                <div className='d-flex align-items-center'>
                                    <div className='col-3 p-0' style={{ textAlign: 'end'}}>
                                        <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Nguồn phát sinh' })}</span>
                                    </div>
                                    <Select
                                        value={currentSource}
                                        options={OPTIONs_SOURCE}
                                        components={animatedComponents}
                                        isMulti
                                        className='w-100 select-report-custom'
                                        placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                                        isClearable
                                        onChange={values => {
                                            const source = values?.length > 0
                                                ? map(values, 'value')?.join(',')
                                                : undefined;
            
                                            history.push(`/report/overview?${queryString.stringify({
                                                ...params,
                                                source: source,
                                            })}`.replaceAll('%2C', '\,'))
                                        }}
                                        formatOptionLabel={(option, labelMeta) => {
                                            return <div>
                                                {option.label}
                                            </div>
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
});
