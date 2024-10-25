import { FormattedMessage, defineMessages } from "react-intl";
import React from "react";
const WARNING_MSG = (
  <FormattedMessage defaultMessage="Chú ý: Khi đã xử lý nhập kho, thì không thể hủy nhập kho cho đơn hàng hoàn" />
);
const TITLE_HEAD = (
  <FormattedMessage defaultMessage="Danh sách đơn cần xử lý" />
);


const CREATION_METHODS = [
  {
    value: 2,
    label: <FormattedMessage defaultMessage="Nhập kho" />,
  },
  {
    value: 1,
    label: <FormattedMessage defaultMessage="Không nhập kho" />,
  },
];

const defineText = defineMessages({
  text1: {
    defaultMessage:"Mã vận đơn hoàn"
  },
  text2: {
    defaultMessage: "Mã trả hàng"
  }
})
const OPTIONS_SELECT = [
  {
    value: "tracking_number",
    label: defineText.text1
  },
  {
    value: "ref_return_id",
    label: defineText.text2
  },
];

const TYPE_RETURN = 1
const PROVIDER_WH = 2
export {
  PROVIDER_WH,
  TYPE_RETURN,
  OPTIONS_SELECT,
  CREATION_METHODS,
  TITLE_HEAD,
  WARNING_MSG,
};
