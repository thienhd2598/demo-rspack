import gql from "graphql-tag";

export default gql`
    mutation userCreateProductLocationExportRequest($userSumProductLocationExportInput: UserSumProductLocationExportInput!) {
        userCreateProductLocationExportRequest(userSumProductLocationExportInput: $userSumProductLocationExportInput) {
            data
            message
            success
        }
}

`;
