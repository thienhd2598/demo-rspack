import gql from 'graphql-tag';

export default gql`
mutation sfChangeReceivedPackage($received_package_id: Int!, $received_package:  ReceivedPackagesInput) {
  sfChangeReceivedPackage(received_package_id: $received_package_id, received_package: $received_package) {
    message
    success
  }
}
`;