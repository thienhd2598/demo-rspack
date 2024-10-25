import gql from 'graphql-tag';

export default gql`
    mutation userDeleteSubUser($id: Int!) {
        userDeleteSubUser(id: $id) {
            message
            success
        }
    }
`;
