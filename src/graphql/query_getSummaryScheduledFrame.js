import gql from "graphql-tag";

export default gql`
  query getSummaryScheduledFrame($store_id: [Int], $search_text: String) {
    getSummaryScheduledFrame(store_id: $store_id, search_text: $search_text) {
        applying
        error
        finished
        total
        waiting
    }
  }
`;
