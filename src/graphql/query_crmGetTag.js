import gql from "graphql-tag";

export default gql`
  query crmGetTag {
    crmGetTag {
        created_at
        id
        sme_id
        title
        updated_at
    }
  }
`;
