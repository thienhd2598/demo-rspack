import gql from 'graphql-tag';

export default gql`
query sme_users_by_pk($id: String!, $skip: Boolean = false) {
  sme_users_by_pk(id: $id) @skip(if: $skip){
    email
    full_name
    is_complete_tutorial
    id
    phone
    avatar_url
  }
}

`;
