import gql from "graphql-tag";

export default gql`
  query getCostPeriodType {
    getCostPeriodType {
        cost_items
        label
        type
    }
  }
`;
