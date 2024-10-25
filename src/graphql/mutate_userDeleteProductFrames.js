import gql from 'graphql-tag';

export default gql`
    mutation userDeleteProductFrames($ids: [Int]) {
        userDeleteProductFrames(ids: $ids) {            
            success
            message
            result {
                error
                id
            }
        }
    }
`