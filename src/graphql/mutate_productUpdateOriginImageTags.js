import gql from 'graphql-tag';

export default gql`
    mutation productUpdateOriginImageTags($isSyncUp: Int!, $updateInput: [ProductUpdateOriginImageTagsInput]! = {}) {
        productUpdateOriginImageTags(isSyncUp: $isSyncUp, updateInput: $updateInput) {
            message
            success
        }
    }
`;
