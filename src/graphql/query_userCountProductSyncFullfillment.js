import gql from "graphql-tag";

export default gql`
  query userCountProductSyncFullfillment($connectedProviderId: Int!, $searchText: String) {
    userCountProductSyncFullfillment(connectedProviderId: $connectedProviderId, searchText: $searchText) {
        countNotSynced
        countSyncedFail
        countSyncedSuccess
    }
  }
`;

