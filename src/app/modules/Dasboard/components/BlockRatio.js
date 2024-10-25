import { useQuery } from '@apollo/client';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import _ from 'lodash';
import randomColor from 'randomcolor';
import React, { memo, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { useIntl } from 'react-intl';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic';
import { abbrNum, formatNumberToCurrency } from '../../../../utils';
import dayjs from 'dayjs';

ChartJS.register(ArcElement, Tooltip, Legend);
ChartJS.register(ChartDataLabels);

const [COLOR_SHOPEE, COLOR_LAZADA, COLOR_TIKTOK] = [
    ['#FE5629', '#FF7F00', '#FF4500', '#FF8C00', '#EE7600', '#CD6600', '#FFA500', '#EE9A00', '#FF7F50',],
    ['#0a62f3', '#00008B', '#4169E1', '#4876FF', '#436EEE', '#3A5FCD', '#27408B', '#0000FF', '#0000FF', '#000080'],
    ['#323232', '#696969', '#1C1C1C', '#363636', '#4F4F4F', '#828282', '#9C9C9C', '#B5B5B5'],
]

const BlockRatio = ({ loading, data }) => {
    const { formatMessage } = useIntl();
    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    const currentOptions = useMemo(
        () => {
            return dataStore?.sc_stores?.map((_store, index) => {
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
                    default:
                        return randomColor({ luminosity: 'light', count: 100 })[index]
                }

                return {
                    name: _store?.name,
                    channel: _store.connector_channel_code,
                    code: _store?.id,
                    logo: logo_asset_url,
                    color: colorStore
                }
            }) || [];
        }, [dataStore]
    );

    return (
        <div className='mt-8'>
            <div className="d-flex align-items-center">
                <h3 className="txt-title">
                    {formatMessage({ defaultMessage: `Tỷ lệ theo gian hàng` })}
                </h3>
                <span className="ml-3">({formatMessage({ defaultMessage: "Hôm nay đến" })} {dayjs().startOf('hours').format('HH:mm')})</span>
            </div>
            <div className='mt-8 d-flex align-items-center justify-content-center' style={{ gap: 30 }}>
                {currentOptions?.map(_option => (
                    <div className='d-flex align-items-center mb-1'>
                        <span
                            className='mr-1'
                            style={{ backgroundColor: _option?.color, minWidth: 8, height: 8, borderRadius: '50%' }}
                        />
                        {!!_option.logo && <img src={_option.logo} style={{ width: 10, height: 10, marginRight: 2 }} />}
                        <span title={_option.name} className="text-truncate-report" style={{ width: '100%' }}>
                            {_option.name}
                        </span>
                    </div>
                ))}
            </div>
            <div className='row mt-8'>
                {data?.overview_bars?.map((_item) => {
                    let isEmptyData = _item?.data?.every(ii => !ii.value);
                    let mappedValue = currentOptions?.map(
                        _option => {
                            let findedValue = _.find(_item?.data || [], {
                                label: String(_option?.code)
                            });

                            if (findedValue) {
                                let { value } = findedValue;

                                return { ..._option, value }
                            }

                            return { ..._option, value: 0 }
                        }
                    );

                    console.log({ mappedValue })

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
                        <div className='col-4 d-flex justify-content-center'>
                            <div className='row' style={{ width: '85%' }}>
                                <div className='col-12'>
                                    <Doughnut
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

                                                    ctx.save();
                                                    ctx.fillStyle = "#000000";
                                                    ctx.font = "bolder 22px san-serif";
                                                    ctx.textAlign = "center";
                                                    ctx.textBaseline = "middle";
                                                    ctx.fillText(
                                                        abbrNum(_.sum([data?.datasets?.[0]?.data[0], data?.datasets?.[0]?.data[1], data?.datasets?.[0]?.data[2]])),
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
                                                    titleFont: '14px',
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
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
};

export default memo(BlockRatio);