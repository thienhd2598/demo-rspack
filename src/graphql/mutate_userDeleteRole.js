import gql from 'graphql-tag';

export default gql`
    mutation userDeleteRole($id: Int!) {
        userDeleteRole(id: $id) {
            message
            success
        }
    }
`;
