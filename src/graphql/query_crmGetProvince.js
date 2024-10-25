import gql from "graphql-tag";

    export default gql`
  query crmGetProvince {
    crmGetProvince {
        code
        code_name
        name
        name_en
    }
  }
`;
