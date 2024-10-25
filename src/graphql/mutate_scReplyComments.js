import gql from 'graphql-tag';

export default gql`    
mutation scReplyComments($list_reply_comment: [ReplyComment!]) {
    scReplyComments(list_reply_comment: $list_reply_comment) {
        success
        total
        total_fail
        total_success
  }
}

`;