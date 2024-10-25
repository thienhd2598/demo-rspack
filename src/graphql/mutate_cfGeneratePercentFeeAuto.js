import gql from 'graphql-tag';

export default gql`
    mutation cfGeneratePercentFeeAuto($store_id: Int!) {
        cfGeneratePercentFeeAuto(store_id: $store_id) {
            percent_fee {
                key
                percent
            }
            message
            success
        }
    }
`;