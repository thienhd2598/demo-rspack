import React, { Fragment, memo, useMemo } from 'react';
import { useIntl } from "react-intl";
const OrderMapStatusSeller = ({ platform_status, channel_code }) => {
    const {formatMessage} = useIntl()
    const status_name = () => {
        let status_name = '';
        switch (channel_code) {
            case 'shopee':
                switch (platform_status) {
                    case 'UNPAID':
                        status_name = formatMessage({defaultMessage: 'Chờ xác nhận'})
                        break;
                    case 'READY_TO_SHIP':
                        status_name = formatMessage({defaultMessage:'Chưa xử lý '})
                        break;
                    case 'PROCESSED':
                        status_name = formatMessage({defaultMessage:'Đã xử lý'})
                        break;
                    case 'SHIPPED':
                    case 'TO_CONFIRM_RECEIVE':
                    case 'IN_CANCEL':
                        status_name = formatMessage({defaultMessage:'Đang giao'})
                        break;
                    case 'COMPLETED':
                        status_name = formatMessage({defaultMessage:'Đã giao'})
                        break;
                    case 'CANCELLED':
                        status_name = formatMessage({defaultMessage:'Đơn huỷ'})
                        break;
                    case 'TO_RETURN':
                        status_name = formatMessage({defaultMessage:'Đang xử lý hoàn'})
                        break;
                    case 'RETURNED':
                        status_name = formatMessage({defaultMessage:'Trả hàng'})
                        break;


                    default:
                        break;
                }
                break;
            case 'lazada':
                switch (platform_status) {
                    case 'unpaid':
                        status_name = formatMessage({defaultMessage:'Chưa thanh toán'})
                        break;
                    case 'pending':
                        status_name = formatMessage({defaultMessage:'Chờ xử lý'})
                        break;
                    case 'packed':
                    case 'ready_to_ship_pending':
                        status_name = formatMessage({defaultMessage:'Chờ đóng gói'})
                        break;
                    case 'ready_to_ship':
                        status_name = formatMessage({defaultMessage:'Chờ bàn giao'})
                        break;
                    case 'repacked':
                    case 'shipped':
                        status_name = formatMessage({defaultMessage:'Đang vận chuyển'})
                        break;
                    case 'failed_delivery':
                    case 'shipped_back':
                    case 'shipped_back_failed':
                        status_name = formatMessage({defaultMessage:'Giao hàng thất bại'})
                        break;
                    case 'lost_by_3pl':
                    case 'damaged_by_3pl':
                        status_name = formatMessage({defaultMessage:'Thất lạc và hư hỏng'})
                        break;
                    case 'delivered':
                        status_name = formatMessage({defaultMessage:'Đã giao hàng'})
                        break;
                    case 'canceled':
                        status_name = formatMessage({defaultMessage:'Huỷ đơn hàng'})
                        break;
                    case 'returned':
                        status_name = formatMessage({defaultMessage:'Trả hàng'})
                        break;

                    default:
                        break;
                }
                break;
            case 'tiktok':
                switch (platform_status) {
                    case '100':
                        status_name = formatMessage({defaultMessage:'Chưa thanh toán'})
                        break;
                    case '111':
                        status_name = formatMessage({defaultMessage:'Đang chờ vận chuyển'})
                        break;
                    case '112':
                        status_name = formatMessage({defaultMessage:'Đang chờ lấy hàng'})
                        break;
                    case '121':
                        status_name = formatMessage({defaultMessage:'Đã vận chuyển (Đang vận chuyển)'})
                        break;
                    case '122':
                        status_name = formatMessage({defaultMessage:'Đã vận chuyển (Đã giao hàng)'})
                        break;
                    case '130':
                    case '51':
                    case '99':
                        status_name = formatMessage({defaultMessage:'Đã hoàn thành'})
                        break;
                    case '140':
                        status_name = formatMessage({defaultMessage:'Huỷ đơn hàng'})
                        break;
                    default:
                        break;
                }
                break;

            default:
                break;
        }
        return status_name;
    }
    return (
        <Fragment>
            {status_name()}
        </Fragment>
    )
};

export default memo(OrderMapStatusSeller);