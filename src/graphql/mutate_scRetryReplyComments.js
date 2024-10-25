import gql from 'graphql-tag';

export default gql`    
mutation scRetryReplyComments($list_id_retry: [Int!]) {
    scRetryReplyComments(list_id_retry: $list_id_retry) {
        success
        total
        total_fail
        total_success
  }
}

`;