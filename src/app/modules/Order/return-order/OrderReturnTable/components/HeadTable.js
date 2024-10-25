import React from "react";
import { Checkbox } from "../../../../../../_metronic/_partials/controls";
import { memo } from "react";
import { useIntl } from 'react-intl';
const HeadTable = memo(({ isSelectAll, setIds, data, ids, pxSticky, params }) => {
  const { formatMessage } = useIntl()
  return (
    <thead
      style={{
        position: "sticky",
        top: 147 + pxSticky,
        zIndex: 31,
        background: "#F3F6F9",
        fontWeight: "bold",
        fontSize: "14px",
        borderRight: '1px solid #d9d9d9',
        borderLeft: '1px solid #d9d9d9'
      }}
    >
      <tr className="font-size-lg">
        {/* column1 */}
        <th style={{ fontSize: "14px" }}>
          <div className="d-flex">
            {!params?.is_old_order && <Checkbox
              size="checkbox-md"
              inputProps={{
                "aria-label": "checkbox",
              }}
              isSelected={isSelectAll}
              onChange={(e) => {
                if (isSelectAll) {
                  setIds(
                    ids.filter((x) => {
                      return !data?.some(
                        (returnOrder) => returnOrder.id === x.id
                      );
                    })
                  );
                } else {
                  const tempArray = [...ids];
                  (data || []).forEach((_returnorder) => {
                    if (
                      _returnorder &&
                      !ids.some((item) => item.id === _returnorder.id)
                    ) {
                      tempArray.push(_returnorder);
                    }
                  });
                  setIds(tempArray);
                }
              }}
            />}
            <span className="mx-4">{formatMessage({ defaultMessage: 'Thông tin sản phẩm' })}</span>
          </div>
        </th>
        {/* column2 */}
        <th style={{ fontSize: "14px" }} width="100px">
          {formatMessage({ defaultMessage: 'Tổng tiền hoàn' })}
        </th>
        {/* column3 */}
        <th style={{ fontSize: "14px" }} width="145px">
          {formatMessage({ defaultMessage: 'Trạng thái sàn TMĐT' })}
        </th>
        {/* column4 */}
        <th style={{ fontSize: "14px" }} width="145px">
          {formatMessage({ defaultMessage: 'Thời gian' })}
        </th>
        {/* column5 */}
        <th style={{ fontSize: "14px" }}>{formatMessage({ defaultMessage: 'Thông tin đơn' })}</th>
        {/* column5 */}
        <th style={{ fontSize: "14px" }}>
          {formatMessage({ defaultMessage: 'Người mua' })}
        </th>
        {/* column5 */}
        <th style={{ fontSize: "14px", textAlign: "center" }} >
          {formatMessage({ defaultMessage: 'Thao tác' })}
        </th>
      </tr>
    </thead>
  );
});

export default HeadTable;