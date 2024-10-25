import React, { memo, useMemo, useCallback, useState, useLayoutEffect, Fragment, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import { useParams } from 'react-router-dom';
import { Card, CardBody } from '../../../../../_metronic/_partials/controls';
import { useSubheader } from '../../../../../_metronic/layout';
import SectionCustomerOverview from './SectionCustomerOverview';
import SectionCustomerInfo from './SectionCustomerInfo';
import 'rc-table/assets/index.css';
import { groupBy } from 'lodash';
import { useQuery } from '@apollo/client';
import { Helmet } from 'react-helmet-async';
import query_crmFindCustomer from '../../../../../graphql/query_crmFindCustomer';
import query_crmGetProvince from '../../../../../graphql/query_crmGetProvince';
import query_crmGetDistrict from '../../../../../graphql/query_crmGetDistrict';
import query_crmGetChannelCode from '../../../../../graphql/query_crmGetChannelCode';
import query_sc_stores_basic from '../../../../../graphql/query_sc_stores_basic';
import query_crmGetWards from '../../../../../graphql/query_crmGetWards';

const CustomerInfoDetail = () => {
    const params = useParams();
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();

    const { loading: loadingCrmFindCustomer, data: dataCrmFindCustomer } = useQuery(query_crmFindCustomer, {
        variables: {
            id: Number(params?.id)
        },
        fetchPolicy: "cache-and-network"
    });
    console.log('dataCrmFindCustomer', dataCrmFindCustomer)
    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        variables: {
            context: 'order'
        },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataCrmGetChannelCode } = useQuery(query_crmGetChannelCode, {
        fetchPolicy: "cache-and-network",
    });

    const { data: dataCrmGetProvince } = useQuery(query_crmGetProvince, {
        fetchPolicy: "cache-and-network",
    });

    const { data: dataCrmGetDistrict } = useQuery(query_crmGetDistrict, {
        fetchPolicy: "cache-and-network",
    });

    useEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Thông tin khách hàng' }) },
            { title: dataCrmFindCustomer?.crmFindCustomer?.seller_username || '' },
        ])
    }, [dataCrmFindCustomer]);

    const optionsStore = useMemo(() => {
        return dataStore?.sc_stores?.map(store => ({
            value: store?.id,
            label: store?.name,
            logo: dataStore?.op_connector_channels?.find(channel => channel?.code == store?.connector_channel_code)?.logo_asset_url,
            connector_channel_code: store?.connector_channel_code
        }));
    }, [dataStore]);

    const optionsProvince = useMemo(() => {
        return dataCrmGetProvince?.crmGetProvince?.map(province => ({
            value: province?.code,
            label: province?.name
        }));
    }, [dataCrmGetProvince]);

    const optionsDistrict = useMemo(() => {
        const opsParse = dataCrmGetDistrict?.crmGetDistrict?.map(district => ({
            value: district?.code,
            label: district?.full_name,
            province_code: district?.province_code,
        }));

        return groupBy(opsParse, 'province_code')
    }, [dataCrmGetDistrict]);

    const optionsChannelCode = useMemo(() => {
        return dataCrmGetChannelCode?.crmGetChannelCode?.map(channel => ({
            value: channel?.key,
            label: channel?.name,
            logo: channel?.url_logo
        }));
    }, [dataCrmGetChannelCode]);



    return (
        <Fragment>
            <Helmet
                titleTemplate={!!dataCrmFindCustomer ? `${dataCrmFindCustomer?.crmFindCustomer?.seller_username} - UpBase` : 'Thông tin khách hàng - UpBase'}
                defaultTitle={!!dataCrmFindCustomer ? `${dataCrmFindCustomer?.crmFindCustomer?.seller_username} - UpBase` : 'Thông tin khách hàng - UpBase'}
            >
                <meta name="description" content={!!dataCrmFindCustomer ? `${dataCrmFindCustomer?.crmFindCustomer?.seller_username} - UpBase` : 'Thông tin khách hàng - UpBase'} />
            </Helmet>
            <div className='row'>
                <div className='col-3'>
                    <Card>
                        <CardBody>
                            <SectionCustomerInfo
                                loading={loadingCrmFindCustomer}
                                optionsProvince={optionsProvince}
                                optionsDistrict={optionsDistrict}
                                optionsChannelCode={optionsChannelCode}
                                optionsStore={optionsStore}
                                data={dataCrmFindCustomer?.crmFindCustomer || {}}
                            />
                        </CardBody>
                    </Card>
                </div>
                <div className='col-9'>
                    <Card>
                        <CardBody>
                            <SectionCustomerOverview
                                loading={loadingCrmFindCustomer}
                                data={dataCrmFindCustomer?.crmFindCustomer || {}}
                                optionsProvince={optionsProvince}
                                optionsDistrict={optionsDistrict}
                                optionsStore={optionsStore}
                                optionsChannelCode={optionsChannelCode}
                            />
                        </CardBody>
                    </Card>
                </div>
            </div>
        </Fragment>
    )
};

export default memo(CustomerInfoDetail);
