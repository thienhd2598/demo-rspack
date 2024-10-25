import gql from "graphql-tag";

export default gql`
  mutation reloadSettlement(
    $list_settlement_id: [Int!]!
  ) {
    reloadSettlement(
        list_settlement_id: $list_settlement_id
    ) {
      success
      message
    }
  }
`;
