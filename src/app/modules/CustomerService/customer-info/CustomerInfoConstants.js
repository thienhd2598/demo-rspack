import React from "react";
import { FormattedMessage } from 'react-intl';

export const ORDER_CUSTOMER_STATUS = {
    "PENDING": <FormattedMessage defaultMessage="Chờ duyệt" />,
    "READY_TO_SHIP": <FormattedMessage defaultMessage="Chờ đóng gói" />,
    "PROCESSED": <FormattedMessage defaultMessage="Chờ lấy hàng" />,
    "SHIPPED": <FormattedMessage defaultMessage="Đã giao cho ĐVVC" />,
    "TO_CONFIRM_RECEIVE": <FormattedMessage defaultMessage="Đã giao cho người mua" />,
    "COMPLETED": <FormattedMessage defaultMessage="Hoàn thành" />,
    "CANCELLED": <FormattedMessage defaultMessage="Hủy" />,
    "OTHER": <FormattedMessage defaultMessage="Khác" />,
};

export const RETURN_ORDER_CUSTOMER_STATUS = {
    "REQUESTED": <FormattedMessage defaultMessage="Yêu cầu hoàn" />,
    "ACCEPTED": <FormattedMessage defaultMessage="Đồng ý hoàn" />,
    "CANCELLED": <FormattedMessage defaultMessage="Hủy yêu cầu" />,
    "JUDGING": <FormattedMessage defaultMessage="Sàn đang xem xét" />,
    "REFUND_PAID": <FormattedMessage defaultMessage="Hoàn tiền thành công" />,
    "CLOSED": <FormattedMessage defaultMessage="Sàn đóng yêu cầu" />,
    "PROCESSING": <FormattedMessage defaultMessage="Đang xử lý hoàn" />,
    "SELLER_DISPUTE": <FormattedMessage defaultMessage="Đang khiếu nại" />,
}