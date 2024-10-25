import gql from 'graphql-tag';

export default gql`
mutation scSyncCategory($connector_channel_code: String!, $store_id: Int!) {
  scSyncCategory(connector_channel_code: $connector_channel_code, store_id: $store_id) {
    message
    success
    job_tracking_id
  }
}

`;
