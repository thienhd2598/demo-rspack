import gql from 'graphql-tag';

export default gql`
  mutation sfDeleteReceivedPackage($received_package_id: Int!) {
    sfDeleteReceivedPackage(received_package_id: $received_package_id) {
      message
      success
    }
  }
`;