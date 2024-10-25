import gql from "graphql-tag";

export default gql`
mutation userUpdateProductWarningExpired($products: [UserUpdateProductWarningExpiredInput]) {
    userUpdateProductWarningExpired(products: $products) {
        errors {
            id
            message
            name
        }
        message
        success
        total
        totalSuccess
    }
}

`