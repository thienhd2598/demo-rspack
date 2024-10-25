import React, { Fragment, memo, useCallback, useMemo, useState } from "react";
import TradingReportChannelFilter from "./TradingReportChannelFilter";
import TradingReportChannelTable from "./TradingReportChannelTable";
import TradingReportDialog from "../dialogs/TradingReportDialog";
import DrawerModal from "../../../../../components/DrawerModal";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import { useQuery } from "@apollo/client";
import { useIntl } from "react-intl";
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import dayjs from "dayjs";

const TradingReportChannel = () => {
    const location = useLocation();
    const history = useHistory();
    const { formatMessage } = useIntl();
    const params = queryString.parse(location.search.slice(1, 100000));
    const [isOpenDrawer, setOpenDrawer] = useState(false);
    const [currentKeyChart, setCurrentKeyChart] = useState(null);

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

    const list_channel_code = useMemo(() => {
        try {
            if (!params?.channels) return {
                list_channel_code: channelsActive?.map(channel => channel?.value)
            };

            return {
                list_channel_code: params?.channels?.split(',')
            }
        } catch (error) {
            return {}
        }
    }, [params?.channels, channelsActive]);

    const time_type = useMemo(() => {
        try {
            if (!params?.time_type) return {
                time_type: 'completed'
            };

            return { time_type: params?.time_type }
        } catch (error) {
            return {}
        }
    }, [params?.time_type]);

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
            ...list_channel_code,
            ...time_type,
            ...search_time
        }
    }, [list_channel_code, time_type, search_time]);

    const onToggleDrawer = useCallback(() => setOpenDrawer(prev => !prev), [setOpenDrawer]);

    return (
        <Fragment>
            <DrawerModal
                open={isOpenDrawer}
                onClose={onToggleDrawer}
                direction="right"
                size={500}
                enableOverlay={true}
            >
                {isOpenDrawer && (
                    <TradingReportDialog
                        variables={variables}
                        currentKeyChart={currentKeyChart}
                        channelsActive={channelsActive}
                        onResetCurrentKeyChart={() => setCurrentKeyChart(null)}
                        onToggleDrawer={onToggleDrawer}
                    />
                )}
            </DrawerModal>
            <TradingReportChannelFilter
                variables={variables}
                loadingChannels={loadingStores}
                currentChannel={currentChannel}
                channelsActive={channelsActive}
            />
            <TradingReportChannelTable
                variables={variables}
                onToggleDrawer={onToggleDrawer}
                channelsActive={channelsActive}
                listChannelCode={list_channel_code?.list_channel_code}
                optionsStores={optionsStores}
                onSetCurrentKeyChart={key => setCurrentKeyChart(key)}
            />
        </Fragment>
    );
};

export default memo(TradingReportChannel);