/* eslint-disable no-unused-vars */
/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid */
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Nav, Tab, Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import PerfectScrollbar from "react-perfect-scrollbar";
import SVG from "react-inlinesvg";
import objectPath from "object-path";
import { useHtmlClassService } from "../../../_core/MetronicLayout";
import { toAbsoluteUrl } from "../../../../_helpers";
import { DropdownTopbarItemToggler } from "../../../../_partials/dropdowns";
import { FormattedMessage } from "react-intl";
import query_sme_catalog_notification from '../../../../../graphql/query_sme_catalog_notification';
import query_sme_catalog_notifications_aggregate from '../../../../../graphql/query_sme_catalog_notifications_aggregate';
import mutate_sme_catalog_notifications_by_pk from '../../../../../graphql/mutate_sme_catalog_notifications_by_pk';
import mutate_update_sme_catalog_notifications from "../../../../../graphql/mutate_update_sme_catalog_notifications";
import { useQuery, useMutation } from '@apollo/client';
import dayjs from 'dayjs';
import { useHistory } from 'react-router-dom';
import _ from 'lodash';

var relativeTime = require('dayjs/plugin/relativeTime');
var updateLocale = require('dayjs/plugin/updateLocale');
dayjs.extend(relativeTime);
dayjs.extend(updateLocale)
dayjs.updateLocale('en', {
  relativeTime: {
    future: "in %s",
    past: "%s trước",
    s: 'vài giây',
    m: "1 phút",
    mm: "%d phút",
    h: "1 giờ",
    hh: "%d giờ",
    d: "1 ngày",
    dd: "%d ngày",
    M: "1 tháng",
    MM: "%d tháng",
    y: "1 năm",
    yy: "%d năm"
  }
})

const perfectScrollbarOptions = {
  wheelSpeed: 2,
  wheelPropagation: false,
};

