import gql from "graphql-tag";

export default gql`
  mutation orderCancelProviderOutbound(
    $order_id: Int!,
    $package_id: Int!
  ) {
    orderCancelProviderOutbound(
        order_id: $order_id,
        package_id: $package_id
    ) {
        message
        success
    }
  }
`;
