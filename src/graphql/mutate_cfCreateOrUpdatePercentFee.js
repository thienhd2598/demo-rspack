import gql from 'graphql-tag';

export default gql`
    mutation cfCreateOrUpdatePercentFee($list_percent_fee: [PercentFee], $store_id: Int!) {
        cfCreateOrUpdatePercentFee(list_percent_fee: $list_percent_fee, store_id: $store_id) {
            message
            success
        }
    }
`;