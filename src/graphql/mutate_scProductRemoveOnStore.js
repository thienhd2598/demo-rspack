import gql from 'graphql-tag';

export default gql`
mutation scProductRemoveOnStore($action_type: Int!, $list_product_id: [Int!] = []) {
  scProductRemoveOnStore(action_type: $action_type, list_product_id: $list_product_id) {
    success
    message
  }
}

`;
