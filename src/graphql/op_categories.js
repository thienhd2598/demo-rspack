import gql from 'graphql-tag';

export default gql`
query op_categories($skip: Boolean = false) {
  op_categories @skip(if: $skip) {
    code
    description
    is_root
    parent_id
    name
    id
    is_required_warranty
  }
}

`;
