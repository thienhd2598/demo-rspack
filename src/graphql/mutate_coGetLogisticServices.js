import gql from "graphql-tag";

export default gql`
  mutation coGetLogisticServices($length: Int, $height: Int, $width: Int, $goods_value: Int, $receiver: LogisticAddress, $sender: LogisticAddress, $item_value: Int, $weight: Float) {
    coGetLogisticServices(length: $length, height: $height, width: $width, goods_value: $goods_value, receiver: $receiver, sender: $sender, item_value: $item_value, weight: $weight) {
        logistics {
            logistic_services {
                code
                name
                delivery_time
                price
            }
            provider {
                auth_type
                code
                description
                email
                id
                logo
                system_code
                name
                website
                providerConnected {
                    category_code
                    id
                    last_connected_at
                    last_disconnected_at
                    provider_id
                    provider_name
                    settings
                    sme_id
                    status
                    system_code
                }
            }            
        }
        message
        success
    }
  }
`;
