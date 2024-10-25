import gql from "graphql-tag";

export default gql`
  query sme_catalog_product_variant(
    $limit: Int = 100
    $offset: Int = 0
    $where: sme_catalog_product_variant_bool_exp = {}
    $order_by: [sme_catalog_product_variant_order_by!] = {}
  ) {
    sme_catalog_product_variant(
      limit: $limit
      offset: $offset
      where: $where
      order_by: $order_by
    ) {
        id
        is_combo
        attributes {
            sme_catalog_product_attribute_value {
            name
            }
        }
        sme_catalog_product {
            id
            name
            sku
            is_combo
        }
        sme_catalog_product_variant_assets {
            asset_url
        }
        name
        sku
        variant_full_name
    }

    sme_catalog_product_variant_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;
