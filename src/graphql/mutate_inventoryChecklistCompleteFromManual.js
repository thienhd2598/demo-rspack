import gql from 'graphql-tag';

export default gql`
mutation inventoryChecklistCompleteFromManual($stockInput: [StockInput]!, $checkListId: Int!) {
    inventoryChecklistCompleteFromManual(checkListId: $checkListId, stockInput: $stockInput) {
      message
      success
    }
  }
  
`