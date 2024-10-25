import gql from 'graphql-tag';

export default gql`
mutation scAddVariantPushInventory($list_variant_id: [Int], $store_id: Int!) {
    scAddVariantPushInventory(list_variant_id: $list_variant_id, store_id: $store_id) {
    success
    message
  }
}
`;
