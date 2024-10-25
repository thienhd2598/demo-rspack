import gql from 'graphql-tag';

export default gql`
query sme_warehouses($limit: Int = 200,$offset: Int = 0, $order_by:  [sme_warehouses_order_by!], $where: sme_warehouses_bool_exp = {status: {_eq: 10}}) {
  sme_warehouses(limit: $limit, offset: $offset, order_by: $order_by, where: $where) {
    address
    allow_preallocate
    code
    id
    is_default
    outbound_prefix
    fulfillment_provider_connected_id
    fulfillment_by
    fulfillment_scan_export_mode
    fulfillment_scan_pack_mode
    fulfillment_provider {
      name
    }
    fulfillment_provider_wms_code
    inbound_prefix
    name
    district_code
    max_mio
    max_sio
    province_code
    ward_code
    contact_phone
    contact_name
    sme_id
    total_variants
    status
  }
  sme_warehouses_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
`;
