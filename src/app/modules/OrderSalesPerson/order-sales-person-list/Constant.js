import React, { Fragment, memo, useEffect, useMemo } from 'react';

import { FormattedMessage, defineMessages } from 'react-intl';


const TABS = [
    {
        title: <FormattedMessage defaultMessage="Trong vòng 90 ngày"/>,
        key: 1,
    },
    {
        title: <FormattedMessage defaultMessage="Lịch sử"/>,
        key: 2,
    },

];

const OPTIONS_WAREHOUSE_FILTER = (dataScWareHouse, dataSmeWarehouse) => [
  {
    value: 1,
    label: <FormattedMessage defaultMessage="Kho kênh bán"/>,
    children: dataScWareHouse?.scGetWarehouses?.filter(wh => wh?.warehouse_type == 1)?.map(wh => ({
      value: wh?.id,
      label: wh?.warehouse_name,
      parent_value: 1
    }))
  },
  {
    value: 2,
    label: <FormattedMessage defaultMessage="Kho vật lý"/>,
    children: dataSmeWarehouse?.sme_warehouses?.map(wh => ({
      value: wh?.id,
      label: wh?.name,
      parent_value: 2
    }))
  },
];


const OPTIONS_TYPE_PARCEL = [
  {
    value: 1,
    label: "Sản phẩm đơn lẻ (Số lượng 1)",
  },
  {
    value: 2,
    label:"Sản phẩm đơn lẻ (Số lượng nhiều)",
  },
  {
    value: 3,
    label:"Nhiều sản phẩm",
  },
  {
    value: 4,
    label:"Có sản phẩm quà tặng",
  },

  {
    value: 5,
    label:"Có ghi chú",
  },
];


const OPTIONS_SEARCH_BY_TIME = [
    {
      value: "order_at",
      label: <FormattedMessage defaultMessage="Thời gian tạo đơn hàng"/>,
    },
    {
      value: "paid_at",
      label: <FormattedMessage defaultMessage="Thời gian thanh toán"/>,
    },
    {
      value: "shipped_at",
      label: <FormattedMessage defaultMessage="Thời gian ĐVVC lấy hàng"/>,
    },
  ];

  const OPTIONS_SEARCH = [
    {
      value: "ref_order_id",
      label: <FormattedMessage defaultMessage="Mã đơn hàng"/>,
    },
    {
      value: "tracking_number",
      label: <FormattedMessage defaultMessage="Mã vận đơn"/>,
    },
    {
      value: "system_package_number",
      label: <FormattedMessage defaultMessage="Mã kiện hàng"/>,
    },
  ];

  const KEYS_IN_BOX_SEARCH = [
    "shipping_unit",
    "payments",
    "type_parcel",
    "print_status",
  ];


  const LIGHT_BULB_SVG = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" style={{ color: '#055160' }} className="bi bi-lightbulb mr-2" viewBox="0 0 16 16">
                          <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z" />
                        </svg>
  const MANUAL_ORDER_SVG =  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-primary bi bi-hand-index" viewBox="0 0 16 16">
                            <path d="M6.75 1a.75.75 0 0 1 .75.75V8a.5.5 0 0 0 1 0V5.467l.086-.004c.317-.012.637-.008.816.027.134.027.294.096.448.182.077.042.15.147.15.314V8a.5.5 0 1 0 1 0V6.435l.106-.01c.316-.024.584-.01.708.04.118.046.3.207.486.43.081.096.15.19.2.259V8.5a.5.5 0 0 0 1 0v-1h.342a1 1 0 0 1 .995 1.1l-.271 2.715a2.5 2.5 0 0 1-.317.991l-1.395 2.442a.5.5 0 0 1-.434.252H6.035a.5.5 0 0 1-.416-.223l-1.433-2.15a1.5 1.5 0 0 1-.243-.666l-.345-3.105a.5.5 0 0 1 .399-.546L5 8.11V9a.5.5 0 0 0 1 0V1.75A.75.75 0 0 1 6.75 1M8.5 4.466V1.75a1.75 1.75 0 1 0-3.5 0v5.34l-1.2.24a1.5 1.5 0 0 0-1.196 1.636l.345 3.106a2.5 2.5 0 0 0 .405 1.11l1.433 2.15A1.5 1.5 0 0 0 6.035 16h6.385a1.5 1.5 0 0 0 1.302-.756l1.395-2.441a3.5 3.5 0 0 0 .444-1.389l.271-2.715a2 2 0 0 0-1.99-2.199h-.581a5 5 0 0 0-.195-.248c-.191-.229-.51-.568-.88-.716-.364-.146-.846-.132-1.158-.108l-.132.012a1.26 1.26 0 0 0-.56-.642 2.6 2.6 0 0 0-.738-.288c-.31-.062-.739-.058-1.05-.046zm2.094 2.025" />
                          </svg>
export {
  MANUAL_ORDER_SVG,
  LIGHT_BULB_SVG,
  OPTIONS_TYPE_PARCEL,
  OPTIONS_WAREHOUSE_FILTER,
  KEYS_IN_BOX_SEARCH,
  OPTIONS_SEARCH,
  OPTIONS_SEARCH_BY_TIME,
  TABS
}