import React, { memo, useMemo, useCallback, useState, useLayoutEffect, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import { useHistory, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import queryString from 'querystring';
import { useSubheader } from '../../../../../_metronic/layout';
import FilterCustomerInfo from '../components/FilterCustomerInfo';
import { Card, CardBody } from '../../../../../_metronic/_partials/controls';
import ActionsCustomerInfo from '../components/ActionsCustomerInfo';
import TableCustomerInfo from '../components/TableCustomerInfo';
import CreateCustomerDialog from '../dialogs/CreateCustomerDialog';
import ImportCustomerDialog from '../dialogs/ImportCustomerDialog';
import ConfirmDialog from '../dialogs/ConfirmDialog';
import TagDialog from '../dialogs/TagDialog';
import { groupBy } from 'lodash';
import query_crmGetCustomers from '../../../../../graphql/query_crmGetCustomers';
import query_crmGetProvince from '../../../../../graphql/query_crmGetProvince';
import query_crmGetDistrict from '../../../../../graphql/query_crmGetDistrict';
import query_crmGetChannelCode from '../../../../../graphql/query_crmGetChannelCode';
import query_sc_stores_basic from '../../../../../graphql/query_sc_stores_basic';
import query_crmGetTag from '../../../../../graphql/query_crmGetTag';
import ResultFileDialog from '../dialogs/ResultFileDialog';

const RANGE_MIN_PRICE = 0;
const RANGE_MAX_PRICE = 1000000000;
const RANGE_MIN_ORDER = 0;
const RANGE_MAX_ORDER = 1000;

const CustomerInfoList = () => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const location = useLocation();
    const { addToast } = useToasts();
    const { setBreadcrumbs } = useSubheader();
    const params = queryString.parse(location.search.slice(1, 100000));

    const [ids, setIds] = useState([]);
    const [dataResultImport, setDataResultImport] = useState(null);
    const [currentIdDelete, setCurrentIdDelete] = useState(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [showTag, setShowTag] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Thông tin khách hàng' }) },
        ])
    }, []);

    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        variables: {
            context: 'order'
        },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataCrmGetTag } = useQuery(query_crmGetTag, {
        fetchPolicy: "cache-and-network",
    });

    const { loading: loadingCrmGetProvince, data: dataCrmGetProvince } = useQuery(query_crmGetProvince, {
        fetchPolicy: "cache-and-network",
    });

    const { loading: loadingCrmGetDistrict, data: dataCrmGetDistrict } = useQuery(query_crmGetDistrict, {
        fetchPolicy: "cache-and-network",
    });

    const { loading: loadingCrmGetChannelCode, data: dataCrmGetChannelCode } = useQuery(query_crmGetChannelCode, {
        fetchPolicy: "cache-and-network",
    });

    const list_channel = useMemo(() => {
        try {
            let channels = params?.channels || null
            if (!channels) {
                return {}
            }
            return { list_channel: channels?.split(',') }
        } catch (error) {
            return {}
        }
    }, [params?.channels]);

    const list_store = useMemo(() => {
        try {
            let stores = params?.stores || null
            if (!stores) {
                return {}
            }
            return { list_store: stores?.split(',')?.map(store => +store) }
        } catch (error) {
            return {}
        }
    }, [params?.stores]);

    const list_tag = useMemo(() => {
        try {
            let tags = params?.tags || null
            if (!tags) {
                return {}
            }
            return { list_tag: tags?.split(',')?.map(tag => +tag) }
        } catch (error) {
            return {}
        }
    }, [params?.tags]);

    const q = useMemo(() => {
        try {
            if (!params?.q) return {};

            return { q: params?.q }
        } catch (error) {
            return {}
        }
    }, [params?.q]);

    const city_province = useMemo(() => {
        try {
            if (!params?.city_province) return {};

            return { city_province: params?.city_province?.split(',')?.map(province => province) }
        } catch (error) {
            return {}
        }
    }, [params?.city_province]);

    const range_money = useMemo(() => {
        try {
            if (!params?.fromPrice && !params?.toPrice) return {}

            return {
                range_money: [
                    !!params?.fromPrice ? Number(params?.fromPrice) : RANGE_MIN_PRICE,
                    !!params?.toPrice ? Number(params?.toPrice) : RANGE_MAX_PRICE,
                ]
            }
        } catch (error) {
            return {}
        }
    }, [params?.fromPrice, params?.toPrice]);

    const range_order = useMemo(() => {
        try {
            if (!params?.fromOrder && !params?.toOrder) return {}

            return {
                range_order: [
                    !!params?.fromOrder ? Number(params?.fromOrder) : RANGE_MIN_ORDER,
                    !!params?.toOrder ? Number(params?.toOrder) : RANGE_MAX_ORDER,
                ]
            }
        } catch (error) {
            return {}
        }
    }, [params?.fromOrder, params?.toOrder]);

    const searchVariables = useMemo(() => {
        return {
            ...list_channel,
            ...list_store,
            ...list_tag,
            ...q,
            ...city_province,
            ...range_money,
            ...range_order
        }
    }, [list_channel, list_store, list_tag, q, city_province, range_money, range_order])


    const optionsTags = useMemo(() => {
        return dataCrmGetTag?.crmGetTag?.map(tag => ({
            value: tag?.id,
            label: tag?.title,
        }));
    }, [dataCrmGetTag]);

    const optionsChannelCode = useMemo(() => {
        return dataCrmGetChannelCode?.crmGetChannelCode?.map(channel => ({
            value: channel?.key,
            label: channel?.name,
            logo: channel?.url_logo
        }));
    }, [dataCrmGetChannelCode]);

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

    console.log({ optionsProvince, optionsDistrict, dataCrmGetChannelCode, dataStore, dataCrmGetTag });

    return (
        <Fragment>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Thông tin khách hàng" }) + " - UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Thông tin khách hàng" }) + " - UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Thông tin khách hàng" }) + " - UpBase"} />
            </Helmet>
            {!!dataResultImport && <ResultFileDialog 
                result={dataResultImport}
                onHide={() => setDataResultImport(null)}
            />}
            <ConfirmDialog
                show={!!currentIdDelete}
                onHide={() => setCurrentIdDelete(null)}
                onConfirm={() => { }}
            />
            <CreateCustomerDialog
                show={showCreateDialog}
                onHide={() => setShowCreateDialog(false)}
                loadingCrmGetProvince={loadingCrmGetProvince}
                loadingCrmGetDistrict={loadingCrmGetDistrict}
                optionsChannelCode={optionsChannelCode}
                optionsProvince={optionsProvince}
                optionsDistrict={optionsDistrict}
                optionsStore={optionsStore}
            />
            <ImportCustomerDialog
                show={showImportDialog}
                onHide={() => setShowImportDialog(false)}
                setDataResultImport={setDataResultImport}
            />
            <TagDialog
                show={showTag}
                onHide={() => setShowTag(false)}
                onConfirm={() => { }}
            />
            <Card>
                <CardBody>
                    <FilterCustomerInfo
                        optionsProvince={optionsProvince}
                        optionsChannelCode={optionsChannelCode}
                        optionsStore={optionsStore}
                        optionsTags={optionsTags}
                    />
                    <ActionsCustomerInfo
                        ids={ids}
                        setIds={setIds}
                        optionsChannelCode={optionsChannelCode}
                        optionsTags={optionsTags}
                        onShowCreateDialog={() => setShowCreateDialog(true)}
                        onShowImportDialog={() => setShowImportDialog(true)}
                        onShowExportDialog={() => setShowExportDialog(true)}
                        onAddTagMutilple={() => { }}
                    />
                    <TableCustomerInfo
                        ids={ids}
                        setIds={setIds}
                        onAddTag={() => { }}
                        optionsChannelCode={optionsChannelCode}
                        optionsTags={optionsTags}
                        searchVariables={searchVariables}
                        optionsStore={optionsStore}
                    />
                </CardBody>
            </Card>
        </Fragment>
    )
}

