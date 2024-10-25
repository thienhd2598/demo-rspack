import React, { useMemo, memo, useState, useEffect } from "react";
import Pagination from "../../../../components/Pagination";
import { useLocation } from "react-router-dom";
import queryString from "querystring";
import OrderRow from "./OrderRow";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import ModalPackPreparingGoods from "../dialog/ModalPackPreparingGoods";
import ModalReadyToDeliver from "../dialog/ModalReadyToDeliver";
import { useIntl } from 'react-intl'
import AddSmeNoteOrderDialog from "../order-list/AddSmeNoteOrderDialog";

const OrderTable = memo(({
    page,refetch, getOrderLoading,error,
    limit,data,setIds, ids,setTotal, 
    dataSmeWarehouse, dataScWareHouse, loadingSmeVariant, smeVariants
  }) => {
    const { formatMessage } = useIntl()
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const [dataOrder, setDataOrder] = useState(null);
    const [openModal, setOpenModal] = useState(null);
    const [dataSmeNote, setDataSmeNote] = useState(null);

    useEffect(() => {
      setTotal(data?.scPackageAggregate?.count || 0);
    }, [data]);

    let totalRecord = data?.scPackageAggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit);

    const isSelectAll = ids?.length > 0 &&
      ids?.filter((x) => data?.scGetPackages.some((order) => order.id === x.id))?.length == data?.scGetPackages?.length;

    return (
      <div
        style={{
          boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
          borderBottomLeftRadius: 6,
          borderBottomRightRadius: 6,
          borderTopRightRadius: 6,
          minHeight: 300,
        }}
      >
        <table className="table table-borderless product-list table-vertical-center fixed">
          <thead
            style={{
              position: "sticky", top: params?.type == 'packed' ? 104 : 142, background: "#F3F6F9", fontWeight: "bold", fontSize: "14px",
              borderBottom: "1px solid gray", borderLeft: "1px solid #d9d9d9", borderRight: "1px solid #d9d9d9",
            }}
          >
            <tr className="font-size-lg">
              <th style={{ fontSize: "14px" }}>
                <div className="d-flex">
                  <Checkbox size="checkbox-md" inputProps={{"aria-label": "checkbox",}}
                    isSelected={isSelectAll}
                    onChange={(e) => {
                      if (isSelectAll) {
                        setIds(ids.filter((x) => !data?.scGetPackages.some((order) => order.id === x.id)));
                      } else {
                        const tempArray = [...ids];
                        (data?.scGetPackages || []).forEach((_order) => {
                          if (_order && !ids.some((item) => item.id === _order.id)) {
                            tempArray.push(_order);
                          }
                        });
                        setIds(tempArray);
                      }
                    }}
                  />
                  <span className="mx-4">{formatMessage({ defaultMessage: 'Thông tin sản phẩm' })}</span>
                </div>
              </th>
              <th style={{ fontSize: "14px", width: 150 }}>{formatMessage({ defaultMessage: 'Kho xử lý' })}</th>
              <th style={{ fontSize: "14px", width: 160 }}>{formatMessage({ defaultMessage: 'Xử lý' })}</th>
              <th style={{ fontSize: "14px", width: 140 }}>{formatMessage({ defaultMessage: 'Vận chuyển' })}</th>
            </tr>
          </thead>
          <tbody>
            {getOrderLoading && (
              <div className="text-center w-100 mt-4" style={{ position: "absolute" }}>
                <span className="ml-3 spinner spinner-primary"></span>
              </div>
            )}
            {!!error && !getOrderLoading && (
              <div className="w-100 text-center mt-8" style={{ position: "absolute" }}>
                <div className="d-flex flex-column justify-content-center align-items-center">
                  <i className="far fa-times-circle text-danger" style={{ fontSize: 48, marginBottom: 8 }}></i>
                  <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                  <button className="btn btn-primary btn-elevate" style={{ width: 100 }}
                    onClick={(e) => {
                      e.preventDefault();
                      refetch();
                    }}
                  >
                    {formatMessage({ defaultMessage: 'Tải lại' })}
                  </button>
                </div>
              </div>
            )}
            {!getOrderLoading &&
              !error &&
              data?.scGetPackages?.map((orderPack, index) => (
                <OrderRow
                  key={`order-${index}`}
                  order={orderPack}
                  op_connector_channels={data?.op_connector_channels || []}
                  sc_stores={data?.sc_stores || []}
                  params={params}
                  setIds={setIds}
                  onSetSmeNote={(edit = false, isView = false) => setDataSmeNote({
                    id: orderPack?.order?.id,
                    smeNote: orderPack?.order?.sme_note,
                    edit,
                    isView
                  })}
                  ids={ids}
                  smeVariants={smeVariants}
                  loadingSmeVariant={loadingSmeVariant}
                  dataSmeWarehouse={dataSmeWarehouse}
                  dataScWareHouse={dataScWareHouse}
                  setOpenModal={setOpenModal}
                  isSelected={ids?.some((_id) => _id.id == orderPack.id)}
                />
              ))}
          </tbody>
        </table>
        {!error && (
          <Pagination
            page={page}
            totalPage={totalPage}
            loading={getOrderLoading}
            options={[
              { label: 25, value: 25 },
              { label: 50, value: 50 },
            ]}            
            limit={limit}
            totalRecord={totalRecord}
            count={data?.scGetPackages?.length}
            basePath={"/orders/list-batch"}
            emptyTitle={formatMessage({ defaultMessage: "Không tìm thấy đơn hàng phù hợp" })}
          />
        )}

        <AddSmeNoteOrderDialog dataSmeNote={dataSmeNote} onHide={() => setDataSmeNote()} />

        <ModalPackPreparingGoods
          dataOrder={dataOrder}
          openModal={openModal}
          onHide={() => {
            setDataOrder(null);
            setOpenModal(null);
          }}
        />

        <ModalReadyToDeliver
          dataOrder={dataOrder}
          openModal={openModal}
          onHide={() => {
            setDataOrder(null);
            setOpenModal(null);
          }}
        />
      </div>
    );
  }
);

export default OrderTable;
