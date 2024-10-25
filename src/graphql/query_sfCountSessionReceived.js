import gql from 'graphql-tag';

export default gql`
    query sfCountSessionReceived($search: SearchHandoverPickUp = {}) {
        sfCountSessionReceived(search: $search) {
            total
            total_cancelled
            total_completed
            total_new
        }
    }
`;