export default CustomerInfoList;

export const actionKeys = {
    "customer_service_customer_info_view": {
        router: '/customer-service/customer-info',
        actions: [
            "crmGetCustomers",
            "crmFindCustomer", 
            "sc_stores", 
            "op_connector_channels", 
            "crmGetChannelCode", 
            "crmGetProvince", 
            "crmGetDistrict", 
            "crmGetTag",
            "crmProductByCustomer", 
            "sme_catalog_product_variant", 
            "sme_catalog_product_variant_aggregate", 
            "crmRatingByCustomer", 
            "scGetSmeProductByListId", 
            "crmRecipientAddressByCustomer",
            "crmGetOptionSupport",
            "crmSupportByCustomer",
            "crmOrderByCustomer",
            "crmReturnOrderByCustomer"
        ],
        name: 'Xem danh sách khách hàng',
        group_code: 'customer_info',
        group_name: 'Thông tin khách hàng',
        cate_code: 'customer_service',
        cate_name: 'Chăm sóc khách hàng'
    },
    "customer_service_customer_info_update": {
        router: '/customer-service/customer-info',
        actions: [
            "crmDeleteCustomer", 
            "crmGetCustomers", 
            "crmUpdateCustomer", 
            "crmSaveCustomerTags", 
            "crmFindCustomer", 
            "crmUpdateCustomer", 
            "crmRecipientAddressByCustomer", 
            "crmUpdateCustomerRecipientAddress",
            "crmUpdateSupport", 
            "crmSupportByCustomer",
            'crmGetTag',
            "crmDeleteSupport",
        ],
        name: 'Cập nhật thông tin khách hàng',
        group_code: 'customer_info',
        group_name: 'Thông tin khách hàng',
        cate_code: 'customer_service',
        cate_name: 'Chăm sóc khách hàng'
    },
    "customer_service_customer_info_create": {
        router: '',
        actions: [
            "crmGetCustomers", "crmCreateCustomer","crmImportCustomer", "crmCreateSupport", "crmSupportByCustomer"
        ],
        name: 'Thêm khách hàng',
        group_code: 'customer_info',
        group_name: 'Thông tin khách hàng',
        cate_code: 'customer_service',
        cate_name: 'Chăm sóc khách hàng'
    },
    "customer_service_customer_info_export": {
        router: '',
        actions: [
            "crmGetJobTrackingExport", "crmGetTag", "sc_stores", "op_connector_channels", "crmRetryExportCustomer", "crmExportCustomerAggregate", "crmExportCustomer"
        ],
        name: 'Xuất file khách hàng',
        group_code: 'customer_info',
        group_name: 'Thông tin khách hàng',
        cate_code: 'customer_service',
        cate_name: 'Chăm sóc khách hàng'
    },
    "customer_service_chat": {
        router: '',
        actions: [
            "op_connector_channels",
            "sc_conversation_stores",
            "conversationLabelList",
            "conversationList",
            "messageList",
            "crmFindCustomer",
            "chatTplMessageEnableSuggest",
            "sme_catalog_inventory_items",
            "sme_catalog_inventory_items_aggregate",
            "crmSearchRecipientAddressByCustomer",
            "scGetSmeProductByListId",
            "conversationMarkRead",
            "scGetOrders",
            "ScGetSmeProducts",
            "chatTplMessageGroups",
            "scProductReLoad"
        ],
        name: 'Xem danh sách trò chuyện',
        group_code: 'customer_chat',
        group_name: 'Trò chuyện',
        cate_code: 'customer_service',
        cate_name: 'Chăm sóc khách hàng'
    }
};
