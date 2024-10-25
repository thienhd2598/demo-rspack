import gql from 'graphql-tag';

export default gql`
query inventoryChecklistGetTemplate($checkListId: Int!) {
  inventoryChecklistGetTemplate(checkListId: $checkListId) {
    message
    success
    url
    count
  }
}

`;
