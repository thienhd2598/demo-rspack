import gql from 'graphql-tag';

export default gql`
query sme_catalog_product($limit: Int = 10, $offset: Int = 0, $where: sme_catalog_product_bool_exp = {}, $order_by: [sme_catalog_product_order_by!] = {id: asc}) {
  sme_catalog_product(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
    catalog_category_id
    id
    name
    slug
    name_seo
    sku
    total_stock_on_hand
    stock_on_hand
    price
    video_url
    is_combo
    combo_items {
      combo_item{
        id
        sku
        product_id
      }
      quantity
    }
    tags {
      tag {
        id
        title
      }
      id
      product_id
      tag_id
    }
    sme_catalog_product_assets {
      asset_url
      id
    }
    sme_id
    status
    sme_catalog_product_variants (where : {status: {_eq: 10}}){
      id
      name
      price
      price_minimum
      cost_price
      product_id
      sku
      sme_id
      status
      stock_on_hand
      product_status_id
      vat_rate
      variant_unit {
        id
      }
      is_combo
      combo_items {
        combo_item{
          id
          sku
          product_id
        }
        quantity
      }
      sc_variant_linked_aggregate {
        aggregate {
          count
        }
      }
      sc_variant_linked {
        id
      }
      attributes {
        id
        product_variant_id
        sme_catalog_product_attribute_value {
          asset_code
          id
          name
          product_attribute_custom_id
          product_attribute_id
          product_id
          ref_index
          assets {
            asset_url
            id
            is_video
          }
        }
      }
    }
    brand_id
    updated_at
    created_at
    description
    description_html
    description_short
    description_extend

    scProductMapping {
      id
      sc_product_id
      sme_product_id
      store_id
    }
  }
  sme_catalog_product_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
`;
