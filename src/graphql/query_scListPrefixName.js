import gql from "graphql-tag";

export default gql`
  query scListPrefixName {
    scListPrefixName {
      data
      message
      success
    }
  }
`;
