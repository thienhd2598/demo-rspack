import gql from 'graphql-tag';

export default gql`
query sme_roles($limit: Int = 10, $offset: Int = 0, $where: sme_roles_bool_exp = {}, $order_by: [sme_roles_order_by!] = { }) {
    sme_roles(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
      code
      id
      name
      route_allows
    }    
}
`;
