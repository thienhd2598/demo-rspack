import gql from 'graphql-tag'; 

export default gql` 
    mutation scProductReLoad($products: [Int!]) { 
        scProductReLoad(products: $products) { 
            message 
            success 
            total_product 
        } 
    } 
`;