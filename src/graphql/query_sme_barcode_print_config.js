import gql from 'graphql-tag';

export default gql`
    query sme_barcode_print_config {
        sme_barcode_print_config (order_by: { position: asc }) {
            column
            created_at
            description
            id                                  
            attribute_count  
            is_default
            label_height                        
            label_margin_bottom
            label_margin_left
            label_margin_right
            label_margin_top
            label_width
            name
            paper_height
            paper_padding_bottom
            paper_padding_left
            paper_padding_right
            paper_padding_top
            paper_preview_link
            paper_width
            row
        }
    }`