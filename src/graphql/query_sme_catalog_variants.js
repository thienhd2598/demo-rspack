import gql from "graphql-tag";

export default gql`
    query sme_catalog_product_variant($limit: Int = 10, $offset: Int = 0, $where: sme_catalog_product_variant_bool_exp ={}, order_by: [sme_catalog_product_variant_order_by] = {}) {
        sme_catalog_product_variant(limit: $limit, offset: $offset, where: $where) {
            sme_catalog_product {
                name
            }
            cost_price
            sme_catalog_product_variant_assets {
                asset_url
                id
                position_show
            }
            attributes {
                sme_catalog_product_attribute_value {
                  name
                  position
                  sme_catalog_product_custom_attribute {
                    display_name
                    name
                  }
                }
            }   
        }

        sme_catalog_product_variant_aggregate (where: $where) {
            aggregate {
                count
            }   
        }
    }
`