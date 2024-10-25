import gql from "graphql-tag";

export default gql`
  query scOrderAggregate($search: SearchOrder = {}) {
    scOrderAggregate(search: $search) {
      count
    }
  }
`;
