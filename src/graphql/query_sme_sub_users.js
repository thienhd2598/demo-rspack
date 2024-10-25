import gql from 'graphql-tag';

export default gql`
query sme_sub_users($limit: Int, $offset: Int, $where: sme_sub_users_bool_exp = {}, $order_by: [sme_sub_users_order_by!] = { created_at: desc }) {
    sme_sub_users(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
        created_at
        id
        name        
        roles
        sme_id
        updated_at
        username
    }
    sme_sub_users_aggregate(where: $where) {
      aggregate {
        count
      }
  }
}



`;
