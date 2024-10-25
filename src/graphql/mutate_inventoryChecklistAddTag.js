import gql from 'graphql-tag';

export default gql`
    mutation inventoryChecklistAddTag($checkListId: Int!, $tag: TagInput) {
        inventoryChecklistAddTag(checkListId: $checkListId, tag: $tag) {
            message
            success
        }
    }
`