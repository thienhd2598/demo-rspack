import gql from "graphql-tag";

export default gql`
  query sme_product_status {
    sme_product_status {
      created_at
      global_status_id
      id
      name
      sme_id
      status
      status_code
      updated_at
    }
  }
`;
