import gql from "graphql-tag";

export default gql`
query warehouse_bills_by_pk ($id: Int!) {
  warehouse_bills_by_pk (id: $id) {
    code
    estimated_delivery_at
    created_at
    created_by
    fee_items {
      id
      title
      value
      warehouse_bill_id
    }
    created_by_email
    id
    note
    order_code
    order_id
    protocol
    shipping_code
    sme_id
    sme_warehouse_id
    product_type
    status
    type
    total_price
    total_discount
    total_quantity
    updated_at
    vat
    related_warehouse_bill_id
    warehouse {
        id
        is_default
        name
        sme_id
    }
    bill_items {
        id
        price
        quantity
        quantity_plan
        expired_info
        sme_id
        product_id
        discount_value
        discount_type
        variant_id
    }
    bill_items_aggregate {
      aggregate {
        count
      }
    }
    }
  }
`;