export function UserNotificationsDropdown() {
  const [key, setKey] = useState("Alerts");
  const history = useHistory();
  const bgImage = toAbsoluteUrl("/media/misc/bg-1.jpg");
  const { loading, data } = useQuery(query_sme_catalog_notification, {
    pollInterval: 1800000
  });
  const { data: dataAggregateNoti } = useQuery(query_sme_catalog_notifications_aggregate, {
    pollInterval: 1800000
  });
  const [updateNotification] = useMutation(mutate_sme_catalog_notifications_by_pk, {
    awaitRefetchQueries: true,
    refetchQueries: ['sme_catalog_notifications']
  });
  const [updateAllNotification] = useMutation(mutate_update_sme_catalog_notifications, {
    awaitRefetchQueries: true,
    refetchQueries: ['sme_catalog_notifications']
  })
  const [showNotification, setShowNotification] = useState(false);
  const refNotification = useRef();
  const [currentNotiIndex, setCurrentNotiIndex] = useState(0);
  const [currentType, setCurrentType] = useState('success');

  const dataNotification = useMemo(
    () => {
      let typeData = [
        { type: ['product_sync'], title: 'Đồng bộ' },
        { type: ['product', 'product_connector', 'product_load'], title: 'Tạo sản phẩm' },
        { type: ['product_frame'], title: 'Thông báo chung' },
      ];

      return typeData.map(
        item => {
          let dataNotiOfType = !!data && !!data?.sme_catalog_notifications
            ? data.sme_catalog_notifications
              .filter(_noti => item.type.some(ii => ii == _noti.ref_type))
              .map(_noti => ({
                url: _noti?.icon_link,
                refId: _noti?.ref_id,
                id: _noti?.id,
                iconLink: _noti?.icon_link,
                message: _noti?.message,
                refType: _noti?.ref_type,
                smeId: _noti?.sme_id,
                name: _noti?.title,
                type: _noti?.type,
                isRead: _noti?.is_read,
                time: dayjs(_noti?.created_at).fromNow()
              }))
            : [];

          return {
            type: item.title,
            data: dataNotiOfType
          }
        }
      )
    }, [data?.sme_catalog_notifications]
  );

  const _convertTitle = useCallback(
    (refType, type, name, message) => {
      let notiName = name?.length > 20 ? `${name?.slice(0, 20)} ...` : name;
      let notiMessage = message?.length > 15 ? `${message?.slice(0, 15)} ...` : message;

      if (type == 'success') {
        switch (refType) {
          case 'product_sync':
            return `Đã đồng bộ sản phẩm <${notiName}>`;
          case 'product':
            return `Tạo sản phẩm kho <${notiName}>`;
          case 'product_connector':
            return `Tạo sản phẩm sàn <${notiName}>`;
          case 'product_load':
            return `Đã lưu xuống sản phẩm <${notiName}>`;
          case 'product_frame':
            return `Đã tạo khung ảnh sản phẩm <${notiName}>`;
          default:
            return '';
        }
      } else {
        switch (refType) {
          case 'product_sync':
            return `Đồng bộ sản phẩm lỗi <${notiName}>: <${notiMessage}>`;
          case 'product':
            return `Tạo sản phẩm kho <${notiName}> lỗi: <${notiMessage}>`;
          case 'product_connector':
            return `Tạo sản phẩm sàn <${notiName}> lỗi: <${notiMessage}>`;
          case 'product_load':
            return `Đã lưu xuống sản phẩm lỗi <${notiName}>: <${notiMessage}>`;
          case 'product_frame':
            return `Đã tạo khung ảnh sản phẩm lỗi <${notiName}>: <${notiMessage}>`;
          default:
            return '';
        }
      }
    }, []
  )

  useEffect(() => {
    const checkIfClickedOutside = (e) => {
      if (showNotification && refNotification.current && !refNotification.current.contains(e.target)) {
        setShowNotification(false);
      }
    };

    document.addEventListener("mousedown", checkIfClickedOutside)

    return () => {
      document.removeEventListener("mousedown", checkIfClickedOutside)
    }
  }, [showNotification]);

  const uiService = useHtmlClassService();
  const layoutProps = useMemo(() => {
    return {
      offcanvas:
        objectPath.get(uiService.config, "extras.notifications.layout") ===
        "offcanvas",
    };
  }, [uiService]);

  return (
    <Dropdown drop="down" alignRight style={{ position: 'relative' }}>
      <Dropdown.Toggle
        as={DropdownTopbarItemToggler}
        id="kt_quick_notifications_toggle"
      >
        <div
          className="btn btn-icon btn-clean mr-4 px-2 notification-blur"
          id="kt_quick_notifications_toggle"
          onClick={e => {
            e.preventDefault();

            setShowNotification(true)
          }}
          style={{ width: 'fit-content' }}
        >

          <span className="svg-icon svg-icon-md svg-icon-control  mr-2">
            <SVG src={toAbsoluteUrl("/media/svg/ic_noti.svg")} />
          </span>
          <span style={{ color: 'black' }} className="fs-16" >Thông báo</span>
          {dataAggregateNoti?.sme_catalog_notifications_aggregate?.aggregate?.count > 0 && (
            <span className="pulse-ring-notification">
              {
                dataAggregateNoti?.sme_catalog_notifications_aggregate?.aggregate?.count > 99
                  ? '99+'
                  : dataAggregateNoti?.sme_catalog_notifications_aggregate?.aggregate?.count
              }
            </span>
          )}
        </div>
      </Dropdown.Toggle>
      <div
        className="notification-wrapper"
        ref={refNotification}
        style={{ display: showNotification ? 'block' : 'none' }}
      >
        <div className="notification-header">
          <p style={{ fontWeight: 'bold' }}>THÔNG BÁO</p>
          <p
            style={{ color: 'rgb(255, 86, 41)', cursor: 'pointer' }}
            onClick={e => {
              e.preventDefault();

              updateAllNotification()
            }}
          >
            Đánh dấu đã đọc tất cả
          </p>
        </div>
        <div className="d-flex align-items-center" style={{ padding: '0px 20px 10px', width: 380, overflowY: 'auto' }}>
          {
            dataNotification.map((_noti, index) => (
              <div
                key={`noti---${index}`}
                className="pt-2 pb-2 pl-3 pr-3 text-center mr-4"
                style={{
                  background: currentNotiIndex == index ? 'rgb(255, 86, 41)' : '#888484',
                  borderRadius: 20, color: '#fff', cursor: 'pointer',
                  minWidth: 'fit-content'
                }}
                onClick={e => {
                  e.preventDefault();
                  setCurrentType('success');
                  setCurrentNotiIndex(index);
                }}
              >
                {_noti.type}
              </div>
            ))
          }
        </div>
        <div className="d-flex align-items-center" style={{ padding: '0px 20px 10px' }}>
          {dataNotification[currentNotiIndex]?.type != 'Thông báo chung' ? (
            <>
              <p
                className={`mb-0 ${currentType == 'success' ? 'text-primary' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={e => {
                  e.preventDefault();
                  setCurrentType('success')
                }}
              >
                Thành công
              </p>
              <span>&ensp;|&ensp;</span>
              <p
                className={`mb-0 ${currentType == 'error' ? 'text-primary' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={e => {
                  e.preventDefault();
                  setCurrentType('error')
                }}
              >
                Thất bại
              </p>
            </>
          ) : (
            <div style={{ height: 10 }}></div>
          )}
        </div>
        <div className="notification-content">
          {
            dataNotification?.length > 0
              && dataNotification[currentNotiIndex]?.data?.length > 0
              && dataNotification[currentNotiIndex]?.data?.filter(_noti => _noti.type == currentType)?.length > 0
              ? (
                dataNotification[currentNotiIndex]?.type != 'Thông báo chung' 
                ? dataNotification[currentNotiIndex]?.data?.filter(_noti => _noti.type == currentType)
                : dataNotification[currentNotiIndex]?.data)?.map((_noti, index) => (
                <div
                  key={`noti---${index}`}
                  className="d-flex wraper"
                  style={{ background: _noti?.isRead === 1 ? '' : 'rgb(243,248,250)' }}
                  onClick={e => {
                    e.preventDefault();
                    if (_noti.refType == 'product') {
                      if (_noti.type == 'error') {
                        history.replace(`/product-stores/edit/${_noti.refId}`);
                        return;
                      }
                      history.replace(`/products/edit/${_noti.refId}`)
                    }
                    else if (_noti.refType == 'product_connector' || _noti.refType == 'product_sync' || _noti.refType == 'product_load' || _noti.refType == 'product_frame')
                      history.replace(`/product-stores/edit/${_noti.refId}`)
                    setShowNotification(false);
                    if (_noti?.isRead == 1) return;

                    updateNotification({
                      variables: {
                        id: _noti?.id,
                        is_read: 1
                      }
                    })
                  }}
                >
                  <div className="d-flex">
                    {_noti.refType == 'product_frame' ? (
                      <img
                        className="mr-4"
                        src={_noti.iconLink}
                        style={{ width: 50, height: 50 }}
                      />
                    ) : (
                      <>
                        {currentType == 'success' ? (
                          <i
                            className='fas fa-check-circle mr-4'
                            style={{ fontSize: 28, color: '#3DA153' }}
                          ></i>
                        ) : (
                          <i
                            className="fas fa-exclamation-triangle mr-4"
                            style={{ fontSize: 28, color: 'red' }}
                          ></i>
                        )}
                      </>
                    )}
                    <div className="d-flex" style={{ flexDirection: 'column', maxWidth: 265 }}>
                      <p
                        style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}
                      >
                        {
                          _convertTitle(_noti.refType, _noti.type, _noti.name, _noti.message)
                        }
                      </p>
                      <p style={{ color: '#8f9192' }}>{_noti.time}</p>
                    </div>
                  </div>
                  {_noti?.isRead != 1 && (
                    <div className="noti-wrapper-right"></div>
                  )}
                </div>
              )) : (
                <p className="notification-block-center">Chưa có thông báo</p>
              )}
        </div>
      </div>
    </Dropdown>
    // <Dropdown drop="down" alignRight>
    //   <Dropdown.Toggle
    //     as={DropdownTopbarItemToggler}
    //     id="kt_quick_notifications_toggle"
    //   >
    //     <OverlayTrigger
    //       placement="bottom"
    //       overlay={
    //         <Tooltip id="user-notification-tooltip">
    //           <FormattedMessage id="HEADER.GENERAL.NOTIFICATION" />
    //         </Tooltip>
    //       }
    //     >
    //       <div
    //         className="btn btn-icon btn-clean mr-6 px-2 "
    //         id="kt_quick_notifications_toggle"
    //         style={{ width: 'fit-content' }}
    //       >

    //         <span className="svg-icon svg-icon-md svg-icon-control  mr-2">
    //           <SVG src={toAbsoluteUrl("/media/svg/ic_noti.svg")} />
    //         </span>
    //         <span style={{ color: 'black' }} >Thông báo</span>
    //         {/* <span className="pulse-ring"></span>
    //         <span className="pulse-ring" /> */}
    //       </div>
    //     </OverlayTrigger>
    //   </Dropdown.Toggle>

    //   <Dropdown.Menu className="dropdown-menu p-0 m-0 dropdown-menu-right dropdown-menu-anim-up dropdown-menu-lg">
    //     <form>
    //       {/** Head */}
    //       <div
    //         className="d-flex flex-column pt-12 bgi-size-cover bgi-no-repeat rounded-top"
    //         style={{ backgroundImage: `url(${bgImage})` }}
    //       >
    //         <h4 className="d-flex flex-center rounded-top">
    //           <span className="text-white">User Notifications</span>
    //           <span className="btn btn-text btn-success btn-sm font-weight-bold btn-font-md ml-2">
    //             23 new
    //           </span>
    //         </h4>

    //         <Tab.Container defaultActiveKey={key}>
    //           <Nav
    //             as="ul"
    //             className="nav nav-bold nav-tabs nav-tabs-line nav-tabs-line-3x nav-tabs-line-transparent-white nav-tabs-line-active-border-success mt-3 px-8"
    //             onSelect={(_key) => setKey(_key)}
    //           >
    //             <Nav.Item className="nav-item" as="li">
    //               <Nav.Link
    //                 eventKey="Alerts"
    //                 className={`nav-link show ${key === "Alerts" ? "active" : ""
    //                   }`}
    //               >
    //                 Alerts
    //               </Nav.Link>
    //             </Nav.Item>
    //             <Nav.Item as="li">
    //               <Nav.Link
    //                 eventKey="Events"
    //                 className={`nav-link show ${key === "Events" ? "active" : ""
    //                   }`}
    //               >
    //                 Events
    //               </Nav.Link>
    //             </Nav.Item>
    //             <Nav.Item as="li">
    //               <Nav.Link
    //                 eventKey="Logs"
    //                 className={`nav-link show ${key === "Logs" ? "active" : ""
    //                   }`}
    //               >
    //                 Logs
    //               </Nav.Link>
    //             </Nav.Item>
    //           </Nav>

    //           <Tab.Content className="tab-content">
    //             <Tab.Pane eventKey="Alerts" className="p-8">
    //               <PerfectScrollbar
    //                 options={perfectScrollbarOptions}
    //                 className="scroll pr-7 mr-n7"
    //                 style={{ maxHeight: "300px", position: "relative" }}
    //               >
    //                 <div className="d-flex align-items-center mb-6">
    //                   <div className="symbol symbol-40 symbol-light-primary mr-5">
    //                     <span className="symbol-label">
    //                       <SVG
    //                         src={toAbsoluteUrl(
    //                           "/media/svg/icons/Home/Library.svg"
    //                         )}
    //                         className="svg-icon-lg svg-icon-primary"
    //                       ></SVG>
    //                     </span>
    //                   </div>
    //                   <div className="d-flex flex-column font-weight-bold">
    //                     <a
    //                       href="#"
    //                       className="text-dark text-hover-primary mb-1 font-size-lg"
    //                     >
    //                       Briviba SaaS
    //                     </a>
    //                     <span className="text-muted">
    //                       PHP, SQLite, Artisan CLIмм
    //                     </span>
    //                   </div>
    //                 </div>
    //                 <div className="d-flex align-items-center mb-6">
    //                   <div className="symbol symbol-40 symbol-light-warning mr-5">
    //                     <span className="symbol-label">
    //                       <SVG
    //                         src={toAbsoluteUrl(
    //                           "/media/svg/icons/Communication/Write.svg"
    //                         )}
    //                         className="svg-icon-lg svg-icon-warning"
    //                       ></SVG>
    //                     </span>
    //                   </div>
    //                   <div className="d-flex flex-column font-weight-bold">
    //                     <a
    //                       href="#"
    //                       className="text-dark-75 text-hover-primary mb-1 font-size-lg"
    //                     >
    //                       Briviba SaaS
    //                     </a>
    //                     <span className="text-muted">
    //                       PHP, SQLite, Artisan CLIмм
    //                     </span>
    //                   </div>
    //                 </div>
    //                 <div className="d-flex align-items-center mb-6">
    //                   <div className="symbol symbol-40 symbol-light-success mr-5">
    //                     <span className="symbol-label">
    //                       <SVG
    //                         src={toAbsoluteUrl(
    //                           "/media/svg/icons/Communication/Group-chat.svg"
    //                         )}
    //                         className="svg-icon-lg svg-icon-success"
    //                       ></SVG>
    //                     </span>
    //                   </div>
    //                   <div className="d-flex flex-column font-weight-bold">
    //                     <a
    //                       href="#"
    //                       className="text-dark text-hover-primary mb-1 font-size-lg"
    //                     >
    //                       Briviba SaaS
    //                     </a>
    //                     <span className="text-muted">
    //                       PHP, SQLite, Artisan CLIмм
    //                     </span>
    //                   </div>
    //                 </div>
    //                 <div className="d-flex align-items-center mb-6">
    //                   <div className="symbol symbol-40 symbol-light-danger mr-5">
    //                     <span className="symbol-label">
    //                       <SVG
    //                         src={toAbsoluteUrl(
    //                           "/media/svg/icons/General/Attachment2.svg"
    //                         )}
    //                         className="svg-icon-lg svg-icon-danger"
    //                       ></SVG>
    //                     </span>
    //                   </div>
    //                   <div className="d-flex flex-column font-weight-bold">
    //                     <a
    //                       href="#"
    //                       className="text-dark text-hover-primary mb-1 font-size-lg"
    //                     >
    //                       Briviba SaaS
    //                     </a>
    //                     <span className="text-muted">
    //                       PHP, SQLite, Artisan CLIмм
    //                     </span>
    //                   </div>
    //                 </div>
    //                 <div className="d-flex align-items-center mb-2">
    //                   <div className="symbol symbol-40 symbol-light-info mr-5">
    //                     <span className="symbol-label">
    //                       <SVG
    //                         src={toAbsoluteUrl(
    //                           "/media/svg/icons/General/Attachment2.svg"
    //                         )}
    //                         className="svg-icon-lg svg-icon-info"
    //                       ></SVG>
    //                     </span>
    //                   </div>
    //                   <div className="d-flex flex-column font-weight-bold">
    //                     <a
    //                       href="#"
    //                       className="text-dark text-hover-primary mb-1 font-size-lg"
    //                     >
    //                       Briviba SaaS
    //                     </a>
    //                     <span className="text-muted">
    //                       PHP, SQLite, Artisan CLIмм
    //                     </span>
    //                   </div>
    //                 </div>
    //                 <div className="d-flex align-items-center mb-2">
    //                   <div className="symbol symbol-40 symbol-light-info mr-5">
    //                     <span className="symbol-label">
    //                       <SVG
    //                         src={toAbsoluteUrl(
    //                           "/media/svg/icons/Communication/Mail-notification.svg"
    //                         )}
    //                         className="svg-icon-lg svg-icon-info"
    //                       ></SVG>
    //                     </span>
    //                   </div>
    //                   <div className="d-flex flex-column font-weight-bold">
    //                     <a
    //                       href="#"
    //                       className="text-dark text-hover-primary mb-1 font-size-lg"
    //                     >
    //                       Briviba SaaS
    //                     </a>
    //                     <span className="text-muted">
    //                       PHP, SQLite, Artisan CLIмм
    //                     </span>
    //                   </div>
    //                 </div>
    //                 <div className="d-flex align-items-center mb-2">
    //                   <div className="symbol symbol-40 symbol-light-info mr-5">
    //                     <span className="symbol-label">
    //                       <SVG
    //                         src={toAbsoluteUrl(
    //                           "/media/svg/icons/Design/Bucket.svg"
    //                         )}
    //                         className="svg-icon-lg svg-icon-info"
    //                       ></SVG>
    //                     </span>
    //                   </div>
    //                   <div className="d-flex flex-column font-weight-bold">
    //                     <a
    //                       href="#"
    //                       className="text-dark text-hover-primary mb-1 font-size-lg"
    //                     >
    //                       Briviba SaaS
    //                     </a>
    //                     <span className="text-muted">
    //                       PHP, SQLite, Artisan CLIмм
    //                     </span>
    //                   </div>
    //                 </div>
    //               </PerfectScrollbar>
    //             </Tab.Pane>
    //             <Tab.Pane
    //               eventKey="Events"
    //               id="topbar_notifications_events"
    //             >
    //               <PerfectScrollbar
    //                 options={perfectScrollbarOptions}
    //                 className="navi navi-hover scroll my-4"
    //                 style={{ maxHeight: "300px", position: "relative" }}
    //               >
    //                 <a href="#" className="navi-item">
    //                   <div className="navi-link">
    //                     <div className="navi-icon mr-2">
    //                       <i className="flaticon2-line-chart text-success"></i>
    //                     </div>
    //                     <div className="navi-text">
    //                       <div className="font-weight-bold">
    //                         New report has been received
    //                       </div>
    //                       <div className="text-muted">23 hrs ago</div>
    //                     </div>
    //                   </div>
    //                 </a>

    //                 <a href="#" className="navi-item">
    //                   <div className="navi-link">
    //                     <div className="navi-icon mr-2">
    //                       <i className="flaticon2-paper-plane text-danger"></i>
    //                     </div>
    //                     <div className="navi-text">
    //                       <div className="font-weight-bold">
    //                         Finance report has been generated
    //                       </div>
    //                       <div className="text-muted">25 hrs ago</div>
    //                     </div>
    //                   </div>
    //                 </a>

    //                 <a href="#" className="navi-item">
    //                   <div className="navi-link">
    //                     <div className="navi-icon mr-2">
    //                       <i className="flaticon2-user flaticon2-line- text-success"></i>
    //                     </div>
    //                     <div className="navi-text">
    //                       <div className="font-weight-bold">
    //                         New order has been received
    //                       </div>
    //                       <div className="text-muted">2 hrs ago</div>
    //                     </div>
    //                   </div>
    //                 </a>

    //                 <a href="#" className="navi-item">
    //                   <div className="navi-link">
    //                     <div className="navi-icon mr-2">
    //                       <i className="flaticon2-pin text-primary"></i>
    //                     </div>
    //                     <div className="navi-text">
    //                       <div className="font-weight-bold">
    //                         New customer is registered
    //                       </div>
    //                       <div className="text-muted">3 hrs ago</div>
    //                     </div>
    //                   </div>
    //                 </a>

    //                 <a href="#" className="navi-item">
    //                   <div className="navi-link">
    //                     <div className="navi-icon mr-2">
    //                       <i className="flaticon2-sms text-danger"></i>
    //                     </div>
    //                     <div className="navi-text">
    //                       <div className="font-weight-bold">
    //                         Application has been approved
    //                       </div>
    //                       <div className="text-muted">3 hrs ago</div>
    //                     </div>
    //                   </div>
    //                 </a>

    //                 <a href="#" className="navi-item">
    //                   <div className="navi-link">
    //                     <div className="navi-icon mr-2">
    //                       <i className="flaticon2-pie-chart-3 text-warning"></i>
    //                     </div>
    //                     <div className="navinavinavi-text">
    //                       <div className="font-weight-bold">
    //                         New file has been uploaded
    //                       </div>
    //                       <div className="text-muted">5 hrs ago</div>
    //                     </div>
    //                   </div>
    //                 </a>

    //                 <a href="#" className="navi-item">
    //                   <div className="navi-link">
    //                     <div className="navi-icon mr-2">
    //                       <i className="flaticon-pie-chart-1 text-info"></i>
    //                     </div>
    //                     <div className="navi-text">
    //                       <div className="font-weight-bold">
    //                         New user feedback received
    //                       </div>
    //                       <div className="text-muted">8 hrs ago</div>
    //                     </div>
    //                   </div>
    //                 </a>

    //                 <a href="#" className="navi-item">
    //                   <div className="navi-link">
    //                     <div className="navi-icon mr-2">
    //                       <i className="flaticon2-settings text-success"></i>
    //                     </div>
    //                     <div className="navi-text">
    //                       <div className="font-weight-bold">
    //                         System reboot has been successfully completed
    //                       </div>
    //                       <div className="text-muted">12 hrs ago</div>
    //                     </div>
    //                   </div>
    //                 </a>

    //                 <a href="#" className="navi-item">
    //                   <div className="navi-link">
    //                     <div className="navi-icon mr-2">
    //                       <i className="flaticon-safe-shield-protection text-primary"></i>
    //                     </div>
    //                     <div className="navi-text">
    //                       <div className="font-weight-bold">
    //                         New order has been placed
    //                       </div>
    //                       <div className="text-muted">15 hrs ago</div>
    //                     </div>
    //                   </div>
    //                 </a>

    //                 <a href="#" className="navi-item">
    //                   <div className="navi-link">
    //                     <div className="navi-icon mr-2">
    //                       <i className="flaticon2-notification text-primary"></i>
    //                     </div>
    //                     <div className="navi-text">
    //                       <div className="font-weight-bold">
    //                         Company meeting canceled
    //                       </div>
    //                       <div className="text-muted">19 hrs ago</div>
    //                     </div>
    //                   </div>
    //                 </a>

    //                 <a href="#" className="navi-item">
    //                   <div className="navi-link">
    //                     <div className="navi-icon mr-2">
    //                       <i className="flaticon2-fax text-success"></i>
    //                     </div>
    //                     <div className="navi-text">
    //                       <div className="font-weight-bold">
    //                         New report has been received
    //                       </div>
    //                       <div className="text-muted">23 hrs ago</div>
    //                     </div>
    //                   </div>
    //                 </a>

    //                 <a href="#" className="navi-item">
    //                   <div className="navi-link">
    //                     <div className="navi-icon mr-2">
    //                       <i className="flaticon-download-1 text-danger"></i>
    //                     </div>
    //                     <div className="navi-text">
    //                       <div className="font-weight-bold">
    //                         Finance report has been generated
    //                       </div>
    //                       <div className="text-muted">25 hrs ago</div>
    //                     </div>
    //                   </div>
    //                 </a>

    //                 <a href="#" className="navi-item">
    //                   <div className="navi-link">
    //                     <div className="navi-icon mr-2">
    //                       <i className="flaticon-security text-warning"></i>
    //                     </div>
    //                     <div className="navi-text">
    //                       <div className="font-weight-bold">
    //                         New customer comment recieved
    //                       </div>
    //                       <div className="text-muted">2 days ago</div>
    //                     </div>
    //                   </div>
    //                 </a>

    //                 <a href="#" className="navi-item">
    //                   <div className="navi-link">
    //                     <div className="navi-icon mr-2">
    //                       <i className="flaticon2-analytics-1 text-success"></i>
    //                     </div>
    //                     <div className="navi-text">
    //                       <div className="font-weight-bold">
    //                         New customer is registered
    //                       </div>
    //                       <div className="text-muted">3 days ago</div>
    //                     </div>
    //                   </div>
    //                 </a>
    //               </PerfectScrollbar>
    //             </Tab.Pane>
    //             <Tab.Pane eventKey="Logs" id="topbar_notifications_logs">
    //               <div className="d-flex flex-center text-center text-muted min-h-200px">
    //                 All caught up!
    //                 <br />
    //                 No new notifications.
    //               </div>
    //             </Tab.Pane>
    //           </Tab.Content>
    //         </Tab.Container>
    //       </div>
    //     </form>
    //   </Dropdown.Menu>
    // </Dropdown>
  );
}
