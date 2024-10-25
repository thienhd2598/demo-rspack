import React, { memo, useState, useCallback, useMemo } from 'react';
import {
    Card,
    CardBody
} from "../../../../../_metronic/_partials/controls";
import DateRangePicker from 'rsuite/DateRangePicker';
import _ from 'lodash';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import { startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import { useQuery } from "@apollo/client";
import query_report_bars from '../../../../../graphql/query_report_bars';
import queryString from 'querystring';
import { useLocation, useHistory } from "react-router-dom";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import { abbrNum, formatNumberToCurrency } from '../../../../../utils';
import randomColor from 'randomcolor';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useIntl, FormattedMessage } from 'react-intl';

ChartJS.register(ArcElement, Tooltip, Legend);
ChartJS.register(ChartDataLabels);

const optionsSelect = [
    { value: 'channel', title: <FormattedMessage defaultMessage='Tỷ lệ theo sàn' /> },
    { value: 'store', title: <FormattedMessage defaultMessage='Tỷ lệ theo gian hàng' /> },
];

const [COLOR_SHOPEE, COLOR_LAZADA, COLOR_TIKTOK, COLOR_OTHER] = [
    ['#FE5629', '#FF7F00', '#FF4500', '#FF8C00', '#EE7600', '#CD6600', '#FFA500', '#EE9A00', '#FF7F50',],
    ['#0a62f3', '#00008B', '#4169E1', '#4876FF', '#436EEE', '#3A5FCD', '#27408B', '#0000FF', '#0000FF', '#000080'],
    ['#323232', '#696969', '#1C1C1C', '#363636', '#4F4F4F', '#828282', '#9C9C9C', '#B5B5B5'],
    ['#316424','#4a8a33', '#62b049', '#83c76e', '#a2d98a', '#c1ecaa']
]

