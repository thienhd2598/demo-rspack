import gql from "graphql-tag";

export default gql`
  query global_product_status {
    global_product_status {
      created_at
      id
      name
      status_code
      updated_at
      type
    }
  }
`;
