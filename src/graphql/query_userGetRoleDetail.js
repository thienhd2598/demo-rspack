import gql from "graphql-tag";

export default gql`
  query userGetRoleDetail($id: Int!) {
    userGetRoleDetail(id: $id) {
        data {
            code
            createdAt
            description
            id
            name
            permissions
            updatedAt
        }
        message
        success
    }
  }
`;

