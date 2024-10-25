import gql from 'graphql-tag';

export default gql`
query warehouse_bills($limit: Int = 10, $offset: Int = 0, $where: warehouse_bills_bool_exp = {}, $order_by: [warehouse_bills_order_by!] = { updated_at: desc }) {
    warehouse_bills(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
        code
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
        status
        type
        updated_at
        printed_date
        vat
        store_id
        total_quantity
        total_quantity_plan
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
            sme_id
            product_id
            discount_value
            discount_type
        }
        bill_items_aggregate {
          aggregate {
            count
          }
        }
    }
  warehouse_bills_aggregate(where: $where) {
    aggregate {
      count
    }
  }


  sc_stores {
    connector_channel_code
    name
    id
    status
  }
  op_connector_channels {
    code
    id
    logo_asset_id
    logo_asset_url
    name
  }
}



`;
