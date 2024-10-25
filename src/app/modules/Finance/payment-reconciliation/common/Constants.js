import {FormattedMessage, defineMessages} from 'react-intl'
import React from 'react'
const defineTextTab = defineMessages({
    pending: {
        defaultMessage: 'Chờ quyết toán'
    },
    processed: {
        defaultMessage: "Đã quyết toán"
    }
})

const defineTextPlatformReconciliation = defineMessages({
  ecommerce: {
      defaultMessage: 'SÀN THƯƠNG MẠI ĐIỆN TỬ'
  },
  manual: {
      defaultMessage: "THỦ CÔNG"
  }
})

const tabs = [
    {
      title: defineTextTab.pending,
      key: "PENDING",
    },
    {
      title: defineTextTab.processed,
      key: "PROCESSED",
    },
  ];

  const PLATFORM_RECONCILIATION = [
    {
      title: defineTextPlatformReconciliation.ecommerce,
      key: "ecommerce",
    },
    {
      title: defineTextPlatformReconciliation.manual,
      key: "manual",
    },
  ];

  const PLATFORM_RECONCILIATION_EXPORT = [
    {
      value: "platform",
      label: defineTextPlatformReconciliation.ecommerce,
    },
    {
      value: "upbase",
      label: defineTextPlatformReconciliation.manual,
    },
  ];

  const defineTextTimeSettlementing = defineMessages({
    time_done: {
        defaultMessage: 'Thời gian đơn hàng hoàn thành'
    },
    time_create_order: {
        defaultMessage: "Thời gian tạo đơn hàng"
    }
})
  const optionsSearchByTimesSettlementing = [
    {
      value: "2",
      label: defineTextTimeSettlementing.time_done,
    },
    {
      value: "3",
      label: defineTextTimeSettlementing.time_create_order,
    }
  ];

  const defineTextTimeSettlemented = defineMessages({
    time_process: {
        defaultMessage: 'Thời gian quyết toán'
    },
    time_order_processed: {
        defaultMessage: "Thời gian đơn hàng hoàn thành"
    },
    time_create_order: {
        defaultMessage: "Thời gian tạo đơn hàng"
    }
})

  const optionsSearchByTimesSettlemented = [
    {
      value: "1",
      label: defineTextTimeSettlemented.time_process,
    },
    {
      value: "2",
      label: defineTextTimeSettlemented.time_order_processed,
    },
    {
      value: "3",
      label: defineTextTimeSettlemented.time_create_order,
    }
  ];

  const defineTextOptionSearch = defineMessages({
    tracking_number: {
        defaultMessage: "Mã đơn hàng"
    },
})

  const optionsSearch = [
    {
      value: "tracking_number",
      label: defineTextOptionSearch.tracking_number,
    }
  ];
  const defineOptionsOverdue = defineMessages({
    all: {
        defaultMessage: "Tất cả"
    },
    over_time: {
        defaultMessage: "Đã quá hạn"
    },
    not_over_time: {
        defaultMessage: "Chưa quá hạn"
    },
})

  const optionsOverdue = [
    {
      value: '',
      label: defineOptionsOverdue.all,
    },
    {
      value: 1,
      label: defineOptionsOverdue.over_time,
    },
    {
      value: 2,
      label: defineOptionsOverdue.not_over_time,
    },
  ];

  const defineTextSub = defineMessages({
    all: {
        defaultMessage: "Tất cả"
    },
    balance: {
        defaultMessage: "Cân bằng"
    },
    abnormal: {
        defaultMessage: "Bất thường"
    },
    abnormal_not_process: {
      defaultMessage: "Chưa xử lý"
    },
    abnormal_processed: {
      defaultMessage: 'Đã xử lý bất thường'
    },
})

  const subTab = [
    {
      title: defineTextSub.all,
      status: ''
    },
    {
      title: defineTextSub.balance,
      status: '1'
    },
    {
      title: defineTextSub.abnormal,
      status: '2',
      sub: [
        {  name: defineTextSub.abnormal_not_process, status: '1', default: true},
        {  name: defineTextSub.abnormal_processed, status: '2'},
      ]
    },
  ]

  const CREATION_METHODS = [
    {
      value: 1,
      label: <FormattedMessage defaultMessage="Lấy theo nền tảng" />,
    },
    {
      value: 2,
      label: <FormattedMessage defaultMessage="Lấy theo ước tính" />,
    },
  ];

  const defineDifferenceStatusText = defineMessages({
    all: {
        defaultMessage: "Tất cả"
    },
    balance: {
        defaultMessage: "Không"
    },
    abnormal: {
        defaultMessage: "Có"
    },
})

  const DIFFERENCE_STATUS = [
    {
      value: 0,
      label: defineDifferenceStatusText.all,
    },
    {
      value: 2,
      label: defineDifferenceStatusText.abnormal,
    },
    {
      value: 1,
      label: defineDifferenceStatusText.balance,
    },
  ]

  const FILE_IMPORT_STAG = 'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/Stagging/File_mau_doi_soat.xlsx'
  const FILE_IMPORT_PROD = 'https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/Stagging/File_mau_doi_soat.xlsx'

  

  export {FILE_IMPORT_STAG, FILE_IMPORT_PROD, PLATFORM_RECONCILIATION_EXPORT,PLATFORM_RECONCILIATION,DIFFERENCE_STATUS, CREATION_METHODS, subTab, optionsOverdue, tabs, optionsSearchByTimesSettlementing, optionsSearchByTimesSettlemented, optionsSearch}