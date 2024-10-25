import gql from "graphql-tag";

export default gql`
  mutation coCheckRepOrderIdExist($ref_id: String!, $id: Int) {
    coCheckRepOrderIdExist(ref_id: $ref_id, id: $id) {
      message
      success
      count_exists
    }
  }
`;
