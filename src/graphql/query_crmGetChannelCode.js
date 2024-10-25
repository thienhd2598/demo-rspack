import gql from "graphql-tag";

export default gql`
  query crmGetChannelCode {
    crmGetChannelCode {
        key
        name
        url_logo
    }
  }
`;
