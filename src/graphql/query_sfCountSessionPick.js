import gql from 'graphql-tag';

export default gql`
    query sfCountSessionPick($search: SearchSessionPickUp = {}) {
        sfCountSessionPick(search: $search) {
            total_ready
            total_picking
            total_picked
            total_new
            total_cancelled
            total_package
            total
        }
    }
`;
