import gql from "graphql-tag";

export default gql`
  query sme_inventory_checklists_aggregate(
    $where: sme_inventory_checklists_bool_exp = {}
  ) {
    sme_inventory_checklists_aggregate(where: $where) {
            aggregate {
                count
            }
        }
  }
`;
