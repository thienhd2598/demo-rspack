import gql from 'graphql-tag';

export default gql`    
mutation scDeleteVariantPushInventory($sc_variant_id: Int!, $store_id: Int!) {
    scDeleteVariantPushInventory(sc_variant_id: $sc_variant_id, store_id: $store_id) {
      message
      success
    }
  }
`;