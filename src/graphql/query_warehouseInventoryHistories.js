import gql from "graphql-tag";

export default gql`
  query warehouseInventoryHistories(
    $inputWarehouseInventoryHistories: InputWarehouseInventoryHistories! = {}
  ) {
    warehouseInventoryHistories(
        inputWarehouseInventoryHistories: $inputWarehouseInventoryHistories
    ) {
        data {
            items {
                after
                amountIn
                amountOut
                before
                logo
                name
                sku
                beforePreallocate
                afterPreallocate
                variantName
                warehouseName
                productId 
                variantId 
                unit
            }
            pagination {
                currentPage
                pageSize
                total
                totalPage
            }
        }
        message
        success
  }}
`;

