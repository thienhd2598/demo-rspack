import gql from 'graphql-tag';

export default gql`
    mutation createFrameImage($asset_url: String!, $asset_id: Int!, $name: String!, $config: jsonb = "", $is_static: Int, $shape: jsonb = "") {
        insert_sme_catalog_photo_frames(objects: {asset_id: $asset_id, asset_url: $asset_url, name: $name, config: $config, is_static: $is_static, shape: $shape}) {
            affected_rows
        }
    }
`;
