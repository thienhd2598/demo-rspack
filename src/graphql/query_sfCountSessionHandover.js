import gql from 'graphql-tag';

export default gql`
    query sfCountSessionHandover($search: SearchHandoverPickUp = {}) {
        sfCountSessionHandover(search: $search) {
            total_completed
            total_new
            total_cancelled
            total
        }
    }
`;
