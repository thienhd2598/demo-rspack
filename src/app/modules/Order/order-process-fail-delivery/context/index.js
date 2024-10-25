import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const OrderProcessContext = createContext();

export function useOrderProcessContext() {
    return useContext(OrderProcessContext);
};

export function OrderProcessProvider({ children }) {
    const [orders, setOrders] = useState([]);
    const [ordersAdd, setOrdersAdd] = useState([]);    
    const [ordersFiltered, setOrdersFiltered] = useState(orders);
    const [showModal, setShowModal] = useState({
        confirmDelete: false,
        uploadFile: false,
        note: false
    });

    const onToggleModal = useCallback(
        (type, action = 'show') => {
            setShowModal(prev => ({
                ...prev,
                [type]: action == 'show'
            }))
        }, [showModal]
    );

    

    const value = useMemo(
        () => {
            return {
                showModal, onToggleModal,
                orders, setOrders,
                ordersFiltered, setOrdersFiltered,
                ordersAdd, setOrdersAdd
            }
        }, [showModal, onToggleModal, orders, ordersAdd, ordersFiltered]
    );

    return (
        <OrderProcessContext.Provider value={value}>
            {children}
        </OrderProcessContext.Provider>
    )
}