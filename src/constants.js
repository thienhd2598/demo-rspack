/*
 * Created by duydatpham@gmail.com on 23/07/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
export const WARRANTY_TYPE = [
    {
        label: 'Không Bảo hành',
        value: 'khong_bao_hanh'
    },
    {
        label: 'Bằng Hóa đơn mua hàng',
        value: 'bang_hoa_don_mua_hang'
    },
    {
        label: 'Bằng Tem bảo hành',
        value: 'bang_tem_bao_hanh'
    },
    {
        label: 'Bằng Phiếu bảo hành và Hóa đơn',
        value: 'bang_phieu_bao_hanh_va_hoa_don'
    },
    {
        label: 'Bằng Thẻ bảo hành và Hóa đơn',
        value: 'bang_the_bao_hanh_va_hoa_don'
    },
    {
        label: 'Bảo hành điện tử',
        value: 'bao_hanh_dien_tu'
    },
    {
        label: 'Bảo hành Toàn cầu',
        value: 'bao_hanh_toan_cau'
    },
    {
        label: 'Bằng hộp sản phẩm hoặc Số seri',
        value: 'bang_hop_san_pham_hoac_so_seri'
    },
    {
        label: 'Nhà cung cấp trong nước bảo hành',
        value: 'nha_cung_cap_trong_nuoc_bao_hanh'
    },
    {
        label: 'Bảo hành bởi Nhà sản xuất trong nước',
        value: 'bao_hanh_boi_nha_san_xuat_trong_nuoc'
    },
    {
        label: 'Bảo hành bởi Nhà bán hàng nước ngoài',
        value: 'bao_hanh_boi_nha_ban_hang_nuoc_ngoai'
    },
    {
        label: 'Bảo hành bởi nhà cung cấp trong nước',
        value: 'bao_hanh_boi_nha_cung_cap_trong_nuoc'
    },
]

export const WARRANTY_TIME = [
    {
        label: '1 tháng',
        value: 'month_1'
    },
    {
        label: '2 tháng',
        value: 'month_2'
    },
    {
        label: '3 tháng',
        value: 'month_3'
    },
    {
        label: '4 tháng',
        value: 'month_4'
    },
    {
        label: '5 tháng',
        value: 'month_5'
    },
    {
        label: '6 tháng',
        value: 'month_6'
    },
    {
        label: '7 tháng',
        value: 'month_7'
    },
    {
        label: '8 tháng',
        value: 'month_8'
    },
    {
        label: '9 tháng',
        value: 'month_9'
    },
    {
        label: '10 tháng',
        value: 'month_10'
    },
    {
        label: '11 tháng',
        value: 'month_11'
    },
    {
        label: '12 tháng',
        value: 'month_12'
    },
    {
        label: '15 tháng',
        value: 'month_15'
    },
    {
        label: '18 tháng',
        value: 'month_18'
    },
    {
        label: '1 năm',
        value: 'year_1'
    },
    {
        label: '2 năm',
        value: 'year_2'
    },
    {
        label: '3 năm',
        value: 'year_3'
    },
    {
        label: '4 năm',
        value: 'year_4'
    },
    {
        label: '5 năm',
        value: 'year_5'
    },
    {
        label: '6 năm',
        value: 'year_6'
    },
    {
        label: '7 năm',
        value: 'year_7'
    },
    {
        label: '8 năm',
        value: 'year_8'
    },
    {
        label: '9 năm',
        value: 'year_9'
    },
    {
        label: '10 năm',
        value: 'year_10'
    },
    {
        label: '15 năm',
        value: 'year_15'
    },
    {
        label: '20 năm',
        value: 'year_20'
    },
    {
        label: '25 năm',
        value: 'year_25'
    },
    {
        label: '30 năm',
        value: 'year_30'
    },
    {
        label: '50 năm',
        value: 'year_50'
    },
    {
        label: 'Bảo hành trọn đời',
        value: 'bao_hanh_tron_doi'
    },
]


export const ATTRIBUTE_VALUE_TYPE = {
    "TEXT": 'text',
    "DATE": 'date',
    "DATE_MONTH": 'year_month',
    "TIMESTAMP": 'timestamp',
    "NUMERIC": 'numeric',
    "NUMERIC_INT": 'int',
    "NUMERIC_FLOAT": 'float',
    "SINGLE_SELECT": 'single_select',
    "SINGLE_SELECT_CUSTOM_VALUE": 'single_select_custom_value',
    "MULTIPLE_SELECT": 'multiple_select',
    "MULTIPLE_SELECT_CUSTOM_VALUE": 'multiple_select_custom_value',
}


export const getImageOriginSanValidate = (channel) => {
    if (channel == 'lazada') {
        return {
            maxSize: 3,
            maxWidth: 5000,
            maxHeight: 5000,
            minWidth: 500,
            minHeight: 500,
        }
    }

    if (channel == 'tiktok') {
        return {
            maxSize: 5,
            maxWidth: 5000,
            maxHeight: 5000,
            minWidth: 500,
            minHeight: 500,
        }
    }

    return {
        maxSize: 10,
        maxWidth: 5000,
        maxHeight: 5000,
        minWidth: 500,
        minHeight: 500,
    }
}
export const getImageProductSanValidate = (channel) => {
    if (channel == 'lazada' || channel == 'tiktok')
        return {
            maxSize: 3,
            maxWidth: 5000,
            maxHeight: 5000,
            minWidth: 500,
            minHeight: 500,
        }
    return {
        maxSize: 2,
        maxWidth: 1024,
        maxHeight: 1024,
        minWidth: 500,
        minHeight: 500,
    }
}
