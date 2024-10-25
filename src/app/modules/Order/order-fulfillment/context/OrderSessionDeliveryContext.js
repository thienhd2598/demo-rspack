import { useQuery } from "@apollo/client";
import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import query_coGetShippingCarrierFromListPackage from "../../../../../graphql/query_coGetShippingCarrierFromListPackage";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import query_scGetWarehouses from "../../../../../graphql/query_scGetWarehouses";
import query_smeCatalogStores from "../../../../../graphql/query_smeCatalogStores";

const OrderSessionDeliveryContext = createContext();

export function useOrderSessionDeliveryContext() {
    return useContext(OrderSessionDeliveryContext);
};

export function OrderSessionDeliveryProvider({ children }) {
    const [ids, setIds] = useState([]);
    const [isLoadPackages, setIsLoadPackages] = useState(false);
    const [searchParams, setSearchParams] = useState({
        warehouseId: null,
        search_type: 'tracking_number',
        search: '',
    });
    const inputRefOrder = useRef(null);
    const [isInitLoadPackages, setIsInitLoadPackages] = useState(true);
    const [initialValues, setInitialValues] = useState({
        session_pickup_type: 'sio'
    });
    const [validateSchema, setValidateSchema] = useState(null);
    const [filtersPackage, setFiltersPackage] = useState([]);
    const [packagesSession, setPackagesSession] = useState([]);

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

        const smeWarehouseDefault = optionsCatalogStores?.find(wh => wh?.isDefault);
        setSearchParams(prev => ({ ...prev, warehouseId: smeWarehouseDefault?.value }));

        return optionsCatalogStores
    }, [dataCatalogStores?.sme_warehouses]);



    const values = useMemo(() => {
        return {
            initialValues, validateSchema, optionsSmeWarehouse, optionsChannel, optionsStore, isInitLoadPackages, setIsInitLoadPackages,
            filtersPackage, setFiltersPackage, ids, setIds, optionsShippingUnit, isLoadPackages, setIsLoadPackages, dataScWareHouse,
            searchParams, setSearchParams, packagesSession, setPackagesSession, inputRefOrder
        }
    }, [initialValues, validateSchema, optionsSmeWarehouse, optionsChannel, optionsStore, filtersPackage, ids, optionsShippingUnit, isLoadPackages, isInitLoadPackages, dataScWareHouse, searchParams, packagesSession, inputRefOrder]);

    return (
        <OrderSessionDeliveryContext.Provider value={values}>
            {children}
        </OrderSessionDeliveryContext.Provider>
    )
}