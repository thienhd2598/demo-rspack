import gql from 'graphql-tag';

export default gql`
mutation scSaveReplyTemplate($name: String, $reply_template_id: Int,$star_list_template: [StarTemplate]) {
    scSaveReplyTemplate(name: $name, reply_template_id: $reply_template_id, star_list_template: $star_list_template) {
    message
    success
  }
}
`;
