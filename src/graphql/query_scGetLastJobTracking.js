import gql from "graphql-tag";

export default gql`
  query scGetLastJobTracking($type: String = "SYNC_BRAND", $store_id: Int!) {
    scGetLastJobTracking(type: $type, store_id: $store_id) {
      id
      sme_id
      total_job
      success_job
      failed_job
    }
}
`;
