import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useHistory } from 'react-router-dom';
import queryString from "querystring";
import { useQuery } from "@apollo/client";
import query_sfSessionHandoverShippingCarrier from "../../../../../graphql/query_sfSessionHandoverShippingCarrier";
import query_smeCatalogStores from "../../../../../graphql/query_smeCatalogStores";
import query_sfSessionReceivedShippingCarrier from "../../../../../graphql/query_sfSessionReceivedShippingCarrier";

const OrderSessionHandoverContext = createContext();

export function useOrderSessionHandoverContext() {
    return useContext(OrderSessionHandoverContext);
};

const DELIVERY = "delivery";
const RECEIVE = "receive"

export function OrderSessionHandoverProvider({ children }) {
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const [paramsDelivery, setParamsDelivery] = useState({});
    const [paramsReceive, setParamsReceive] = useState({});

    useEffect(() => {
        let t = params?.tab ?? DELIVERY;
        setParams(t, params)
    }, []);

    const setParams = (t, p) => {
        p = { ...p, tab: t }
        history.push(`${location.pathname}?${queryString.stringify(p)}`);
        if (t == DELIVERY) {
            setParamsDelivery(p)
        }
        else {
            setParamsReceive(p)
        }
    }

    const tab = useMemo(() => {
        let t = params?.tab ?? DELIVERY

        return t;
    }, [params?.tab])

    const setTab = (t) => {
        history.push(`${location.pathname}?${queryString.stringify({ ...(t === DELIVERY ? paramsDelivery : paramsReceive), tab: t })}`);
    }

    const { data: dataShippingCarrierDelivery } = useQuery(query_sfSessionHandoverShippingCarrier, {
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataShippingCarrierReceived } = useQuery(query_sfSessionReceivedShippingCarrier, {
        fetchPolicy: 'cache-and-network'
    });

    const optionsShippingCarrier = useMemo(() => {
        const options = tab == DELIVERY ?
            dataShippingCarrierDelivery?.sfSessionHandoverShippingCarrier?.shipping_carrier?.map(item => ({
                value: item,
                label: item
            })) :
            dataShippingCarrierReceived?.sfSessionReceivedShippingCarrier?.shipping_carrier?.map(item => ({
                value: item,
                label: item
            }))

        return options || []
    }, [dataShippingCarrierDelivery, tab, dataShippingCarrierReceived]);

    const { data: dataCatalogStores } = useQuery(query_smeCatalogStores, {
        variables: {
            where: {
                fulfillment_by: { _eq: 1 },
                status: { _eq: 10 }
            }
        },
        fetchPolicy: 'cache-and-network'
    });

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
            tab,
            setTab,
            _params: tab === "delivery" ? paramsDelivery : paramsReceive,
            setParams,
            optionsShippingCarrier,
            optionsSmeWarehouse
        }
    }, [tab, setTab, paramsDelivery, paramsReceive, optionsShippingCarrier, optionsSmeWarehouse]);
    return (
        <OrderSessionHandoverContext.Provider value={values}>
            {children}
        </OrderSessionHandoverContext.Provider>
    )
}