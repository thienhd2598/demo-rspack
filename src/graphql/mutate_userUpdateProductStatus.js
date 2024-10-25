import gql from 'graphql-tag';

export default gql`
  mutation userUpdateProductStatus($isEnable: Int!, $productStatusId: Int!) {
    userUpdateProductStatus(
      isEnable: $isEnable
      productStatusId: $productStatusId
    ) {
      message
      success
    }
  }
`;
