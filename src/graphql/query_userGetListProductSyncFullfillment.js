import gql from "graphql-tag";

export default gql`
  query userGetListProductSyncFullfillment($page: Int, $pageSize: Int,$connectedProviderId: Int!, $searchText: String, $type: String!) {
    userGetListProductSyncFullfillment(page: $page, pageSize: $pageSize, connectedProviderId: $connectedProviderId, searchText: $searchText, type: $type) {
        currentPage
        itemCount
        items {
            name
            sku
            stockActual
            stockAvailable
            stockReserve
            errorMessage
            synced
            syncedDate
            updatedDate
            variant_id
        }
        pageCount
        pageSize
    }
  }
`;

