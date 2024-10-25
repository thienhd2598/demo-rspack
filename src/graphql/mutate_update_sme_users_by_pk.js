import gql from 'graphql-tag';

export default gql`
mutation update_sme_users_by_pk($id: String!, $_set: sme_users_set_input = {}) {
  update_sme_users_by_pk(pk_columns: {id: $id}, _set: $_set) {
    avatar_url
    email
    full_name
    id
    phone
    sme_id
  }
}

`;
