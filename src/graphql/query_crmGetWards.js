import gql from "graphql-tag";

export default gql`
  query crmGetWards($district_code: String!) {
    crmGetWards(district_code: $district_code) {
        administrative_unit_id
        code
        code_name
        district_code
        full_name
        full_name_en
        name
        name_en
    }
  }
`;
