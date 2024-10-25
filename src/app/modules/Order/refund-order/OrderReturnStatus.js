import { FormattedMessage } from 'react-intl'
import React from 'react';

const STATUS_ORDER_REFUND = [
  {
    title: <FormattedMessage defaultMessage="Đang xử lý trả hàng" />,
    value: "PROCESSING",
    sub: [
      {
        title: <FormattedMessage defaultMessage="Không nhập kho" />,
        value: "PROCESSING",
        default: true,
      },
      {
        title: <FormattedMessage defaultMessage="Nhập kho một phần" />,
        value: "SELLER_DISPUTE",
      },
      {
        title: <FormattedMessage defaultMessage="Nhập kho toàn bộ" />,
        value: "JUDGING",
      },
    ],
  },
  {
    title: <FormattedMessage defaultMessage="Chưa xử lý trả hàng" />,
    value: "REQUEST",
    sub: [],
  },
];

const STATUS_ORDER_RETURN_EXPORT = [
  {
    label: <FormattedMessage defaultMessage="Đồng ý hoàn" />,
    value: "ACCEPTED",
  },
  {
    label: <FormattedMessage defaultMessage="Hoàn tiền thành công" />,
    value: "REFUND_PAID",
  },
  {
    label: <FormattedMessage defaultMessage="Đang xử lý" />,
    value: "PROCESSING",
  },
  {
    label: <FormattedMessage defaultMessage="Đang khiếu nại" />,
    value: "SELLER_DISPUTE",
  },
];

const STATUS_ORDER = [
  {
    title: <FormattedMessage defaultMessage="Yêu cầu hoàn" />,
    value: "REQUESTED",
    sub: [],
  },
  {
    title: <FormattedMessage defaultMessage="Đang xử lý" />,
    value: "PROCESSING",
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
    value: 1,
    label: <FormattedMessage defaultMessage="Sản phẩm" />,
  },
  {
    value: 2,
    label: <FormattedMessage defaultMessage="Xử lý đơn hàng" />,
  },
  {
    value: 3,
    label: <FormattedMessage defaultMessage="Đơn vị vận chuyển" />,
  },
  {
    value: 4,
    label: <FormattedMessage defaultMessage="Người mua" />,
  },
];

const OPTIONS_MAP_SME = [
  {
    value: '0',
    label: <FormattedMessage defaultMessage='Kiện hàng chưa liên kết kho' />,
  },
  {
    value: '1',
    label: <FormattedMessage defaultMessage='Kiện hàng đã liên kết kho' />
  },
];




export { RETURN_TYPES, OPTIONS_MAP_SME, STATUS_WAREHOUSING, STATUS_ORDER, STATUS_ORDER_REFUND, STATUS_ORDER_RETURN_EXPORT };