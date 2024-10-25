import gql from 'graphql-tag';

export default gql`
    query overview_index {
        overview_index {
            orderCancelAbnormal
            orderError
            orderProcessing
            productNearOutStock
            productOutStock
            pushInventoryFail
            requestReturn
            storeProductViolate
        }
    }
`