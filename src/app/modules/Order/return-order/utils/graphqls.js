import gql from "graphql-tag";

export const mutateA_coImportReturnOrder = gql`
  mutation coImportWarehouse(
    $return_obj_id: Int!
    $import_images: [String]
    $import_note: String!
    $type_return: Int!
    $import_type: Int!
    $import_items: [ImportItemInput]
    $import_videos: [String]
    $link_video: [String]
  ) {
    coImportWarehouse(
      return_obj_id: $return_obj_id
      import_images: $import_images
      import_note: $import_note
      type_return: $type_return
      import_type: $import_type
      import_items: $import_items
      import_videos: $import_videos
      link_video: $link_video
    ) {
      success
      message
    }
  }
`;

export const mutation_coUpdateImportNote = gql`
    mutation coUpdateImportNote($link_video: String, $type_return: Int!, $return_obj_id: Int!, $import_note: String!, $import_images: [String], , $import_videos: [String]) {
      coUpdateImportNote(
        type_return: $type_return,
        import_images: $import_images,
        import_videos: $import_videos,
        return_obj_id: $return_obj_id,
        import_note: $import_note
        link_video: $link_video
        ) {
        success
        message
        }
    }
`;
