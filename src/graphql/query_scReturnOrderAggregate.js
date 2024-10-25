import gql from "graphql-tag";

export default gql`
  query scReturnOrderAggregate(
    $search: SearchReturnOrder = {}
  ) {
    scReturnOrderAggregate(
      search: $search
    ) {
        count
    }}`