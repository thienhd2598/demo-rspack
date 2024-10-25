import gql from 'graphql-tag';

export default gql`    
query scCommentAggregate($search: SearchComment) {
    scCommentAggregate(search: $search) {
        count
    }
  }
`;  