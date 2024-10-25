/*
 * Created by duydatpham@gmail.com on 09/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import _ from 'lodash'
import { createApolloClientSSR } from '../../../apollo';
import query_sme_catalog_product_aggregate from '../../../graphql/query_sme_catalog_product_aggregate';
import query_sme_catalog_product_variant_aggregate from '../../../graphql/query_sme_catalog_product_variant_aggregate';
import { defineMessages } from 'react-intl';
import query_sme_catalog_product_variant from '../../../graphql/query_sme_catalog_product_variant';
let client = createApolloClientSSR()

export const ATTRIBUTE_VALUE_TYPE = {
  "TEXT": 'text',
  "DATE": 'date',
  "NUMERIC": 'numeric',
  "SINGLE_SELECT": 'single_select',
  "MULTIPLE_SELECT": 'multiple_select'
}

export const validatePriceVariant = (variant) => {
  if (variant.length == 1) {
    return null;
  }
  let min = _.minBy(variant, _variant => _variant.price).price
  let max = _.maxBy(variant, _variant => _variant.price).price

  if ((max / (min || 1)) > 5) {
    return 'PRODUCT.VALIDATE_FORM.PRICE_INVALID'
  }
  // if ((max - min) / (min || 1) > 0.2) {
  //   return 'PRODUCT.VALIDATE_FORM.PRICE_INVALID'
  // }

  return null;
}

export const OPTIONS_TYPE_FILTER = [
  { value: 'production_date', label:'Ngày nhập hàng'},
  { value: 'expiration_date', label: 'Ngày hết hạn' },
]

export const PRODUCT_TYPE_OPTIONS = [
  {value: 0, label: "Sản phẩm thường"},
  {value:1, label: "Sản phẩm combo"},
  {value: 2, label: "Sản phẩm có hạn sử dụng"}
]

export const TYPE_COUNT = {
  DANG_HOAT_DONG: 'danghoatdong',
  SAP_HET_HANG: 'saphethang',
  HET_HANG: 'hethang',
  DA_AN: 'daan',
  LUU_NHAP: 'draf',
}


export const PRODUCT_SYNC_STATUS = {
  SYNC_STATUS_LOADED: 0,
  SYNC_STATUS_SYNCED: 1,
  SYNC_STATUS_OUT_OF_SYNC: 2,
  SYNC_STATUS_SYNCING: 3,
  SYNC_STATUS_ERROR: 4,
}

export const getQueryByType = (type) => {
  if (type == TYPE_COUNT.DANG_HOAT_DONG) {
    return { status: { _eq: "10" } }
  }
  if (type == TYPE_COUNT.SAP_HET_HANG) {
    return { _and: [{ total_stock_on_hand: { _gt: 0 } }, { total_stock_on_hand: { _lte: 10 } }] }
  }
  if (type == TYPE_COUNT.HET_HANG) {
    return { total_stock_on_hand: { _eq: 0 } }
  }
  if (type == TYPE_COUNT.DA_AN) {
    return { status: { _eq: "0" } }
  }
  if (type == TYPE_COUNT.LUU_NHAP) {
    return { status: { _eq: "1" } }
  }
  return {}
}

export const queryGetSmeVariantsByIds = async (ids) => {
  if (ids?.length == 0) return [];

  const { data } = await client.query({
      query: query_sme_catalog_product_variant,
      variables: {
        where: {id: {_in: ids}}
      },
      fetchPolicy: "network-only",
  });
  return data || {};
}

export const queryCheckExistSku = async (product_id, code) => {
  let { data } = await client.query({
    query: query_sme_catalog_product_variant_aggregate,
    fetchPolicy: 'network-only',
    variables: {
      "where": {
        "sku": { "_eq": code },
        ...(!!product_id ? { product_id: { _neq: product_id } } : {})
      }
    }
  })
  return data?.sme_catalog_product_variant_aggregate?.aggregate?.count > 0;
}
export const queryCheckExistSkuMain = async (product_id, code) => {
  let { data } = await client.query({
    query: query_sme_catalog_product_aggregate,
    fetchPolicy: 'network-only',
    variables: {
      "where": {
        "sku": { "_eq": code },
        ...(!!product_id ? { id: { _neq: product_id } } : {})
      }
    }
  })
  return data?.sme_catalog_product_aggregate?.aggregate?.count > 0;
}
export const queryCheckExistGtin = async (product_id, code) => {
  if (!code) return false;

  let { data } = await client.query({
    query: query_sme_catalog_product_variant_aggregate,
    fetchPolicy: 'network-only',
    variables: {
      "where": {
        "gtin": { "_eq": code },
        ...(!!product_id ? { product_id: { _neq: product_id } } : {})
      }
    }
  })
  return data?.sme_catalog_product_variant_aggregate?.aggregate?.count > 0;
}

export function downloadFile(url, filename) {
  fetch(url)
      .then(response => response.blob())
      .then(blob => {
          const blobURL = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = blobURL;
          link.download = filename;
          link.click();
          
          window.URL.revokeObjectURL(blobURL);
      })
      .catch(error => console.error('Error downloading file:', error));
}

export const ProductStatusCssClasses = ["success", "info", ""];
export const ProductStatusTitles = ["Selling", "Sold"];
export const ProductConditionCssClasses = ["success", "danger", ""];
export const ProductConditionTitles = ["New", "Used"];
export const defaultSorted = [{ dataField: "id", order: "asc" }];
export const sizePerPageList = [
  { text: "3", value: 3 },
  { text: "5", value: 5 },
  { text: "10", value: 10 }
];
export const initialFilter = {
  filter: {
    model: "",
    manufacture: "",
    VINCode: ""
  },
  sortOrder: "asc", // asc||desc
  sortField: "VINCode",
  pageNumber: 1,
  pageSize: 10
};
export const AVAILABLE_COLORS = [
  "Red",
  "CadetBlue",
  "Eagle",
  "Gold",
  "LightSlateGrey",
  "RoyalBlue",
  "Crimson",
  "Blue",
  "Sienna",
  "Indigo",
  "Green",
  "Violet",
  "GoldenRod",
  "OrangeRed",
  "Khaki",
  "Teal",
  "Purple",
  "Orange",
  "Pink",
  "Black",
  "DarkTurquoise"
];

export const AVAILABLE_MANUFACTURES = [
  "Pontiac",
  "Kia",
  "Lotus",
  "Subaru",
  "Jeep",
  "Isuzu",
  "Mitsubishi",
  "Oldsmobile",
  "Chevrolet",
  "Chrysler",
  "Audi",
  "Suzuki",
  "GMC",
  "Cadillac",
  "Infinity",
  "Mercury",
  "Dodge",
  "Ram",
  "Lexus",
  "Lamborghini",
  "Honda",
  "Nissan",
  "Ford",
  "Hyundai",
  "Saab",
  "Toyota"
];

const mssLang = defineMessages({
  originImgHas: {
    defaultMessage: 'Sản phẩm đã có ảnh gốc'
  },
  originImgNotHas: {
    defaultMessage: 'Sản phẩm chưa có ảnh gốc'
  },
  originConnectHas: {
    defaultMessage: 'Đã liên kết sản phẩm sàn'
  },
  originConnectNotHas: {
    defaultMessage: 'Chưa liên kết sản phẩm sàn'
  },
  combo: {
    defaultMessage: 'Sản phẩm combo'
  },
  manual: {
    defaultMessage: 'Sản phẩm thường'
  },
  updated_vat: {
    defaultMessage: 'Đã cập nhật giá vốn và VAT'
  },
  updating_vat: {
    defaultMessage: 'Chưa cập nhật giá vốn hoặc VAT'
  },
  expired: {
    defaultMessage: 'Sản phẩm có hạn sử dụng'
  }
})

const conversionCalculationMsg = defineMessages({
  multiplication: {
    defaultMessage: 'Phép nhân'
  },
  division: {
    defaultMessage: 'Phép chia'
  },
})

const CONVERSION_CALCULATION = [
  { value: 0, label: conversionCalculationMsg.multiplication },
  { value: 1, label: conversionCalculationMsg.division }
]

const OPTIONS_ORIGIN_IMAGE = [
  { value: 1, name: mssLang.originImgHas },
  { value: 0, name: mssLang.originImgNotHas }
];

const OPTIONS_CONNECTED = [
  { value: 1, name: mssLang.originConnectHas },
  { value: 0, name: mssLang.originConnectNotHas }
];

const PRODUCT_TYPE = [
  { value: 0, name: mssLang.manual },
  { value: 1, name: mssLang.combo },
  { value: 2, name: mssLang.expired },
];

const STATUS_VAT = [
  { value: 0, name: mssLang.updated_vat },
  { value: 1, name: mssLang.updating_vat }
];

const SERIAL = 1
const NON_SERIAL = 2

export {NON_SERIAL,SERIAL,  STATUS_VAT, OPTIONS_ORIGIN_IMAGE, OPTIONS_CONNECTED, PRODUCT_TYPE, CONVERSION_CALCULATION }