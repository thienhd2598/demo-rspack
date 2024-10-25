import { FormattedMessage } from 'react-intl'
import React from 'react'

const STATUS_ORDER = [
  {
    title: <FormattedMessage defaultMessage="Yêu cầu hoàn" />,
    value: "REQUESTED",
    sub: [],
  },
  {
    title: "Đang xử lý",
    value: ["PROCESSING", "SELLER_DISPUTE", "JUDGING"],
    sub: [
      {
        title: <FormattedMessage defaultMessage="Đang xử lý hoàn" />,
        value: "PROCESSING",
        default: true,
      },
      {
        title: <FormattedMessage defaultMessage="Đang khiếu nại" />,
        value: "SELLER_DISPUTE",
      },
      {
        title: <FormattedMessage defaultMessage="Sàn đang xem xét" />,
        value: "JUDGING",
      },
    ],
  },
  {
    title: <FormattedMessage defaultMessage="Đồng ý hoàn" />,
    value: "ACCEPTED",
    sub: [],
  },
  {
    title: <FormattedMessage defaultMessage="Hoàn tiền thành công" />,
    value: "REFUND_PAID",
    sub: [],
  },
  {
    title: <FormattedMessage defaultMessage="Hủy yêu cầu" />,
    value: "CANCELLED",
    sub: [],
  },
  {
    title: <FormattedMessage defaultMessage="Sàn đóng yêu cầu" />,
    value: "CLOSED",
    sub: [],
  },
];

const STATUS_ORDER_FAIL = [
  {
    title: <FormattedMessage defaultMessage="Thất lạc & hư hỏng" />,
  },
  {
    title: <FormattedMessage defaultMessage="Hủy trước khi giao ĐVVC" />,
  },
];

const STATUS_WAREHOUSING = [
  {
    value: 0,
    label: <FormattedMessage defaultMessage="Chưa xử lý" />,
  },
  {
    value: 1,
    label: <FormattedMessage defaultMessage="Không nhập kho" />,
  },
  {
    value: 2,
    label: <FormattedMessage defaultMessage="Nhập kho một phần" />,
  },
  {
    value: 3,
    label: <FormattedMessage defaultMessage="Nhập kho toàn bộ" />,
  },
];

const RETURN_TYPES = [
  {
    value: "1",
    label: <FormattedMessage defaultMessage="Sản phẩm" />,
  },
  {
    value: "2",
    label: <FormattedMessage defaultMessage="Xử lý đơn hàng" />,
  },
  {
    value: "3",
    label: <FormattedMessage defaultMessage="Đơn vị vận chuyển" />,
  },
  {
    value: "4",
    label: <FormattedMessage defaultMessage="Người mua" />,
  },
];

const SEARCH_DATE_OPTIONS = [
  { value: 'order_at', label: <FormattedMessage defaultMessage="Thời gian tạo đơn" /> },
  { value: 'reverse_request_time', label: <FormattedMessage defaultMessage="Thời gian tạo hoàn" /> },
];

const TAB_STATUS = [
  { key: "/orders/refund-order", title: <FormattedMessage defaultMessage="Đơn hoàn" /> },
  { key: "/orders/fail-delivery-order", title: <FormattedMessage defaultMessage="Hủy bất thường" /> },
];

const RETURN_PROCESS_RETURN_TYPE = {
  RETURN: 1,
  CANCEL: 2,
};

const RETURN_PROCESS_IMPORT_TYPE = {
  NONE_ACTION: 1,
  IMPORT_ACTION: 2,
};

export {
  RETURN_PROCESS_IMPORT_TYPE,
  RETURN_PROCESS_RETURN_TYPE,
  STATUS_ORDER,
  STATUS_ORDER_FAIL,
  STATUS_WAREHOUSING,
  RETURN_TYPES,
  TAB_STATUS,
  SEARCH_DATE_OPTIONS
};