export default memo(({ variables }) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const currentTypeBar = params?.type_bar || 'channel';

    const source = useMemo(
        () => {
            try {
                if (params?.source) {
                    return {
                        source: params?.source
                    }
                }
                return {}
            } catch (error) {
                return {}
            }
        }, [params?.source]
    )

    const { data: dataReportBars, loading: loadingReportBars } = useQuery(query_report_bars, {
        variables: {
            ...variables,
            ...source,
            type: currentTypeBar,
            last_type: params?.type_filter || 'today'
        },
        fetchPolicy: 'cache-and-network'
    });    

    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        variables: {
            context: 'order',
            context_channel: 'order'
        },
        fetchPolicy: 'cache-and-network'
    });

    const currentOptions = useMemo(
        () => {
            let options = [];
            let COLOR_CHANNEL = {
                'shopee': '#FE5629',
                'lazada': '#0a62f3',
                'tiktok': '#323232',
                'other': '#62b049'
            }
            let channelIds = params?.channel?.length > 0 ? params?.channel?.split(',') : [];
            let storeIds = params?.store?.length > 0 ? params?.store?.split(',') : [];

            if (currentTypeBar === 'channel') {
                options = dataStore?.op_connector_channels
                    ?.filter(_channel => {
                        if (channelIds?.length > 0) {
                            return channelIds?.some(_channelId => _channelId == _channel?.code)
                        }
                        return true;
                    })
                    ?.map(_channel => ({
                        name: _channel?.name,
                        channel: _channel?.code,
                        code: _channel?.code,
                        logo: _channel?.logo_asset_url,
                        color: COLOR_CHANNEL[_channel?.code]
                    })) || [];
            }

            if (currentTypeBar === 'store') {
                options = dataStore?.sc_stores
                    ?.filter(_store => {
                        if (channelIds?.length > 0) {
                            return channelIds?.some(_channel => _channel == _store?.connector_channel_code)
                        }
                        return true;
                    })
                    ?.filter(_store => {

                        if (storeIds?.length > 0) {
                            return storeIds?.some(_storeId => Number(_storeId) == _store?.id)
                        }
                        return true;
                    })
                    ?.map((_store, index) => {
                        let { logo_asset_url } = _.find(dataStore?.op_connector_channels, { code: _store.connector_channel_code }) || ''
                        let colorStore = '';
                        switch (_store.connector_channel_code) {
                            case 'shopee':
                                colorStore = COLOR_SHOPEE[index] || COLOR_SHOPEE[0];
                                break;
                            case 'lazada':
                                colorStore = COLOR_LAZADA[index] || COLOR_LAZADA[0];
                                break;
                            case 'tiktok':
                                colorStore = COLOR_TIKTOK[index] || COLOR_TIKTOK[0];
                                break;
                            case 'other':
                                colorStore = COLOR_OTHER[index] || COLOR_OTHER[0];
                                break;
                            default:
                                colorStore = randomColor({ luminosity: 'light', count: 100 })[index]
                        }

                        return {
                            name: _store?.name,
                            channel: _store.connector_channel_code,
                            code: _store?.id,
                            logo: logo_asset_url,
                            color: colorStore
                        }
                    }) || [];
            };

            return options;
        }, [dataStore, currentTypeBar, params?.channel, params?.store]
    );

    console.log({
        report_bars: dataReportBars?.report_bars
    })

    return (
        <Card>
            <CardBody>
                <ul className='nav nav-tabs d-flex align-items-center mb-12'>
                    {optionsSelect?.map(
                        (_option, index) => (
                            <li
                                key={`option-pie-chart-${index}`}
                                className={`${currentTypeBar === _option.value ? 'nav-item text-primary' : ''}`}
                                style={{ cursor: 'pointer', marginTop: 0 }}
                                onClick={() => {
                                    history.push(`/report/overview?${queryString.stringify({
                                        ...params,
                                        type_bar: _option?.value || ''
                                    })}`)
                                }}
                            >
                                <a className={`nav-link ${currentTypeBar === _option.value ? 'active' : ''}`}>
                                    {_option.title}
                                </a>

                            </li>
                        )
                    )}
                </ul>
                <div className='mt-8 d-flex align-items-center justify-content-center' style={{ gap: 30 }}>
                    {currentOptions?.map(_option => (
                        <div className='d-flex align-items-center mb-1'>
                            <span
                                className='mr-2'
                                style={{ backgroundColor: _option?.color, minWidth: 10, height: 10, borderRadius: '50%' }}
                            />
                            {!!_option.logo && <img src={_option.logo} style={{ width: 12, height: 12, marginRight: 2 }} />}
                            <span title={_option.name} className="text-truncate-report" style={{ width: '100%' }}>
                                {_option.name}
                            </span>
                        </div>
                    ))}
                </div>
                <div className='mt-8 row d-flex' style={{ minHeight: 200 }}>
                    {loadingReportBars && (
                        <div className='text-center w-100 mt-6 mb-15' style={{ position: 'absolute' }} >
                            <span className="ml-3 spinner spinner-primary"></span>
                        </div>
                    )}
                    {!loadingReportBars && dataReportBars?.report_bars?.map(_item => {
                        let isEmptyData = _item?.data?.every(ii => !ii.value);
                        let filteredLabels = [
                            ..._.filter(currentOptions, { channel: 'shopee' }),
                            ..._.filter(currentOptions, { channel: 'lazada' }),
                            ..._.filter(currentOptions, { channel: 'tiktok' }),
                        ];

                        let labels = filteredLabels?.map(
                            _option => (
                                <>
                                    <span
                                        className='mr-1'
                                        style={{ backgroundColor: _option?.color, minWidth: 8, height: 8, borderRadius: '50%' }}
                                    />
                                    {!!_option.logo && <img src={_option.logo} style={{ width: 10, height: 10, marginRight: 2 }} />}
                                    <span className="text-truncate-report" style={{ width: filteredLabels?.length > 1 ? '100%' : 'unset' }}>
                                        {_option.name}
                                    </span>
                                    {/* </span> */}
                                </>
                            )
                        );

                        let mappedValue = currentOptions?.map(
                            _option => {
                                let findedValue = _.find(_item?.data || [], {
                                    label: currentTypeBar == 'channel' ? _option?.code : String(_option?.code)
                                });

                                if (findedValue) {
                                    let { value } = findedValue;

                                    return { ..._option, value }
                                }

                                return { ..._option, value: 0 }
                            }
                        );

                        if (isEmptyData) {
                            return (
                                <div className='col-4 d-flex  align-items-center justify-content-center'>
                                    <div className='d-flex flex-column align-items-center justify-content-center mt-10 mb-25'>
                                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                        <span className='mt-4'>{formatMessage({ defaultMessage: "Chưa có thông tin tỷ lệ" })} <span style={{ textTransform: 'lowercase' }}>{_item?.title}</span></span>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div className='col-4'>
                                <Doughnut
                                    style={{ maxHeight: 350 }}
                                    data={{
                                        labels: mappedValue?.map(_value => _value.name),
                                        datasets: [
                                            {
                                                label: mappedValue?.map(_value => _value.name),
                                                data: mappedValue?.map(_value => _value.value),
                                                backgroundColor: mappedValue?.map(_value => _value.color),
                                                borderColor: mappedValue?.map(_value => _value.color),
                                                borderWidth: 1,
                                            },
                                        ],
                                    }}
                                    plugins={[
                                        {
                                            id: 'textCenter',
                                            beforeDatasetDraw(chart, args, pluginOptions) {
                                                const { ctx, data } = chart;
                                                const sumArrays = data?.datasets?.[0]?.data
                                                ctx.save();
                                                ctx.fillStyle = "#000000";
                                                ctx.font = "bolder 24px san-serif";
                                                ctx.textAlign = "center";
                                                ctx.textBaseline = "middle";
                                                ctx.fillText(
                                                    abbrNum(_.sum(sumArrays)),
                                                    chart?.getDatasetMeta(0)?.data?.[0]?.x,
                                                    chart?.getDatasetMeta(0)?.data?.[0]?.y
                                                )
                                            }
                                        }
                                    ]}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            title: {
                                                display: true,
                                                text: _item?.title,
                                                color: '#000000',
                                                font: {
                                                    size: 14,                                                    
                                                },
                                                position: 'bottom',
                                            },
                                            legend: {
                                                display: false,
                                            },
                                            datalabels: {
                                                // backgroundColor: function(context) {
                                                //   return context.dataset.backgroundColor;
                                                // },
                                                formatter: (val, context) => {
                                                    var label = context.label || '';
                                                    let total = _.reduce(context.dataset.data, (sum, n) => sum + n, 0);
                                                    let percentData = ((context.dataset.data[context.dataIndex] / total) * 100).toFixed(2);

                                                    if (Number(percentData).toFixed() > 5) {
                                                        label += `${percentData}%`;
                                                    } else {
                                                        label += '';
                                                    }
                                                    return label;
                                                },
                                                borderRadius: 25,
                                                borderWidth: 3,
                                                color: "#fff",
                                                font: {
                                                    weight: "bold"
                                                },
                                                padding: 6
                                            },
                                            tooltip: {
                                                // enabled: false,`
                                                callbacks: {
                                                    label: function (context) {
                                                        var label = context.label || '';
                                                        let total = _.reduce(context.dataset.data, (sum, n) => sum + n, 0);
                                                        let percentData = ((context.dataset.data[context.dataIndex] / total) * 100).toFixed(2);

                                                        label += `: ${formatNumberToCurrency(context.raw)} (${percentData}%)`;
                                                        return label;
                                                    }
                                                }
                                            },
                                        },
                                    }}
                                />
                                {/* <div
                                    className='row d-flex align-items-center justify-content-center mt-4 ml-0 mr-0'
                                    style={{ flexWrap: 'wrap', gap: '5px 0px', width: labels?.length > 1 ? '100%' : 'unset' }}
                                >
                                    {labels?.map(_label => <span className={`${labels?.length > 1 ? 'col-6' : 'col-12 justify-content-center'} d-flex align-items-center`}>
                                        {_label}
                                    </span>)}
                                </div> */}
                            </div>
                        )
                    })}
                </div>
            </CardBody>
        </Card>
    )
});