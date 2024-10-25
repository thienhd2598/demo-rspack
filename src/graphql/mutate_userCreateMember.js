import gql from 'graphql-tag';

export default gql`
mutation userCreateMember($email: String = "", $full_name: String = "", $phone: String = "") {
  userCreateMember(inputUserCreateMember: {email: $email, full_name: $full_name, phone: $phone}) {
    message
    success
  }
}

`;
