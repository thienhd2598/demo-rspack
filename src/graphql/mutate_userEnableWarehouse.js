import gql from 'graphql-tag';

export default gql`
mutation userEnableWarehouse($id: Int!, $isEnable: Boolean! ) {
  userEnableWarehouse(id: $id, isEnable: $isEnable) {
    message
    success
  }
}
`;
