import React from "react";
import { useHistory, useLocation } from 'react-router-dom';
import { toAbsoluteUrl } from "../../../_metronic/_helpers";
import { Layout } from "../../../_metronic/layout";

export function ErrorPage1() {
  const location = useLocation();
  const history = useHistory();

  console.log({ location, history })

  return (
    <Layout>
      <div className="d-flex flex-column align-items-center flex-root mt-10">
        <img
          src={toAbsoluteUrl("/media/error/authorization.jpg")}
          style={{ width: '40vw' }}
        />
        <h5 className="font-weight-boldest mb-12" style={{ fontSize: 22 }}>Bạn không có quyền truy cập tính năng này</h5>
        {history?.length > 1 && (
          <button
            className="btn btn-primary fs-16"
            style={{ width: 200 }}
            onClick={() => history.goBack()}
          >
            Quay lại
          </button>
        )}
      </div>
    </Layout>
  );
}
