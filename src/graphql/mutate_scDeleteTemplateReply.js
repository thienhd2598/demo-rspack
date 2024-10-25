import gql from 'graphql-tag';

export default gql`    
mutation scDeleteTemplateReply($reply_template_id: Int!) {
    scDeleteTemplateReply(reply_template_id: $reply_template_id) {
        message
        success
    }
  }
`;