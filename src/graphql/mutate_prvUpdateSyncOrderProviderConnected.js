import gql from "graphql-tag";

export default gql`
  mutation prvUpdateSyncOrderProviderConnected(
    $provider_connected_id: Int!,
    $sync_manual: Int,
    $sync_platform: Int,
    $sync_package_pending: Int,
  ) {
    prvUpdateSyncOrderProviderConnected(
        provider_connected_id: $provider_connected_id,
        sync_manual: $sync_manual,
        sync_platform: $sync_platform,
        sync_package_pending: $sync_package_pending,
    ) {
      success
      message
    }
  }
`;

