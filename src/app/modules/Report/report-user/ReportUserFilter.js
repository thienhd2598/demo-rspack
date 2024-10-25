import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import {
    Card,
    CardBody,
} from "../../../../_metronic/_partials/controls";
import Select from "react-select";
import _ from 'lodash';
import queryString from 'querystring';
import { useLocation, useHistory } from "react-router-dom";
import { useQuery } from "@apollo/client";
import op_connector_channels from "../../../../graphql/op_connector_channels";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import FilterCalendar from './ReportUserFilterCalendar';
import makeAnimated from 'react-select/animated';
import { useIntl, FormattedMessage } from 'react-intl';

const animatedComponents = makeAnimated();
const OPTIONS_STATUS_ORDER = [
    { value: 0, label: <FormattedMessage defaultMessage='Tất cả' /> },
    { value: 1, label: <FormattedMessage defaultMessage='Đã thanh toán' /> },
    { value: 2, label: <FormattedMessage defaultMessage='Hoàn thành' /> },
    { value: 3, label: <FormattedMessage defaultMessage='Đơn đã xác nhận' /> },
];

export default memo(({ visible }) => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const { data: dataChannel, loading: loadingChannel } = useQuery(op_connector_channels);

    const [currentValueChannel, optionsChannel] = useMemo(
        () => {
            let _options = dataChannel?.op_connector_channels?.map(
                _channel => ({
                    label: _channel?.name,
                    logo: _channel?.logo_asset_url,
                    value: _channel?.code
                })
            ) || [];

            let _current = !!params?.channel
                ? _options?.filter(
                    _channel => !!_channel?.value && params?.channel?.split(',').some(_param => _param == _channel.value)
                )
                : undefined;

            return [_current, _options];
        }, [dataChannel, params]
    );


    return (
        <Card>
            <CardBody>
                <div className={`row align-items-center justify-content-between ${!visible ? 'filter-report-fixed-top' : ''}`}>
                    <div className='col-12'>
                        <div className='row'>
                            <div className='col-4'>
                                <div className='d-flex align-items-center'>
                                    <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Thời gian' })}</span>
                                    <FilterCalendar />
                                </div>
                            </div>
                            <div className='col-4' style={{ zIndex: 9 }}>
                                <div className='d-flex align-items-center'>
                                    <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Sàn' })}</span>
                                    <Select
                                        options={optionsChannel}
                                        className='w-100 select-report-custom'
                                        placeholder='Tất cả'
                                        components={animatedComponents}
                                        isClearable
                                        value={currentValueChannel}
                                        isLoading={loadingChannel}
                                        onChange={value => {
                                            history.push(`/report/user?${queryString.stringify({
                                                ...params,
                                                channel: value?.value || undefined
                                            })}`)
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
                </div>
            </CardBody>
        </Card>
    )
});
