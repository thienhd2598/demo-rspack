import gql from "graphql-tag";

export default gql`
  query userGetRoles($page: Int = 1, $pageSize: Int = 10, $searchText: String) {
    userGetRoles(page: $page, pageSize: $pageSize, searchText: $searchText) {
        success
        message
        items {
            code
            createdAt
            description
            id
            name
            permissions
            updatedAt
        }
        pagination {
            page
            pageSize
            total
            totalPage
        }
    }
  }
`;

