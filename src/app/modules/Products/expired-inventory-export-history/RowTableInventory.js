import React from "react";
import dayjs from "dayjs";
import { useMutation } from "@apollo/client";
// import mutate_InventoryCreateExportRequestOutput from "../../../../graphql/mutate_InventoryCreateExportRequestOutput";
import mutate_userRetryRequestExportProductLocation from "../../../../graphql/mutate_userRetryRequestExportProductLocation";
import { AssignmentReturned } from "@material-ui/icons";
import { useToasts } from "react-toast-notifications";
import { saveAs } from "file-saver";
import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";
import { useIntl } from "react-intl";

const RowTableInventory = ({ refetch, data, dataWarehouse }) => {
  const { addToast } = useToasts();
  const {formatMessage} = useIntl()
  const getWarehouse = (id) => {
    const inventory_export_item = data?.find((_item) => _item.id == id);
    const warehouse_export_inventory = inventory_export_item?.warehouse_ids;
    if(!warehouse_export_inventory?.length) {
      return ['Tất cả']
    }
    return dataWarehouse?.sme_warehouses.flatMap((wh) => {
      if (warehouse_export_inventory.includes(wh.id)) {
        return wh.name;
      }
      return []
    })
  };

  const productStatus = (status) => {
    if (status == 0) {
      return formatMessage({defaultMessage:"Còn hạn"});
    }
    if (status == 1) {
      return formatMessage({defaultMessage:"Sắp hết hạn"});
    }
    if (status == 2) {
      return formatMessage({defaultMessage:"Dừng bán"});
    }
    if (status == 3) {
      return formatMessage({defaultMessage:"Hết hạn"});
    }
  };
  const returnStatus = (status) => {
    if (status == "processing") {
      return formatMessage({defaultMessage:"Đang xử lý"});
    }
    if (status == "done") {
      return formatMessage({defaultMessage:"Hoàn thành"});
    }
    if (status == "error") {
      return formatMessage({defaultMessage:"Lỗi"});
    }
    return "";
  };

  const [inventoryCreateExportRetry, { loading: loadingRetry }] = useMutation(
    mutate_userRetryRequestExportProductLocation
  );
  return (
    <>
      {<LoadingDialog show={loadingRetry} />}
      {data?.map((_item, index) => (
        <tr
          key={index}
          className="borderRight"
          style={{ borderBottom: "1px solid #d9d9d9" }}
        >
          <td  style={{ verticalAlign: "top" }} className="pt-1 pb-1">
            <div className="d-flex flex-column">
            {getWarehouse(_item.id)?.map(wh => <div className="mx-4 my-2">{wh}</div>)}
            </div>
          </td>
          <td style={{ verticalAlign: "top" }} className="pt-4 pb-1">
          {_item.product_status?.length ? _item.product_status.map((_it, i) => (
              <div className="d-flex flex-column">
              {productStatus(_it)}
              </div>
            )) : formatMessage({defaultMessage:'Tất cả'})}
          
          </td>
          <td style={{ verticalAlign: "top" }} className="pt-4 pb-1">
            {_item?.inbound_from
              ? dayjs(_item?.inbound_from*1000).format("DD/MM/YYYY HH:mm")
              : "--"} - {_item?.inbound_to
                ? dayjs(_item?.inbound_to*1000).format("DD/MM/YYYY HH:mm")
                : "--"}
          </td>
          <td style={{ verticalAlign: "top" }} className="pt-4 pb-1">
            {_item.quantity}
          </td>
          
          <td style={{ verticalAlign: "top" }} className="pt-4 pb-1">
            {returnStatus(_item.status)}
          </td>
          <td>
            {_item.status == "error" ? (
              <span
              role="button"
                className="text-primary"
                onClick={(e) => {
                  e.preventDefault();
                  inventoryCreateExportRetry({
                    variables: {
                      id: +_item.id,
                    },
                    onCompleted: (data) => {
                      if (data?.inventoryRetryExport.success) {
                        refetch();
                        addToast(data?.inventoryRetryExport.message, {
                          appearance: "success",
                        });
                        return;
                      }
                      addToast(data?.inventoryRetryExport.message, {
                        appearance: "error",
                      });
                    },
                  });
                }}
              >
                {formatMessage({defaultMessage:"Thử lại"})}
              </span>
            ) : _item.status == "done" ? (
              <a
                href={_item?.path_download}
                className="btn btn-primary"
              >
                <AssignmentReturned /> {formatMessage({defaultMessage:"Tải file"})}
              </a>
            ) : (
              ""
            )}
          </td>
        </tr>
      ))}
    </>
  );
};

export default RowTableInventory;
