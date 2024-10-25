import gql from 'graphql-tag';

export default gql`
query sme_sub_users_aggregate($where: sme_sub_users_bool_exp = {}) {
  sme_sub_users_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}

`;
