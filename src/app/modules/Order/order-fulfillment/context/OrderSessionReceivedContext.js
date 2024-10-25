import { useQuery } from "@apollo/client";
import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import query_scGetWarehouses from "../../../../../graphql/query_scGetWarehouses";
import query_sfSessionReceivedShippingCarrier from "../../../../../graphql/query_sfSessionReceivedShippingCarrier";
import query_smeCatalogStores from "../../../../../graphql/query_smeCatalogStores";

const OrderSessionReceivedContext = createContext();

export function useOrderSessionReceivedContext() {
    return useContext(OrderSessionReceivedContext);
};

export function OrderSessionReceivedProvider({ children }) {
    const [ids, setIds] = useState([]);
    const [isLoadPackages, setIsLoadPackages] = useState(false);
    const [searchParams, setSearchParams] = useState({
        warehouseId: null,
        search_type: 'tracking_number',
        search: '',
    });
    const inputRefOrder = useRef(null);
    const [isInitLoadPackages, setIsInitLoadPackages] = useState(true);
    const [filtersPackage, setFiltersPackage] = useState([]);
    const [packagesSession, setPackagesSession] = useState([]);
    const [warehouseSelected, setWarehouseSelected] = useState(null);
    const [shippingCarrier, setShippingCarrier] = useState(null);

    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        variables: { context: 'order' },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataScWareHouse } = useQuery(query_scGetWarehouses, {
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataSessionReceivedShippingCarrier } = useQuery(query_sfSessionReceivedShippingCarrier, {
        variables: {
            is_shipping_carrier_default: 1
        },
        fetchPolicy: 'cache-and-network'
    });    

    const { data: dataCatalogStores } = useQuery(query_smeCatalogStores, {
        variables: {
            where: {
                fulfillment_by: { _eq: 1 },
                status: { _eq: 10 }
            }
        },
        fetchPolicy: 'cache-and-network'
    });    

    const optionsShippingCarrier = useMemo(() => {
        const options = dataSessionReceivedShippingCarrier?.sfSessionReceivedShippingCarrier?.shipping_carrier?.map(item => ({
            value: item,
            label: item
        }))

        return options || []
    }, [dataSessionReceivedShippingCarrier]);

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
        setWarehouseSelected(smeWarehouseDefault?.value);

        return optionsCatalogStores
    }, [dataCatalogStores?.sme_warehouses]);



    const values = useMemo(() => {
        return {
            optionsSmeWarehouse, optionsChannel, optionsStore, isInitLoadPackages, setIsInitLoadPackages,
            filtersPackage, setFiltersPackage, ids, setIds, optionsShippingCarrier, isLoadPackages, setIsLoadPackages, dataScWareHouse,
            searchParams, setSearchParams, packagesSession, setPackagesSession, inputRefOrder, warehouseSelected, setWarehouseSelected,
            shippingCarrier, setShippingCarrier
        }
    }, [optionsSmeWarehouse, optionsChannel, optionsStore, filtersPackage, ids, optionsShippingCarrier, isLoadPackages, isInitLoadPackages, dataScWareHouse, searchParams, packagesSession, inputRefOrder, warehouseSelected, shippingCarrier]);

    return (
        <OrderSessionReceivedContext.Provider value={values}>
            {children}
        </OrderSessionReceivedContext.Provider>
    )
}