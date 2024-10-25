import gql from 'graphql-tag';

export default gql`
    query sme_warehouses($limit: Int = 100, $offset: Int = 0, $order_by: [sme_warehouses_order_by!] = {}, $where: sme_warehouses_bool_exp = {status: {_eq: 10}}) {
        sme_warehouses (limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
            id
            is_default
            name
            sme_id
            address
            allow_preallocate
            max_mio
            max_sio
            outbound_prefix
            fulfillment_provider_connected_id
            fulfillment_by
            fulfillment_provider {
                name
            }
            fulfillment_provider_wms_code
            district_code
            province_code
            ward_code
            inbound_prefix
        }
    }
`;