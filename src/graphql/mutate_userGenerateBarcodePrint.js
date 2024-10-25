import gql from 'graphql-tag';

export default gql`
mutation userGenerateBarcodePrint($userGenerateBarcodePrintInput: UserGenerateBarcodePrintInput!) {
  userGenerateBarcodePrint(userGenerateBarcodePrintInput: $userGenerateBarcodePrintInput) {
    fails {
        message
        sku
    }
    message
    path
    success
    totalLabel
    totalLabelFail
    totalProduct
  }
}
`;
