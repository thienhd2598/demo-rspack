import React, { Fragment, memo, useEffect, useMemo } from 'react';
import { STATUS_ORDER_DETAIL, STATUS_ORDER_PACK } from './OrderUIHelpers';
import { defineMessages } from 'react-intl';

const mss = defineMessages({
    orther: {
        defaultMessage: 'Khác'
    }
});

// const OrderStatusName = (order) => {

//     let order_status = order?.status;
//     if (order_status == 'READY_TO_SHIP' && order?.logisticsPackages?.filter(item => item.pack_status == 'pending').length > 0) {
//         order_status = 'pending'
//     }

//     if (order_status == 'READY_TO_SHIP' && order?.logisticsPackages?.filter(item => item.pack_status == 'pack_error').length > 0) {
//         order_status = 'pack_error'
//     }

//     if (order_status == 'PROCESSED' && order?.logisticsPackages?.filter(item => item.pack_status == 'creating').length > 0) {
//         order_status = 'creating'
//     }

//     if (order_status == 'PROCESSED' && order?.logisticsPackages?.filter(item => item.pack_status == 'packing').length > 0) {
//         order_status = 'packing'
//     }

//     if (order_status == 'PROCESSED' && order?.logisticsPackages?.filter(item => item.pack_status == 'packed').length > 0) {
//         order_status = 'packed'
//     }

//     if (order_status == 'READY_TO_SHIP' && order?.logisticsPackages?.filter(item => item.pack_status == 'pack_lack').length > 0) {
//         order_status = 'pack_lack'
//     }

//     let status = STATUS_ORDER_DETAIL[order_status] || mss.orther;

//     if (status?.defaultMessage == 'Khác') {
//         order_status = "Other"
//     }

//     return { status: status, order_status: order_status };
// };
const PackStatusName = (packStatus, statusOrder, isWaitShippingCarrier = false) => {
    let pack_status = 'other'    

    if (statusOrder == 'PENDING') {
        pack_status = 'pending'
    }

    if (packStatus == 'pending') {
        pack_status = 'waiting_for_packing'
    }

    if (packStatus == 'packing') {
        pack_status = 'packing'
    }

    if (packStatus == 'packed') { 
        pack_status = 'packed'
    }

    if (packStatus == 'shipping') {
        pack_status = 'shipping'
    }
    
    if (packStatus == 'shipped') {
        pack_status = 'shipped'
    }

    if (packStatus == 'completed') {
        pack_status = 'completed'
    }

    if (packStatus == 'cancelled') {
        pack_status = 'cancelled'
    }

    if (packStatus == 'in_cancel') {
        pack_status = 'in_cancel'
    }

    if (isWaitShippingCarrier) {
        pack_status = 'wait_shipping_carrier'
    }

    let status = STATUS_ORDER_PACK[pack_status] || mss.orther;

    return { status: status, pack_status: pack_status };
};

export { PackStatusName };