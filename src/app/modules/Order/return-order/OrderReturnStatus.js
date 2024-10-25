import { FormattedMessage} from 'react-intl'
import React from 'react'
const STATUS_ORDER = [
    {
      title: <FormattedMessage defaultMessage="Yêu cầu hoàn"/>,
      value: "REQUESTED",
      sub: [],
    },
    {
      title: <FormattedMessage defaultMessage="Đang xử lý"/>,
      value: "PROCESSING",
      sub: [
        {
          title: <FormattedMessage defaultMessage="Đang xử lý hoàn"/>,
          value: "PROCESSING",
          default: true,
        },
        {
          title: <FormattedMessage defaultMessage="Đang khiếu nại"/>,
          value: "SELLER_DISPUTE",
        },
        {
          title: <FormattedMessage defaultMessage="Sàn đang xem xét"/>,
          value: "JUDGING",
        },
      ],
    },
    {
      title: <FormattedMessage defaultMessage="Đồng ý hoàn"/>,
      value: "ACCEPTED",
      sub: [],
    },
    {
      title: <FormattedMessage defaultMessage="Hoàn tiền thành công"/>,
      value: "REFUND_PAID",
      sub: [],
    },
    {
      title: <FormattedMessage defaultMessage="Hủy yêu cầu"/>,
      value: "CANCELLED",
      sub: [],
    },
    {
      title: <FormattedMessage defaultMessage="Sàn đóng yêu cầu"/>,
      value: "CLOSED",
      sub: [],
    },
  ];
export { STATUS_ORDER };