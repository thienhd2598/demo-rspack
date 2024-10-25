import gql from "graphql-tag";

export default gql`
mutation  mktLoadCampaign($id: Int) {
  mktLoadCampaign(id: $id) {
    message
    success
  }
}
`;