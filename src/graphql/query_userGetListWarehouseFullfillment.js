import gql from "graphql-tag";

export default gql`
  query userGetListWarehouseFullfillment($connectedProviderId: Int!) {
    userGetListWarehouseFullfillment(connectedProviderId: $connectedProviderId) {
        data {
            code
            email
            fullAddress
            isActive
            name
            phoneNumber
            shortName
        }
        message
        success
    }
  }
`;

