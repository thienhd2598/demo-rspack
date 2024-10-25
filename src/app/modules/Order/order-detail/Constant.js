import React, { Fragment, memo, useEffect, useMemo } from 'react';

import { FormattedMessage, defineMessages } from 'react-intl';
    const HOME_SVG = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    const BANKNOTE_SVG = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-banknote"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
    const MESSAGE_SVG = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-text"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/></svg>
    const TOOLTIP_SVG = <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"></path><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"></path></svg>
    const PROVIDER_STATUS_CREATING = 'creating';
    const PROVIDER_STATUS_ERROR = 'error';
    const PROVIDER_STATUS_CREATED = 'created';
    const PROVIDER_STATUS_PICKED = 'picked';
    const LIGHT_BULB = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#578e9b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lightbulb"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
    const DROPDOWN_SVG = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
    const DROPUP_SVG = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>
    const EYE_SVG = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#787878" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
    const NOT_IMPORT = 1
    const IMPORTED = 2
    const IMPORTED_ALL = 3

    const PROVIDER_STATUS_IMPORTED = 'imported';
    const PROVIDER_STATUS_CANCELLED = 'cancelled';
    const PROVIDER_STATUS_OTHER = 'other';
    const INFO_STATUS = [
        {
            status: PROVIDER_STATUS_CREATING,
            color: '#000000',
            text: <FormattedMessage defaultMessage="Tạo yêu cầu"/>
        },
        {
            status: PROVIDER_STATUS_CREATED,
            color: '#00EE76',
            text: <FormattedMessage defaultMessage="Mới"/>
        },
        {
            status: PROVIDER_STATUS_PICKED,
            color: '#ffaa01',
            text: <FormattedMessage defaultMessage="Đang đóng gói"/>
        },
        {
            status: PROVIDER_STATUS_IMPORTED,
            color: '#00EE76',
            text: <FormattedMessage defaultMessage="Hoàn tất trả hàng"/>
        },
        {
            status: PROVIDER_STATUS_ERROR,
            color: '#F80D0D',
            text: <FormattedMessage defaultMessage="Lỗi"/>
        },
        {
            status: PROVIDER_STATUS_CANCELLED,
            color: '#F80D0D',
            text: <FormattedMessage defaultMessage="Huỷ"/>
        },
        {
            status: PROVIDER_STATUS_OTHER,
            color: '#000000',
            text: <FormattedMessage defaultMessage="Khác"/>
        }
    ]

    export {NOT_IMPORT,IMPORTED, LIGHT_BULB,DROPDOWN_SVG, DROPUP_SVG, EYE_SVG,IMPORTED_ALL, BANKNOTE_SVG, HOME_SVG, TOOLTIP_SVG,MESSAGE_SVG, INFO_STATUS, PROVIDER_STATUS_CREATING, PROVIDER_STATUS_ERROR, PROVIDER_STATUS_PICKED}