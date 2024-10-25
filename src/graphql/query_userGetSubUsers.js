import gql from "graphql-tag";

export default gql`
  query userGetSubUsers($page: Int = 1, $pageSize: Int = 10, $searchText: String, $searchType: Int) {
    userGetSubUsers(page: $page, pageSize: $pageSize, searchText: $searchText, searchType: $searchType) {
        items {
            roles {
              code
              createdAt
              description
              id
              name
              permissions
              updatedAt
            }
            chatStores
            provider
            createdAt
            id
            name
            stores
            updatedAt
            username
            warehouses
        }
        pagination {
            page
            pageSize
            total
            totalPage
        }
        message
        success
    }
  }
`;

