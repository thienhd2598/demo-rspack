import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";
import query_sme_catalog_stores from '../../../../../graphql/query_sme_catalog_stores';
import query_sc_stores_basic from '../../../../../graphql/query_sc_stores_basic';
import { useQuery, useMutation } from "@apollo/client";
import mutate_userReserveRetryByVariant from "../../../../../graphql/mutate_userReserveRetryByVariant";
import mutate_userReverseRemoveItem from "../../../../../graphql/mutate_userReserveRemoveItem";


const ProductsReserveDetailContext = createContext();

export function useProductsReserveDetailContext() {
    return useContext(ProductsReserveDetailContext);
}

export const ProductsReserveDetailConsumer = ProductsReserveDetailContext.Consumer;

export function ProductsReserveDetailProvider({ productsReserveDetailEvents, children }) {
    const [smeWarehouses, setSmeWarehouses] = useState([])
    const { data: dataSmeWarehouses } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataStores } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    const [userReserveRetryByVariant, { loading: loadingUserReserveRetryByVariant }] = useMutation(mutate_userReserveRetryByVariant, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_reserve_ticket_items']
    });

    const [userReserveRemoveItem, { loading: loadingUserReserveRemoveItem }] = useMutation(mutate_userReverseRemoveItem, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_reserve_ticket_items']
    });

    useMemo(() => {
        setSmeWarehouses(dataSmeWarehouses)
    }, [dataSmeWarehouses])

    const optionsStore = useMemo(() => {
        const stores = dataStores?.sc_stores?.map(store => {
            let findedChannel = dataStores?.op_connector_channels?.find(_ccc => _ccc.code == store.connector_channel_code);

            return {
                label: store?.name,
                value: store?.id,
                logo: findedChannel?.logo_asset_url
            };
        });

        return stores;
    }, [dataStores]);

    const value = {
        smeWarehouses,
        setSmeWarehouses,
        optionsStore,
        userReserveRetryByVariant,
        loadingUserReserveRetryByVariant,
        userReserveRemoveItem,
        loadingUserReserveRemoveItem,
    }

    return (
        <ProductsReserveDetailContext.Provider value={value}>
          {children}
        </ProductsReserveDetailContext.Provider>
      );
}