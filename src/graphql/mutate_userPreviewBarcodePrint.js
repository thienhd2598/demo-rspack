import gql from 'graphql-tag';

export default gql`
mutation userPreviewBarcodePrint($userPreviewBarcodePrintInput: UserPreviewBarcodePrintInput!) {
  userPreviewBarcodePrint(userPreviewBarcodePrintInput: $userPreviewBarcodePrintInput) {
    data
    message
    success
  }
}

`;
