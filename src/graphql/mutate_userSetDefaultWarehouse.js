import gql from 'graphql-tag';

export default gql`
mutation userSetDefaultWarehouse($id: Int!) {
    userSetDefaultWarehouse(id: $id) {
    message
    success
  }
}

`;
