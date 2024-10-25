import React from 'react';
import { FormattedMessage } from 'react-intl';

const OPTIONS_CHANNEL = [
    { value: 'shopee', label: 'Shopee' },
    { value: 'lazada', label: 'Lazada' },
    { value: 'tiktok', label: 'Tiktok' },
    { value: 'other', label: <FormattedMessage defaultMessage='Khác' /> },
];

const OPTIONS_LOGISTIC_PICKUP = [
    { value: 1, label: 'ĐVVC đến lấy hàng ' },
    { value: 2, label: 'Tự mang hàng ra bưu cục' },
];

const OPTIONS_TYPE_DELIVERY = [
    { value: '1', label: 'Tự giao hàng' },
    { value: '2', label: 'Giao hàng bởi đơn vị vận chuyển' },
];

const OPTIONS_PAYMENT_METHOD = [
    { value: 'Thanh toán khi nhận hàng', label: <FormattedMessage defaultMessage='Thanh toán khi nhận hàng' /> },
    { value: 'Thanh toán ngay - tiền mặt', label: <FormattedMessage defaultMessage='Thanh toán ngay - tiền mặt' /> },
    { value: 'Thanh toán ngay - chuyển khoản', label: <FormattedMessage defaultMessage='Thanh toán ngay - chuyển khoản' /> },
];

const OPTIONS_UNIT = [
    { label: 'đ', value: 0 },
    { label: '%', value: 1 },
]

const optionsTemplate = [
    {
        value: '',
        label:  <FormattedMessage defaultMessage="Mẫu thông tin cơ bản" />,
    },
    {
      value: 'viettel_post',
      label: <FormattedMessage defaultMessage="Mẫu tải lên ViettelPost" />,
  },
  ];
  
export { optionsTemplate,OPTIONS_LOGISTIC_PICKUP,  OPTIONS_CHANNEL, OPTIONS_PAYMENT_METHOD, OPTIONS_UNIT, OPTIONS_TYPE_DELIVERY };