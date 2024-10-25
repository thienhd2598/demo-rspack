import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { useLocation } from 'react-router-dom';
import queryString from 'querystring';
import * as Yup from "yup";
import { useQuery } from "@apollo/client";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import query_smeCatalogStores from "../../../../../graphql/query_smeCatalogStores";
import query_coGetShippingCarrierFromListPackage from "../../../../../graphql/query_coGetShippingCarrierFromListPackage";
import query_scGetWarehouses from "../../../../../graphql/query_scGetWarehouses";

const OrderFulfillmentContext = createContext();

export function useOrderFulfillmentContext() {
    return useContext(OrderFulfillmentContext);
};

export function OrderFulfillmentProvider({ children }) {
    const [ids, setIds] = useState([]);
    const [isLoadPackages, setIsLoadPackages] = useState(false);
    const [searchParams, setSearchParams] = useState([]);
    const [isInitLoadPackages, setIsInitLoadPackages] = useState(true);
    const [initialValues, setInitialValues] = useState({
        session_pickup_type: 'grp',
        session_sub_pickup_type: ['mio', 'sio']
    });
    const [validateSchema, setValidateSchema] = useState(null);
    const [filtersPackage, setFiltersPackage] = useState([]);

    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        variables: { context: 'order' },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataScWareHouse } = useQuery(query_scGetWarehouses, {
        fetchPolicy: 'cache-and-network'
      });

    const { data: dataShippingCarrierFromListPackage } = useQuery(query_coGetShippingCarrierFromListPackage, {
        variables: {
            is_connected: 1,
        },
        fetchPolicy: 'cache-and-network'
    });    

    const { data: dataCatalogStores } = useQuery(query_smeCatalogStores, {
        variables: {
            where: {
                fulfillment_by: { _eq: 1 },
                status: {_eq: 10}
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    const optionsShippingUnit = useMemo(() => {
        const options = dataShippingCarrierFromListPackage?.coGetShippingCarrierFromListPackage?.data?.map(item => ({
            ...item,
            value: item?.shipping_carrier,
            label: item?.shipping_carrier
        }))

        return options || []
    }, [dataShippingCarrierFromListPackage]);

    const [optionsChannel, optionsStore] = useMemo(() => {
        const channels = dataStore?.op_connector_channels?.map(channel => ({
            ...channel,
            logo: channel?.logo_asset_url,
            value: channel?.code,
            label: channel?.name
        }))

        const stores = dataStore?.sc_stores?.map(store => ({
            value: store?.id,
            label: store?.name,
            logo: dataStore?.op_connector_channels?.find(channel => channel?.code == store?.connector_channel_code)?.logo_asset_url,
            ...store
        }));

        return [channels, stores]
    }, [dataStore]);

    const optionsSmeWarehouse = useMemo(() => {
        const optionsCatalogStores = dataCatalogStores?.sme_warehouses?.map(
            _store => ({
                value: _store?.id,
                label: _store?.name,
                isDefault: _store?.is_default,
                ..._store
            })
        );

        return optionsCatalogStores
    }, [dataCatalogStores]);



    const values = useMemo(() => {
        return {
            initialValues, validateSchema, optionsSmeWarehouse, optionsChannel, optionsStore, isInitLoadPackages, setIsInitLoadPackages,
            filtersPackage, setFiltersPackage, ids, setIds, optionsShippingUnit, isLoadPackages, setIsLoadPackages, dataScWareHouse,
            searchParams, setSearchParams
        }
    }, [initialValues, validateSchema, optionsSmeWarehouse, optionsChannel, optionsStore, filtersPackage, ids, optionsShippingUnit, isLoadPackages, isInitLoadPackages, dataScWareHouse, searchParams]);

    return (
        <OrderFulfillmentContext.Provider value={values}>
            {children}
        </OrderFulfillmentContext.Provider>
    )
}