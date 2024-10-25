import gql from "graphql-tag";

export default gql`
  query crmGetDistrict {
    crmGetDistrict {
        code
        code_name
        full_name
        full_name_en
        name
        name_en
        province_code
    }
  }
`;
