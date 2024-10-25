import gql from 'graphql-tag';

export default gql`    
query cfGetListSettingPercentVat{
    cfGetListSettingPercentVat {
        setting_percent_vat {
            connector_channel_code
            created_at
            id
            percent
            sme_id
            type
            updated_at
        }
        type
    }
}
`;