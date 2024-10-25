import gql from 'graphql-tag';

export default gql`

mutation delete_warehouse_reserve_tickets($id: Int!) {
    delete_warehouse_reserve_tickets(where: {id: {_eq: $id}}) {
        affected_rows
    }
}
`;