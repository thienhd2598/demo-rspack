import React, { useLayoutEffect, useMemo, useState } from 'react'
import { useSubheader } from '../../../../_metronic/layout';
import { useIntl } from 'react-intl';
import { Helmet } from 'react-helmet';
import { useMutation, useQuery } from '@apollo/client';
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring';
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useToasts } from 'react-toast-notifications'
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import FilterRating from './FilterRating';
import TableRating from './TableRating';
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic';
import { omit } from 'lodash';


const ManageRating = () => {
    const { setBreadcrumbs } = useSubheader();
    const { addToast } = useToasts()
    const { formatMessage } = useIntl()
    const location = useLocation();
    const history = useHistory()
    const params = queryString.parse(location.search.slice(1, 100000))

    const { loading: loadingStores, data: dataStores } = useQuery(query_sc_stores_basic, {
        fetchPolicy: "cache-and-network",
    });

    const [channels, stores] = useMemo(() => {
        const clearTiktokChannel = dataStores?.op_connector_channels?.filter(cn => cn?.code !== 'tiktok' && cn?.code !== 'other')
        const clearTiktokStore = dataStores?.sc_stores?.filter(store => store?.connector_channel_code !== 'tiktok' && store?.connector_channel_code !== 'other')
        return [clearTiktokChannel, clearTiktokStore]
    }, [dataStores])

    const [currentChannel, channelsActive, currentStores, optionsStores] = useMemo(
        () => {
            const channelsActive = channels?.filter(store => {
                return {
                    channelsActive: stores?.some(sa => sa?.connector_channel_code === store?.code)
                }
            });
            let _optionsChannel = channelsActive?.map(_channel => ({
                label: _channel?.name,
                logo: _channel?.logo_asset_url,
                value: _channel?.code
            })) || [];

            let __optionsStores = stores?.flatMap(_store => {
                const channelParams = params?.channels ? params?.channels?.split(',') : null
                const channel = _optionsChannel?.find(cn => cn?.value == _store?.connector_channel_code)
                if (!channelParams) {

                    return {
                        label: _store?.name,
                        logo: channel?.logo,
                        value: _store?.id,
                        channel: channel?.value
                    }
                }
                if (channelParams?.includes(_store?.connector_channel_code)) {
                    return {
                        label: _store?.name,
                        logo: channel?.logo,
                        value: _store?.id,
                        channel: channel?.value
                    }
                }
                return []
            })

            let _currentChannel = !!params?.channels ? _optionsChannel?.filter(_channel => !!_channel?.value && params?.channels?.split(',').some(_param => _param == _channel.value)) : undefined;
            let _currentStores = !!params?.stores ? __optionsStores?.filter(_stores => !!_stores?.value && params?.stores?.split(',').some(_param => _param == _stores.value)) : [];

            return [_currentChannel, _optionsChannel, _currentStores, __optionsStores];
        }, [stores, channels, params]
    );


    const page = useMemo(
        () => {
            try {
                let _page = Number(params.page);
                if (!Number.isNaN(_page)) {
                    return Math.max(1, _page)
                } else {
                    return 1
                }
            } catch (error) {
                return 1;
            }
        }, [params.page]
    );

    const per_page = useMemo(
        () => {
            try {
                let _value = Number(params.limit)
                if (!Number.isNaN(_value)) {
                    return Math.max(25, _value)
                } else {
                    return 25
                }
            } catch (error) {
                return 25
            }
        }, [params.limit]
    );

    const list_channel = useMemo(
        () => {
            if (params?.channels) {
                return { list_channel: params.channels?.split(',') }
            }
            return {}
        }, [params.channels]
    );



    const rating_star = useMemo(
        () => {
            if (params?.star) {
                return { rating_star: +params.star }
            }
            return {}
        }, [params.star]
    );

    const status = useMemo(
        () => {
            if (params?.status) {
                return { status: params.status }
            }
            return {}
        }, [params.status]
    );

    const search_user = useMemo(
        () => {
            if (params?.search_user) {
                return { search_user: params.search_user }
            }
            return {}
        }, [params.search_user]
    );

    const list_store = useMemo(
        () => {
            if (params.stores) {
                return { list_store: params.stores?.split(',')?.map(e => +e) }
            }
            return {}
        }, [params.stores]
    );

    const range_time = useMemo(
        () => {
            try {
                if (!params.gt || !params.lt) return null;
                return { range_time: [Number(params?.gt), Number(params?.lt)] }
            } catch (error) {
                return {}
            }
        }, [params?.gt, params?.lt]
    );


    const q = useMemo(
        () => {
            if (params?.q) {
                return { q: params.q, search_type: params?.search_type || 'ref_order_id' }
            }
            return {}
        }, [params.q, params.search_type]
    );
    let searchVaribales = useMemo(() => {
        return {
            ...list_channel,
            ...list_store,
            ...range_time,
            ...q,
            ...rating_star,
            ...status,
            ...search_user,
        }
    }, [list_channel, list_store, range_time, q, rating_star, status, search_user])

    let whereConditions = useMemo(() => {
        return {
            page,
            per_page,
            search: searchVaribales
        }

    }, [page, per_page, searchVaribales])


    useLayoutEffect(() => {
        setBreadcrumbs([{ title: formatMessage({ defaultMessage: "Quản lý đánh giá" }) }]);
    }, []);

    return (
        <>
            <Helmet titleTemplate={formatMessage({ defaultMessage: `Quản lý đánh giá {key}` }, { key: " - UpBase" })} defaultTitle={formatMessage({ defaultMessage: `Quản lý đánh giá {key}` }, { key: " - UpBase" })}>
                <meta name="description" content={formatMessage({ defaultMessage: `Quản lý đánh giá {key}` }, { key: " - UpBase" })} />
            </Helmet>
            <LoadingDialog show={false} />
            <Card>
                <CardBody>
                    <FilterRating channelState={{ currentChannel, channelsActive, optionsStores, loadingStores, currentStores }} />
                </CardBody>
            </Card>
            <Card>
                <CardBody>
                    <TableRating stores={optionsStores} searchVaribales={searchVaribales} whereConditions={whereConditions} />
                </CardBody>
            </Card>

            <div id="kt_scrolltop1"
                className="scrolltop"
                style={{ bottom: 80 }}
                onClick={() => { window.scrollTo({ letf: 0, top: document.body.scrollHeight, behavior: "smooth" }); }}>
                <span className="svg-icon"><SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={" "}></SVG>
                </span>
            </div>
        </>
    )
}

export default ManageRating

export const actionKeys = {
    "customer_service_rating_view": {
        router: '/customer-service/manage-rating',
        actions: ["sc_stores", "op_connector_channels", "scCommentAggregate", "scGetComments"],
        name: 'Xem danh sách đánh giá (bao gồm Tải lại)',
        group_code: 'customer_info',
        group_name: 'Thông tin khách hàng',
        cate_code: 'customer_service',
        cate_name: 'Chăm sóc khách hàng'
    },
    "customer_service_rating_update": {
        router: '/customer-service/manage-rating',
        actions: ["scLoadRatingCommentById", "scGetComments", "scRetryReplyComments", "scReplyComments"],
        name: 'Trả lời đánh giá',
        group_code: 'customer_info',
        group_name: 'Thông tin khách hàng',
        cate_code: 'customer_service',
        cate_name: 'Chăm sóc khách hàng'
    }
  };
