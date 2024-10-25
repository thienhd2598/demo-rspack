import gql from "graphql-tag";

export default gql`
  mutation recreateProviderOutbound(
    $order_id: Int!,
    $package_id: Int!
  ) {
    recreateProviderOutbound(
        order_id: $order_id,
        package_id: $package_id
    ) {
        message
        success
    }
  }
`;
