import React from "react";
import dayjs from "dayjs";
import { useMutation } from "@apollo/client";
// import mutate_inventoryCreateExportRequest from "../../../../graphql/mutate_inventoryCreateExportRequest";
import mutate_inventoryRetryExportChangeActual from "../../../../graphql/mutate_inventoryRetryExportChangeActual";
import { AssignmentReturned } from "@material-ui/icons";
import { useToasts } from "react-toast-notifications";
import { saveAs } from "file-saver";
import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";
import { useIntl } from "react-intl";


const RowTable = ({ refetch, data, dataWarehouse }) => {
  const { addToast } = useToasts();
  const {formatMessage} = useIntl()
  const getWarehouse = (id) => {
    const inventory_export_item = data?.find((_item) => _item.id == id);
    const warehouse_export_inventory = inventory_export_item?.warehouse_id;
    return dataWarehouse?.sme_warehouses.map((wh) => {
      if (warehouse_export_inventory == wh.id) {
        return wh.name;
      }
    });
  };
  const returnStatus = (status) => {
    if (status == "processing") {
      return formatMessage({defaultMessage:"Đang xử lý"});
    }
    if (status == "done") {
      return formatMessage({defaultMessage:"Thành công"});
    }
    if (status == "error") {
      return formatMessage({defaultMessage:"Lỗi"});
    }
    return "";
  };

  const [inventoryRetryExportChangeActual, { loading: loadingRetry }] = useMutation(
    mutate_inventoryRetryExportChangeActual
  );
  console.log('data', data)
  return (
    <>
      {<LoadingDialog show={loadingRetry} />}
      {data.map((_item, index) => (
        <tr
          key={index}
          className="borderRight"
          style={{ borderBottom: "1px solid #d9d9d9" }}
        >
          <td  style={{ verticalAlign: "top" }} className="pt-1 pb-1">
            <div className="d-flex flex-column">
              <span className="mx-4 my-4">{!!_item?.warehouse_id ? getWarehouse(_item.id) : 'Tất cả'}</span>
            </div>
          </td>
          <td style={{ verticalAlign: "top" }} className="pt-4 pb-1">
            <span>Từ {_item?.from
              ? dayjs(_item?.from).format("DD/MM/YYYY")
              : "--"} đến {_item?.to
                ? dayjs(_item?.to).format("DD/MM/YYYY")
                : "--"}</span>
          
          </td>
          <td style={{ verticalAlign: "top" }} className="pt-4 pb-1">
            {_item.quantity}
          </td>
          <td style={{ verticalAlign: "top" }} className="pt-4 pb-1">
            {_item?.created_at
              ? dayjs(_item?.created_at).format("DD/MM/YYYY HH:mm")
              : "--"}
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
                  inventoryRetryExportChangeActual({
                    variables: {
                        id: _item?.id
                    },
                    onCompleted: (data) => {
                      if (data?.inventoryRetryExportChangeActual.success) {
                        refetch();
                        addToast(data?.inventoryRetryExportChangeActual.message, {
                          appearance: "success",
                        });
                        return;
                      }
                      addToast(data?.inventoryRetryExportChangeActual.message, {
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

export default RowTable;
