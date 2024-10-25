import gql from "graphql-tag";

export default gql`
  query scPackageAggregate($search: SearchPackage = {}) {
    scPackageAggregate (search: $search) {
      count
    }
  }
`;
