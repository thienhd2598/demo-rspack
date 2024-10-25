import gql from "graphql-tag";

export default gql`
  query userGetPermissions {
    userGetPermissions {
        items {
            categoryCode
            categoryName
            code
            groupCode
            groupName
            id
            name
        }
        message
        success
    }
  }
`;

