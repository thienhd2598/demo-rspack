import gql from 'graphql-tag';

export default gql`
    query prvListCategory {
        prvListCategory{
            code
            description
            id
            name
        }
    }
`