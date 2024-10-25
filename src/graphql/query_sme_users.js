import gql from 'graphql-tag';

export default gql`
query sme_users($id: String!) {
  sme_users(where: {id: {_neq: $id}}) {
    email
    avatar_url
    full_name
    id
    is_complete_tutorial
    is_root
    phone
  }
}


`;
