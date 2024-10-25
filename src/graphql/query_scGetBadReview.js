import gql from 'graphql-tag';

export default gql`
    query scGetBadReview {
      scGetBadReview {
          rating_star
          total       
        }
    }
`;
