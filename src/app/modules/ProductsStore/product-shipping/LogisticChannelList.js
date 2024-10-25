/*
 * Created by duydatpham@gmail.com on 07/09/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useQuery } from '@apollo/client'
import { Field, useFormikContext } from 'formik'
import React, { memo, useEffect } from 'react'
import query_scGetLogisticChannelByChannel from '../../../../graphql/query_scGetLogisticChannelByChannel'
import { formatNumberToCurrency } from '../../../../utils'
import { Tooltip } from "react-bootstrap";
import { OverlayTrigger } from "react-bootstrap";
import { useProductsUIContext } from '../ProductsUIContext'
import { Switch } from '../../../../_metronic/_partials/controls/forms/Switch'
import _ from 'lodash'
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom'

export default memo(({ channel_code }) => {
    const { formatMessage } = useIntl();
    const { values, setFieldTouched } = useFormikContext()
    const { setLogisticChannels, currentChannel } = useProductsUIContext()
    const { data, loading } = useQuery(query_scGetLogisticChannelByChannel, {
        variables: {
            connector_channel_code: channel_code,
            store_id: currentChannel.value
        },
        fetchPolicy: 'network-only'
    })

    useEffect(() => {
        (data?.scGetLogisticChannel?.logistics || []).forEach(_logisticGroup => {
            if (!_logisticGroup.shop_enabled) {
                setFieldTouched(`channel-logistic-${_logisticGroup.ref_channel_id}`, false)
            }
        });
        setLogisticChannels(prev => {
            return {
                ...prev,
                [channel_code]: data?.scGetLogisticChannel?.logistics
            }
        })
    }, [data?.scGetLogisticChannel, channel_code])

    if (!data?.scGetLogisticChannel?.logistics || data?.scGetLogisticChannel?.logistics?.length == 0 || !data?.scGetLogisticChannel?.logistics?.some(_logisticGroup => !!_logisticGroup.shop_enabled)) {
        if (loading)
            return null;
        return <span>{data?.scGetLogisticChannel?.message || formatMessage({ defaultMessage: "Bạn chưa cài đặt phương thức vận chuyển" })}. {formatMessage({ defaultMessage: 'Kết nối' })} <Link to="/setting/channels"><a href="/setting/channels">{formatMessage({ defaultMessage: 'tại đây' })}</a></Link>.</span >
    }
    return _.sortBy(data?.scGetLogisticChannel?.logistics || [], 'ref_channel_id').map((_logisticGroup, index) => {
        let _volume = (values['width'] || 0) * (values['length'] || 0) * (values['height'] || 0) / (_logisticGroup.ref_channel_id == 5002 ? 4 : 6)
        let isAccept = _logisticGroup.items?.filter(_logistic => !!_logistic.shop_enabled).some(_logistic => {
            return (!_logistic.max_weight || values['weight'] <= _logistic.max_weight)
                && (values['weight'] >= (_logistic.min_weight || 0))
                && (!_volume || (
                    _volume <= _logistic.max_weight
                    && _volume >= 0
                    && (_logistic.max_width == 0 || values['width'] <= _logistic.max_width)
                    && (_logistic.max_length == 0 || values['length'] <= _logistic.max_length)
                    && (_logistic.max_height == 0 || values['height'] <= _logistic.max_height)
                ))
        });
        if (_logisticGroup.items?.length == 0) {
            isAccept = (!_logisticGroup.max_weight || values['weight'] <= _logisticGroup.max_weight)
                && (values['weight'] >= (_logisticGroup.min_weight || 0))
                && (!_volume || (
                    (_logisticGroup.max_weight == 0 || _volume <= _logisticGroup.max_weight)
                    && _volume >= 0
                    && (_logisticGroup.max_width == 0 || values['width'] <= _logisticGroup.max_width)
                    && (_logisticGroup.max_length == 0 || values['length'] <= _logisticGroup.max_length)
                    && (_logisticGroup.max_height == 0 || values['height'] <= _logisticGroup.max_height)
                ))
        }

        if (!_logisticGroup.shop_enabled) {
            return null
        }

        return <div key={`_logistic--${channel_code}-${index}`} className="row">
            <label className="col-6 col-form-label">{_logisticGroup.channel_name} ({formatMessage({ defaultMessage: `Tối đa {max}g` }, { max: formatNumberToCurrency(_logisticGroup.max_weight) })})</label>
            <div className="col-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} >
                <span style={{ textAlign: 'end', verticalAlign: 'middle' }}>
                    {
                        !isAccept ? <span style={{ marginBottom: 2 }} >{formatMessage({ defaultMessage: 'Đơn vị vận chuyển không được hỗ trợ' })}&ensp;&ensp;</span> : ''
                    }
                    {
                        isAccept ? <i className="far fa-check-circle text-success"></i> : <i className="far fa-times-circle text-danger"></i>
                    }
                    &ensp;&ensp;
                </span>
                <div style={{ minWidth: 56 }}>
                    <Field
                        name={`channel-logistic-${_logisticGroup.ref_channel_id}`}
                        component={Switch}
                        disabled={!isAccept}
                    />
                </div>
            </div>
        </div>

        return <div key={`row-_logistic-${channel_code}-${index}`}
            style={{
                backgroundColor: '#F7F7FA', marginBottom: 2, display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                padding: 8
            }}  >
            <span >
                {_logisticGroup.channel_name}
            </span>
            {/* <td style={{ textAlign: 'center' }}>
                {_logistic.max_height == 0 ? `Không giới hạn` : `${formatNumberToCurrency(_logistic.max_height)}cm`}
            </td>
            <td style={{ textAlign: 'center' }}>
                {_logistic.max_width == 0 ? `Không giới hạn` : `${formatNumberToCurrency(_logistic.max_width)}cm`}
            </td>
            <td style={{ textAlign: 'center' }}>
                {_logistic.max_length == 0 ? `Không giới hạn` : `${formatNumberToCurrency(_logistic.max_length)}cm`}
            </td>
            <td style={{ textAlign: 'center' }}>
                {_logistic.min_weight == 0 ? `Không giới hạn` : `${formatNumberToCurrency(_logistic.min_weight)}g`}
            </td>
            <td style={{ textAlign: 'center' }}>
                {_logistic.max_weight == 0 ? `Không giới hạn` : `${formatNumberToCurrency(_logistic.max_weight)}g`}
            </td> */}
            <span style={{ textAlign: 'end', verticalAlign: 'middle' }}>
                {
                    !isAccept ? <span style={{ marginBottom: 2 }} >Đơn vị vận chuyển không được hỗ trợ&ensp;&ensp;</span> : ''
                }
                {
                    isAccept ? <i className="far fa-check-circle text-success"></i> : <i className="far fa-times-circle text-danger"></i>
                }

            </span>
        </div>
    })
})