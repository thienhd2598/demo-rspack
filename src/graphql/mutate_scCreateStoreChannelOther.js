import gql from 'graphql-tag';

export default gql`    
mutation scCreateStoreChannelOther($company_name: String,
    $country_code: String,
    $description: String,
    $email: String,
    $name: String) {
    scCreateStoreChannelOther(
        company_name: $company_name,
        country_code: $country_code,
        description: $description,
        email: $email,
        name: $name) {
        message
        success
    }
  }
`;