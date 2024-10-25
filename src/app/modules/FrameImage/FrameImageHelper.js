import React from "react";
import { FormattedMessage } from 'react-intl';

const APPLY_TYPE_FRAME = [
    { value: 4, label: <FormattedMessage defaultMessage="Chỉ áp dụng cho ảnh gốc" /> },
    { value: 1, label: <FormattedMessage defaultMessage="Áp dụng cho ảnh bìa sản phẩm" /> },
    { value: 2, label: <FormattedMessage defaultMessage="Áp dụng cho tất cả ảnh sản phẩm" /> },
];

const OPTIONS_FRAME = [
    { value: 0, label: <FormattedMessage defaultMessage="Khung đè lên ảnh" /> },
    { value: 1, label: <FormattedMessage defaultMessage="Ảnh đè lên khung" /> },
];

const TABS_FRAME = [
    { value: 1, label: <FormattedMessage defaultMessage="Khung ảnh tĩnh" /> },
    { value: 0, label: <FormattedMessage defaultMessage="Khung ảnh động" /> },
];

const STATUS_LIST_SCHEDULED_FRAME = [
    {
        title: <FormattedMessage defaultMessage='Tất cả' />,        
        status: ""
    },
    {
        title: <FormattedMessage defaultMessage='Chờ áp khung' />,
        status: 1,
        color: '#0D6EFD'
    },
    {
        title: <FormattedMessage defaultMessage='Đang áp khung' />,
        status: 2,
        color: '#FE5629'
    },
    {
        title: <FormattedMessage defaultMessage='Kết thúc' />,
        status: 3,
        color: '#00EE76'
    },
    {
        title: <FormattedMessage defaultMessage='Áp & gỡ khung bị lỗi' />,
        status: 4
    },
];

export { OPTIONS_FRAME, APPLY_TYPE_FRAME, STATUS_LIST_SCHEDULED_FRAME, TABS_FRAME };