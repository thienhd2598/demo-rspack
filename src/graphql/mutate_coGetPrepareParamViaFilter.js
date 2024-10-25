import gql from "graphql-tag";

export default gql`    
        mutation coGetPrepareParamViaFilter($search: SearchOrder) {
            coGetPrepareParamViaFilter(search: $search) {
              success
              message
              data {
                date
                pickup_time_id
                time_text
              }
            }
        }
`;