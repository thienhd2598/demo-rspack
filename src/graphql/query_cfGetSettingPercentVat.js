import gql from 'graphql-tag';

export default gql`    
query cfGetSettingPercentVat($connector_channel_code: String!, $type: String!) {
  cfGetSettingPercentVat(connector_channel_code: $connector_channel_code, type: $type) {
    id
    percent
    type
  }
}

`;