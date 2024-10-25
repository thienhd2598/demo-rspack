import gql from 'graphql-tag';

export default gql`
    mutation delete_sme_sub_users_by_pk($id: Int!) {
        delete_sme_sub_users_by_pk(id: $id) {
            id
        }
    }   
`