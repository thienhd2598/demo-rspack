import React, { Fragment, memo, useMemo, useCallback } from "react";
import TradingReportOverviewFilter from "./TradingReportOverviewFilter";
import TradingReportOverviewTable from "./TradingReportOverviewTable";
import TradingReportOverviewChart from "./TradingReportOverviewChart";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import { useQuery } from "@apollo/client";
import { useIntl } from "react-intl";
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import dayjs from "dayjs";

const TradingReportOverview = () => {
    const location = useLocation();
    const history = useHistory();
    const { formatMessage } = useIntl();
    const params = queryString.parse(location.search.slice(1, 100000));

    const { loading: loadingStores, data: dataStores } = useQuery(query_sc_stores_basic, {
        variables: {
            context: 'order'
        },
        fetchPolicy: "cache-and-network",
    });

    const [currentChannel, channelsActive, optionsStores] = useMemo(
        () => {
            const channelsActive = dataStores?.op_connector_channels?.filter(store => {
                return dataStores?.sc_stores?.some(sa => sa?.connector_channel_code === store?.code)
            });
            let _optionsChannel = channelsActive?.map(_channel => ({
                label: _channel?.name,
                logo: _channel?.logo_asset_url,
                value: _channel?.code
            })) || [];

            let _currentChannel = !!params?.channels
                ? _optionsChannel?.filter(
                    _channel => !!_channel?.value && params?.channels?.split(',').some(_param => _param == _channel.value)
                )
                : undefined;

            return [_currentChannel, _optionsChannel, dataStores?.sc_stores];
        }, [dataStores, params]
    );

    const connector_channel_code = useMemo(() => {
        try {
            if (!params?.channels) return {
                connector_channel_code: channelsActive?.map(channel => channel?.value)
            };

            return {
                connector_channel_code: params?.channels?.split(',')
            }
        } catch (error) {
            return {}
        }
    }, [params?.channels, channelsActive]);

    const compare_type = useMemo(() => {
        try {
            if (!params?.compare_type) return {
                compare_type: 1
            };

            return { compare_type: Number(params?.compare_type) }
        } catch (error) {
            return {}
        }
    }, [params?.compare_type]);

    const date_type = useMemo(() => {
        try {
            if (!params?.date_type) {
                return {
                    date_type: 4
                };
            }

            return { date_type: Number(params?.date_type) }
        } catch (error) {
            return {}
        }
    }, [params?.date_type]);

    const order_type = useMemo(() => {
        try {
            if (!params?.order_type) return {
                order_type: 'completed'
            };

            return { order_type: params?.order_type }
        } catch (error) {
            return {}
        }
    }, [params?.order_type]);

    const search_time = useMemo(
        () => {
            try {
                if (!params.from_date || !params.to_date) return {
                    from_date: dayjs().subtract(30, "day").format('YYYY-MM-DD'),
                    to_date: dayjs().subtract(1, "day").format('YYYY-MM-DD'),
                };

                return {
                    from_date: dayjs.unix(params?.from_date).format('YYYY-MM-DD'),
                    to_date: dayjs.unix(params?.to_date).format('YYYY-MM-DD'),
                }
            } catch (error) {
                return {}
            }
        }, [params?.from_date, params?.to_date]
    );

    const variables = useMemo(() => {
        return {
            ...connector_channel_code,
            ...search_time,
            ...order_type,
            ...date_type,
            ...compare_type
        }
    }, [search_time, order_type, date_type, compare_type, connector_channel_code]);

    return (
        <Fragment>
            <TradingReportOverviewFilter
                variables={variables}
                loadingChannels={loadingStores}
                currentChannel={currentChannel}
                channelsActive={channelsActive}
            />
            <TradingReportOverviewChart variables={variables} />
            <TradingReportOverviewTable
                variables={variables}
                loadingChannels={loadingStores}
                currentChannel={currentChannel}
                channelsActive={channelsActive}
            />
        </Fragment>
    );
};

export default memo(TradingReportOverview);
