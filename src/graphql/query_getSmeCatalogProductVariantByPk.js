import gql from 'graphql-tag';

export default gql`
    query sme_catalog_product_variant_by_pk($id: uuid = "") {
        sme_catalog_product_variant_by_pk(id: $id) {
            id
            name
            sku
            price
            cost_price
            is_combo
            combo_items {
                combo_item{
                    id
                    sku
                    product_id
                }
                quantity
            }
            sme_catalog_product_variant_assets(where: {type: {_eq: 0}}) {
                asset_id
                asset_url
                created_at
                position_show
                id
                type
                product_variant_id
            }
            sme_catalog_product {
                id
                name
                sme_catalog_product_assets {
                    asset_id
                    asset_url
                    catalog_product_id
                    created_at
                    id
                    is_video
                    position_show
                  }
                sme_catalog_product_variants {
                    id
                    attributes {
                        sme_catalog_product_attribute_value {
                        name
                        position
                        sme_catalog_product_custom_attribute {
                            display_name
                            name
                        }
                        assets {
                            asset_url
                            position_show
                        }
                        }
                    }
                }
            }
        }
    }
`