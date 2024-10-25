import gql from 'graphql-tag';

export default gql`
query sc_sale_channel_categories($connector_channel_code: String!) {
  sc_sale_channel_categories(connector_channel_code: $connector_channel_code) {
    display_name
    connector_channel_code
    id
    name
    parent_id
    ref_id
    support_size_chart
    size_chart_required
  }
}

`;
