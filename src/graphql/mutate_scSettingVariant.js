import gql from 'graphql-tag';

export default gql`
mutation ScSettingVariant($sc_variant_data: [SettingVariantInput!] = {}) {
  ScSettingVariant(sc_variant_data: $sc_variant_data) {
    message
    success
  }
}
`;
