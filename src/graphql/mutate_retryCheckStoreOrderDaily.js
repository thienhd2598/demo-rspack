import gql from "graphql-tag";

export default gql`
  mutation retryCheckStoreOrderDaily(
    $store_id: Int!
  ) {
    retryCheckStoreOrderDaily(
        store_id: $store_id
    ) {
      success
      message
    }
  }
`;
