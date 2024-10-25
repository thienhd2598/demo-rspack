import { useQuery } from "@apollo/client";
import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";

const OrderSesionReceivedDetailContext = createContext();

export function useOrderSessionReceivedDetailContext() {
    return useContext(OrderSesionReceivedDetailContext);
};

export function OrderSessionReceivedDetailProvider({ children }) {
    const [packagesSession, setPackagesSession] = useState([]);
    const [isLoadPackages, setIsLoadPackages] = useState(false);
    const inputRefOrder = useRef(null);
    const [search, setSearch] = useState("")

    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        variables: { context: 'order' },
        fetchPolicy: 'cache-and-network'
    });

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

    const values = useMemo(() => {
        return {
            packagesSession,
            setPackagesSession,
            optionsStore,
            inputRefOrder,
            search,
            setSearch,
            isLoadPackages,
            setIsLoadPackages
        }
    }, [packagesSession, optionsStore, inputRefOrder, search, isLoadPackages]);

    return (
        <OrderSesionReceivedDetailContext.Provider value={values}>
            {children}
        </OrderSesionReceivedDetailContext.Provider>
    )
}