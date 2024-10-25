import gql from "graphql-tag";

export default gql`
  mutation coCheckLogisticFee($length: Int, $height: Int, $width: Int, $shipping_service: String, $cod_amount: Int, $provider_connected_id: Int!, $receiver: LogisticAddress, $sender: LogisticAddress, $total_amount: Int, $weight: Float) {
    coCheckLogisticFee(length: $length, height: $height, width: $width, shipping_service: $shipping_service, cod_amount: $cod_amount, provider_connected_id: $provider_connected_id, receiver: $receiver, sender: $sender, total_amount: $total_amount, weight: $weight) {
        message
        price
        success
    }
  }
`;
