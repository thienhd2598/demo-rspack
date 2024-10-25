import gql from "graphql-tag";

export default gql`
  query crmGetJobTrackingExport(
    $page: Int!
    $first: Int!
    $type: Int!
  ) {
    crmGetJobTrackingExport(
      page: $page
      first: $first
      type: $type
    ) {
      data {
        created_at
        file_name
        id
        link_file_export
        payload_params
        sme_id
        status
        total
        type
        updated_at
      }
      paginatorInfo {
        total
        perPage
        lastPage
        lastItem
        hasMorePages
        firstItem
        currentPage
        count
      }
    }
  }
`;
