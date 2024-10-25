import gql from 'graphql-tag';

export default gql`
query scGetLogisticChannel($store_id: Int!) {
  scGetLogisticChannel(store_id: $store_id) {
    message
    success
    logistics {
      channel_name
      cod_enabled
      description
      dimension_unit
      fee_type
      force_enabled
      max_height
      max_length
      max_volume
      max_weight
      max_width
      min_volume
      min_weight
      ref_channel_id
      shop_enabled
      items {
        channel_name
        cod_enabled
        description
        dimension_unit
        force_enabled
        fee_type
        max_height
        max_length
        max_volume
        max_weight
        max_width
        min_volume
        min_weight
        ref_channel_id
        shop_enabled
      }
    }
  }
}


`;
