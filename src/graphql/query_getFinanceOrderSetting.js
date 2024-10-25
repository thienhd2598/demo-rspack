import gql from 'graphql-tag';

export default gql`
query getFinanceOrderSetting {
  getFinanceOrderSetting {
    allow_order_status
    is_create_order
    is_create_return
    order_code_type
    return_code_type
    return_when
  }
}

`;