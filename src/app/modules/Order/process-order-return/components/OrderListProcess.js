import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import Select from "react-select";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import { OPTIONS_SELECT } from "../constants";
import { useIntl } from "react-intl";
import RowTableProcessOrder from "./RowTableProcessOrder";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useQuery } from "@apollo/client";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import Pagination from "../view/Pagination";

const OrderListProcess = ({ values, loadingScan, state, updateState }, ref) => {
  const { formatMessage } = useIntl();
  const [page, setPage] = useState(1);
  const [dataTable, setDataTable] = useState([]);
  const [onSizePage, setOnSizePage] = useState(25);
  const inputRef = useRef();
  console.log('dataTable', dataTable)
  useImperativeHandle(ref, () => ({
    clearValue() {
      inputRef.current.value = "";
    },
  }));
  let totalRecord = dataTable?.length || 0;
  const totalPage = Math.ceil(totalRecord / onSizePage);
  const count = dataTable?.slice(onSizePage * (page - 1),onSizePage + onSizePage * (page - 1)).length
  useEffect(() => {
    setDataTable(state.dataScaned);
  }, [state.dataScaned]);

  const value_select_search = OPTIONS_SELECT?.find((__item) => __item.value == state.typeOptionSearch);

  const placeholderInputSearch = `Tìm ${formatMessage(value_select_search.label).toLocaleLowerCase()}`;

  const { data: dataStore } = useQuery(query_sc_stores_basic, {
    fetchPolicy: "cache-and-network",
  });

  const handleSearch = useCallback(() => {
    try {
      const dataScanFilltred = state.dataScaned.filter((__order) => {
        const { other } = __order;
        if (other[state.typeOptionSearch].toLowerCase().includes(inputRef.current.value?.trim().toLowerCase())) {
          return __order;
        }
      });
      if (inputRef.current.value == "") {
        setDataTable(state.dataScaned);
        setPage(1)
        return;
      }
      setDataTable(dataScanFilltred);
      setPage(1)
    } catch (err) { }
  }, [state.dataScaned, state.typeOptionSearch]);

  return (
    <Card>
      <CardBody>
        <p className="text-dark mb-2" style={{ fontSize: "14px", fontWeight: 700 }}>
          {formatMessage({ defaultMessage: "Danh sách đơn cần xử lý" })}
        </p>

        <div className="form-group my-4 d-flex align-items-center">
          <div className="w-100 col-2 p-0 m-0" style={{ zIndex: 40 }}>
            <Select
              options={OPTIONS_SELECT}
              className="w-100 mr-0 pr-0 custom-select-order"
              value={value_select_search || OPTIONS_SELECT[0]}
              onChange={(valueSelect) => {
                updateState({ typeOptionSearch: valueSelect.value });
              }}
              formatOptionLabel={(option, labelMeta) => {
                return <div>{formatMessage(option.label)}</div>;
              }}
            />
          </div>
          <div className="col-7 input-icon pl-0 ml-0" style={{ height: "fit-content" }}>
            <input
              type="text"
              aria-label="Tìm kiếm"
              className="form-control"
              ref={inputRef}
              onKeyUp={(e) => {
                if (e.keyCode == 13) {
                  handleSearch();
                }
              }}
              placeholder={placeholderInputSearch}
              style={{height: 38, borderRadius: 0, paddingLeft: "50px"}}
            />
            <span>
              <i className="flaticon2-search-1 icon-md ml-6"></i>
            </span>
          </div>
        </div>

        <div className="warning__title mb-2 d-flex align-items-center">
          <img className="mr-2" src={toAbsoluteUrl("/media/war.png")} alt=""></img>
          <span className="text-danger fs-14">
            {formatMessage({defaultMessage:"Chú ý: Khi đã xử lý nhập kho, thì không thể huỷ nhập kho cho đơn đã xử lý",})}
          </span>
        </div>

        <div>
          <table style={{ borderBottom: "1px solid #d9d9d9", borderTop: "1px solid #d9d9d9",}} className="table table-borderless table-vertical-center fixed mb-0">
            <thead
              style={{
                background: "#F3F6F9",
                fontWeight: "bold",
                fontSize: "13px",
                zIndex: 10,
                borderRight: "1px solid #d9d9d9",
                borderLeft: "1px solid #d9d9d9",
              }}
            >
              <tr className="font-size-lg">
                <th style={{ fontSize: "14px", textAlign: "center" }} width="25%">
                  Hàng hóa sàn
                </th>
                <th style={{ fontSize: "14px", textAlign: "center" }} width="25%">
                  Hàng hóa kho
                </th>
                <th style={{ fontSize: "14px", textAlign: "center" }} width="10%">
                  ĐVT
                </th>
                <th style={{ fontSize: "14px", textAlign: "center" }} width="10%">
                Trạng thái
                </th>

                <th style={{ fontSize: "14px", textAlign: "center" }} width="15%">
                  Số lượng nhập kho
                </th>
                <th style={{ fontSize: "14px", textAlign: "center" }} width="15%">
                    Thao tác
                </th>
              </tr>
            </thead>
            <tbody style={{ borderRight: "1px solid #d9d9d9", borderLeft: "1px solid #d9d9d9", borderBottom: "1px solid d9d9d9"}}>
              {!!dataTable
                ? dataTable.slice(onSizePage * (page - 1),onSizePage + onSizePage * (page - 1))?.map((__item, index) => (
                    <RowTableProcessOrder
                    values={values}
                    state={state}
                    dataStore={dataStore}
                    key={index}
                    item={__item}
                    updateState={updateState}
                  />
                ))
                : null}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPage={totalPage}
          loading={loadingScan}
          setPage={setPage}
          limit={onSizePage}
          onSizePage={setOnSizePage}
          totalRecord={totalRecord}
          count={count}
          onPanigate={(page) => setPage(page)}
          emptyTitle={formatMessage({
            defaultMessage: "Không tìm thấy đơn hoàn phù hợp",
          })}
        />
      </CardBody>
    </Card>
  );
};

export default forwardRef(OrderListProcess);
