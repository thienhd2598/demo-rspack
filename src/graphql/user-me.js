import gql from 'graphql-tag';

export default gql`
query userMe {
  userMe {
    email
    full_name
    id
    is_subuser
    phone
    permissions
    roles    
    avatar_url
    sme_id
    business_model
    provider
  }
}

`;
