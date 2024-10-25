import gql from 'graphql-tag';

export default gql`    
query cfGetTemplateExport {
    cfGetTemplateExport{ 
        id
        name
  }
}
`;