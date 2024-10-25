/*
 * Created by duydatpham@gmail.com on 09/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import _ from 'lodash'
import { createApolloClientSSR } from '../../../apollo';
import query_sme_catalog_product_variant_aggregate from '../../../graphql/query_sme_catalog_product_variant_aggregate';
import { defineMessages } from 'react-intl';
import query_mktGetCampaignByVariant from '../../../graphql/query_mktGetCampaignByVariant';
import query_sme_catalog_product_variant from '../../../graphql/query_sme_catalog_product_variant';

let client = createApolloClientSSR()

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

export const validatePriceVariant = (variant) => {
  if (variant.length == 1) {
    return null;
  }
  let min = _.minBy(variant, _variant => _variant?.price)?.price
  let max = _.maxBy(variant, _variant => _variant?.price)?.price

  if ((max / (min || 1)) > 5) {
    return 'PRODUCT.VALIDATE_FORM.PRICE_INVALID'
  }

  // if ((max - min) / (min || 1) > 0.2) {
  //   return 'PRODUCT.VALIDATE_FORM.PRICE_INVALID'
  // }

  return null;
}


export const TYPE_COUNT = {
  DANG_HOAT_DONG: 'danghoatdong',
  SAP_HET_HANG: 'saphethang',
  HET_HANG: 'hethang',
  DA_AN: 'daan',
  LUU_NHAP: 'draf',
  CHUA_LIEN_KET: 'notlink',
  HANG_HOA_AO: 'hanghoaao',
  KHAC: 'other'
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
  if (type == TYPE_COUNT.KHAC) {
    return { status: { _eq: "3" } }
  }
  return {}
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

export function formatTimestamp(timestamp) {
  const milliseconds = timestamp * 1000;

  const date = new Date(milliseconds);

  const day = ('0' + date.getDate()).slice(-2);
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const year = date.getFullYear();

  const hours = ('0' + date.getHours()).slice(-2);
  const minutes = ('0' + date.getMinutes()).slice(-2);

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

export const queryMktGetCampaignByVariant = async (ids) => {
  if (ids?.length == 0) return [];

  const { data } = await client.query({
      query: query_mktGetCampaignByVariant,
      variables: {
        list_sc_variant_id: ids
      },
      fetchPolicy: "network-only",
  });
  return data || {};
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
  all: {
    defaultMessage: 'Tất cả'
  },
  originImgHas: {
    defaultMessage: 'Sản phẩm đã có ảnh gốc'
  },
  originImgNotHas: {
    defaultMessage: 'Sản phẩm chưa có ảnh gốc'
  },
  originConnectHas: {
    defaultMessage: 'Đã liên kết'
  },
  originConnectNotHas: {
    defaultMessage: 'Chưa liên kết'
  },  
})

export const OPTIONS_ORIGIN_IMAGE = [
  { value: 3, name: mssLang.all },
  { value: 1, name: mssLang.originImgHas },
  { value: 2, name: mssLang.originImgNotHas }
];

export const OPTIONS_CONNECTED = [
  { value: '', label: 'Tất cả' },
  { value: 1, label: 'Đã liên kết' },
  { value: 0, label: 'Chưa liên kết' }
];
