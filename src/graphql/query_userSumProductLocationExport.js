import gql from "graphql-tag";

export default gql`
  query userSumProductLocationExport($userSumProductLocationExportInput: UserSumProductLocationExportInput = {}) {
  userSumProductLocationExport(userSumProductLocationExportInput: $userSumProductLocationExportInput) {
    data
    message
    success
  }
}

`;
