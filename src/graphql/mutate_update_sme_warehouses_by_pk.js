import gql from 'graphql-tag';

export default gql`
mutation userUpdateWarehouse($userUpdateWarehouseInput: UserUpdateWarehouseInput!) {
  userUpdateWarehouse(userUpdateWarehouseInput: $userUpdateWarehouseInput) {
    message
    success
  }
}

`;
