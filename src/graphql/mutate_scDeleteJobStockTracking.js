import gql from 'graphql-tag';

export default gql`    
mutation scDeleteJobStockTracking($ids: [Int]) {
    scDeleteJobStockTracking(ids: $ids) {
        message
        success
    }
  }
`;