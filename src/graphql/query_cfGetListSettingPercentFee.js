import gql from 'graphql-tag';

export default gql`    
    query cfGetListSettingPercentFee {
        cfGetListSettingPercentFee { 
            setting_percent_fee {
                connector_channel_code
                created_at
                id
                key
                percent
                sme_id
                store_id
                updated_at
            }
            store_id
        }
    }
`;