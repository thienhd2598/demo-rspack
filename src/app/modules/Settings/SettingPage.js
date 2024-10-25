import React, { } from "react";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import { Card, CardBody } from "../../../_metronic/_partials/controls";
import _ from 'lodash'
import { Link } from "react-router-dom";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from "../../../_metronic/_helpers";
import { useSubheader } from "../../../_metronic/layout";
import { Helmet } from 'react-helmet-async';
import { useIntl } from "react-intl";
export default function SettingPage() {
  const suhbeader = useSubheader();
  suhbeader.setTitle('Cập nhật thông tin');
  const {formatMessage} = useIntl()

  return (
    <Card >
      <Helmet
        titleTemplate={formatMessage({defaultMessage:"Cập nhật thông tin"}) + "- UpBase"}
        defaultTitle={formatMessage({defaultMessage:"Cập nhật thông tin"}) + "- UpBase"}
      >
        <meta name="description" content={formatMessage({defaultMessage:"Cập nhật thông tin"}) + "- UpBase"} />
      </Helmet>
      <CardBody style={{ minHeight: 'calc(100vh - 260px)', padding: 24, margin: 0 }} className='row' >
        {/* <Link to='/setting/profile'  >
          <div style={{
            border: '1px solid #D9D9D9',
            borderRadius: 6,
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 16,
            paddingRight: 16,
            display: 'flex', alignItems: 'center',
            minWidth: 280,
          }} className='mr-4' >
            <div style={{
              width: 40, height: 40, backgroundColor: '#FE5629',
              borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} >
              <span className="svg-icon menu-icon">
                <SVG src={toAbsoluteUrl("/media/svg/ic_user2.svg")} />
              </span>
            </div>
            <span className='text-dark ml-2' style={{ fontWeight: 400 }} >Quản lý tài khoản & phân quyền</span>
          </div>
        </Link> */}
        <Link to='/setting/channels'  >
          <div style={{
            border: '1px solid #D9D9D9',
            borderRadius: 6,
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 16,
            paddingRight: 16,
            display: 'flex', alignItems: 'center',
            minWidth: 280,
          }}>
            <div style={{
              width: 40, height: 40, backgroundColor: '#FE5629',
              borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} >
              <span className="svg-icon menu-icon">
                <SVG src={toAbsoluteUrl("/media/svg/ic_store2.svg")} />
              </span>
            </div>
            <span className='text-dark ml-2' style={{ fontWeight: 400 }} >{formatMessage({defaultMessage:'Kết nối gian hàng'})}</span>
          </div>
        </Link>
      </CardBody>
    </Card>
  )
}
