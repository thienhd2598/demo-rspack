import gql from 'graphql-tag';

export default gql`
    query sfCountPackageInSessionPickup($pickup_id: Int!, $search: SearchPackageInSession) {
        sfCountPackageInSessionPickup(pickup_id: $pickup_id, search: $search) {
            count_channel_error
            count_not_document
            count_valid
            total
        }
    }
`;
