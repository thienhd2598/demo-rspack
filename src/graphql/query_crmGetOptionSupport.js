import gql from "graphql-tag";

export default gql`
  query crmGetOptionSupport {
    crmGetOptionSupport {
        key
        name
    }
  }
`;
