/*
 * Created by duydatpham@gmail.com on 07/09/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useQuery } from '@apollo/client'
import { useFormikContext } from 'formik'
import React, { memo, useEffect } from 'react'
import query_scGetLogisticChannelByChannel from '../../../../graphql/query_scGetLogisticChannelByChannel'
import { formatNumberToCurrency } from '../../../../utils'
import { Tooltip } from "react-bootstrap";
import { OverlayTrigger } from "react-bootstrap";
import { useProductsUIContext } from '../ProductsUIContext'
import { useIntl } from 'react-intl'

export default memo(({ channel_code, requiredSize }) => {
    const { formatMessage } = useIntl();
    const { values } = useFormikContext()
    const { setLogisticChannels, currentChannel } = useProductsUIContext()
    const { data } = useQuery(query_scGetLogisticChannelByChannel, {
        variables: {
            connector_channel_code: channel_code,
            store_id: currentChannel.value
        },
        fetchPolicy: 'cache-and-network'
    })

    useEffect(() => {
        setLogisticChannels(prev => {
            return {
                ...prev,
                [channel_code]: data?.scGetLogisticChannel?.logistics
            }
        })
    }, [data?.scGetLogisticChannel, channel_code])

    if (!data?.scGetLogisticChannel?.logistics || data?.scGetLogisticChannel?.logistics.length == 0) {
        return null;
    }
    return data?.scGetLogisticChannel?.logistics?.map((_logisticGroup, index) => {
        let _volume = (values['width'] || 0) * (values['length'] || 0) * (values['height'] || 0)
        let isAccept = _logisticGroup.items?.some(_logistic => {
            return (!_logistic.max_weight || values['weight'] <= _logistic.max_weight)
                && (!_logistic.min_weight || values['weight'] >= _logistic.min_weight)
                && (!requiredSize || ((_logistic.max_width == 0 || values['width'] <= _logistic.max_width)
                    && (_logistic.max_length == 0 || values['length'] <= _logistic.max_length)
                    && (_logistic.max_height == 0 || values['height'] <= _logistic.max_height)
                    && (_volume > 0)
                    && (!_logistic.max_volume || _volume <= _logistic.max_volume)))
        });
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
                    !isAccept ? <span style={{ marginBottom: 2 }} >{formatMessage({ defaultMessage: 'Đơn vị vận chuyển không được hỗ trợ' })}&ensp;&ensp;</span> : ''
                }
                {
                    isAccept ? <i className="far fa-check-circle text-success"></i> : <i className="far fa-times-circle text-danger"></i>
                }

            </span>
        </div>
    })
})