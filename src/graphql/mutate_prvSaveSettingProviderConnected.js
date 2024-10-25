import gql from "graphql-tag";

export default gql`
  mutation prvSaveSettingProviderConnected(
    $provider_connected_id: Int!,
    $setting: String,
  ) {
    prvSaveSettingProviderConnected(
        provider_connected_id: $provider_connected_id,
        setting: $setting,
    ) {
      success
      message
    }
  }
`;
