import React from 'react';
import { FormattedMessage } from 'react-intl';
import dayjs from 'dayjs';

const TABS_REPORT = [
    { 
        id: 1, 
        tittle: <FormattedMessage defaultMessage="Tổng quan" /> ,
        route: '/report/overview'
    },
    // { 
    //     id: 2, 
    //     tittle: <FormattedMessage defaultMessage="Bán hàng" /> ,
    //     route: '/report/sell'    
    // },
    { 
        id: 3, 
        tittle: <FormattedMessage defaultMessage="Sản phẩm" /> ,
        route: '/report/product'
    },
    { 
        id: 4, 
        tittle: <FormattedMessage defaultMessage="Người mua" /> ,
        route: '/report/user'
    },    
    { 
        id: 5, 
        tittle: <FormattedMessage defaultMessage="Hiệu quả kinh doanh" /> ,
        route: '/report/effective-business'
    },    
];

const rexToRGBAColor = (color, alpha = 0.8) => {
    return `rgba(${parseInt(color?.substring(1, 3), 16)}, ${parseInt(color?.substring(3, 5), 16)}, ${parseInt(color?.substring(5, 7), 16)}, ${alpha})`;
}


const predefinedRanges = [
    {
        label: 'Hôm nay',
        value: [dayjs().startOf('day'), dayjs().endOf('day')],
        placement: 'left',
    },
    {
        label: 'Hôm qua',
        value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')],
        placement: 'left',
    },
    {
        label: '7 ngày qua',
        value: [dayjs().subtract(7, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')],
        placement: 'left',
    },
    {
        label: '30 ngày qua',
        value: [dayjs().subtract(30, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')],
        placement: 'left',
    }
      
];

export {
    TABS_REPORT,
    rexToRGBAColor,
    predefinedRanges
}