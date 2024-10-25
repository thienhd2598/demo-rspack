import gql from "graphql-tag";

export default gql`
  query scFailDeliveryOrderAggregate($search: SearchFailDeliveryOrder = {}) {
    scFailDeliveryOrderAggregate(search: $search) {
      count
    }
  }
`;
