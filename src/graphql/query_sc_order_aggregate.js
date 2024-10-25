import gql from 'graphql-tag';

export default gql`
    query sc_order_aggregate($where: sc_order_bool_exp = {}, $skip: Boolean = false) {
        sc_order_aggregate(where: $where) @skip(if: $skip) {
            aggregate {
            count
            }
        }
    }
`;
