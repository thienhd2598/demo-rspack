import gql from 'graphql-tag';

export default gql`
mutation update_sme_catalog_category($id: Int, $name: String) {
    update_sme_catalog_category(where: {id: {_eq: $id}}, _set: {name: $name}) {
        affected_rows
    }
  }
`;