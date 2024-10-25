import React from 'react';
import Table from 'rc-table'
import { Card, CardBody } from '../../../../../_metronic/_partials/controls'
import { useState, useMemo } from 'react';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { formatNumberToCurrency } from "../../../../../utils";
import { useIntl } from 'react-intl';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

export default function ReportTable({dataTable}) {
    const [selectedFeat, setSelectedFeat] = useState([]);
    const {formatMessage} = useIntl()
    console.log(dataTable)
    const columns = useMemo(() => {
        return [
          {
            title: 'Thời gian',
            dataIndex: 'id',
            width: 200,
            key: 'id',
            render: (item, record) => {
              return <span style={{fontWeight: 'bold'}}>{record?.label || '--'}</span>
            },
            align: 'center',
            fixed: true
          },
          {
            title: <div className='cursor-pointer'>
                <span>Số lượng hiệu quả</span>
                <span style={{ position: 'absolute', right: 4 }} onClick={() => {
                    if(selectedFeat?.some(value => value === 'effective-product')) {
                        setSelectedFeat(prev => prev?.filter(prev => prev != 'effective-product'))
                    } else {
                        setSelectedFeat(prev => prev?.concat('effective-product'))
                    }
                }}>
                    {!selectedFeat?.some(value => value === 'effective-product') 
                        ? <i className="fas fa-chevron-right text-dark" style={{ fontSize: '0.9rem' }} />
                        : <i className="fas fa-chevron-left text-dark" style={{ fontSize: '0.9rem' }} />
                    }
                </span>
            </div>,
            dataIndex: 'effective-product',
            width: 200,
            key: 'effective-product',
            render: (item, record) => {
              const value = record?.items.find(item => item?.title == 'Số lượng hiệu quả')
              const quantity = value?.value - value?.return - value?.cancel
              return <span style={{fontWeight: 'bold'}}>{formatNumberToCurrency(quantity)} {`(${value?.value ? (quantity/value?.value*100).toFixed(2) : 0}%)`}</span>
            },
            align: 'center',
          },
          selectedFeat?.includes('effective-product') && (
            {
                title: <OverlayTrigger
                          placement='top'
                          overlay={
                              <Tooltip>
                                  <span>
                                    Tổng số lượng đã đặt
                                  </span>
                              </Tooltip>
                          }
                      ><span style={{fontWeight: 'lighter'}}>Tổng số lượng</span></OverlayTrigger>,
                dataIndex: 'id',
                width: 200,
                key: 'id',
                render: (item, record) => {
                  const value = record?.items.find(item => item?.title == 'Số lượng hiệu quả')
                  return <span style={{fontWeight: 'lighter'}}>{formatNumberToCurrency(value?.value)} {`(100%)`}</span>
                },
                align: 'center',
            }
          ),
          selectedFeat?.includes('effective-product') && (
            {
                title: <span style={{fontWeight: 'lighter'}}>Số lượng hủy</span>,
                dataIndex: 'id',
                width: 200,
                key: 'id',
                render: (item, record) => {
                  const value = record?.items.find(item => item?.title == 'Số lượng hiệu quả')
                  return <span style={{fontWeight: 'lighter'}}>{formatNumberToCurrency(value?.cancel)} {`(${value?.value ? (value?.cancel/value?.value*100).toFixed(2) : 0}%)`}</span>
                },
                align: 'center',
            }
          ),
          selectedFeat?.includes('effective-product') && (
            {
                title: <span style={{fontWeight: 'lighter'}}>Số lượng hoàn</span>,
                dataIndex: 'id',
                width: 200,
                key: 'id',
                render: (item, record) => {
                  const value = record?.items.find(item => item?.title == 'Số lượng hiệu quả')
                  return <span style={{fontWeight: 'lighter'}}>{formatNumberToCurrency(value?.return)} {`(${value?.value ? (value?.return/value?.value*100).toFixed(2) : 0}%)`}</span>
                },
                align: 'center',
            }
          ),
          {
            title: <div className='cursor-pointer'>
                <span>Doanh số hiệu quả</span>
                <span style={{ position: 'absolute', right: 4 }} onClick={() => {
                    if(selectedFeat?.some(value => value === 'effective-bussiness')) {
                        setSelectedFeat(prev => prev?.filter(prev => prev != 'effective-bussiness'))
                    } else {
                        setSelectedFeat(prev => prev?.concat('effective-bussiness'))
                    }
                }}>
                    {!selectedFeat?.some(value => value === 'effective-bussiness') 
                        ? <i className="fas fa-chevron-right text-dark" style={{ fontSize: '0.9rem' }} />
                        : <i className="fas fa-chevron-left text-dark" style={{ fontSize: '0.9rem' }} />
                    }
                </span>
            </div>,
            dataIndex: 'effective-bussiness',
            width: 200,
            key: 'effective-bussiness',
            render: (item, record) => {
              const value = record?.items.find(item => item?.title == 'Doanh số hiệu quả')
              const sale = value?.value - value?.return - value?.cancel
              return <span style={{fontWeight: 'bold'}}>{formatNumberToCurrency(sale)} {`(${value?.value ? (sale/value?.value*100).toFixed(2) : 0}%)`}</span>
            },
            align: 'center',
          },
          selectedFeat?.includes('effective-bussiness') && (
            {
                title: <OverlayTrigger
                          placement='top'
                          overlay={
                              <Tooltip>
                                  <span>
                                    Tổng doanh số đã đặt
                                  </span>
                              </Tooltip>
                          }
                      ><span style={{fontWeight: 'lighter'}}>Tổng doanh số</span></OverlayTrigger>,
                dataIndex: 'id',
                width: 200,
                key: 'id',
                render: (item, record) => {
                const value = record?.items.find(item => item?.title == 'Doanh số hiệu quả')
                  return <span style={{fontWeight: 'lighter'}}>{formatNumberToCurrency(value?.value)} {`(100%)`}</span>
                },
                align: 'center',
            }
          ),
          selectedFeat?.includes('effective-bussiness') && (
            {
                title: <span style={{fontWeight: 'lighter'}}>Doanh số hủy</span>,
                dataIndex: 'id',
                width: 200,
                key: 'id',
                render: (item, record) => {
                  const value = record?.items.find(item => item?.title == 'Doanh số hiệu quả')
                  return <span style={{fontWeight: 'lighter'}}>{formatNumberToCurrency(value?.cancel)} {`(${value?.value ? (value?.cancel/value?.value*100).toFixed(2) : 0}%)`}</span>
                },
                align: 'center',
            }
          ),
          selectedFeat?.includes('effective-bussiness') && (
            {
                title: <span style={{fontWeight: 'lighter'}}>Doanh số hoàn</span>,
                dataIndex: 'id',
                width: 200,
                key: 'id',
                render: (item, record) => {
                  const value = record?.items.find(item => item?.title == 'Doanh số hiệu quả')
                  return <span style={{fontWeight: 'lighter'}}>{formatNumberToCurrency(value?.return)} {`(${value?.value ? (value?.return/value?.value*100).toFixed(2) : 0}%)`}</span>
                },
                align: 'center',
            }
          ),
          {
            title: <div className='cursor-pointer'>
                <span>Đơn hàng hiệu quả</span>
                <span style={{ position: 'absolute', right: 4 }} onClick={() => {
                    if(selectedFeat?.some(value => value === 'effective-order')) {
                        setSelectedFeat(prev => prev?.filter(prev => prev != 'effective-order'))
                    } else {
                        setSelectedFeat(prev => prev?.concat('effective-order'))
                    }
                }}>
                     {!selectedFeat?.some(value => value === 'effective-order') 
                        ? <i className="fas fa-chevron-right text-dark" style={{ fontSize: '0.9rem' }} />
                        : <i className="fas fa-chevron-left text-dark" style={{ fontSize: '0.9rem' }} />
                    }
                </span>
            </div>,
            dataIndex: 'effective-order',
            width: 200,
            key: 'effective-order',
            render: (item, record) => {
              const value = record?.items.find(item => item?.title == 'Đơn hàng hiệu quả')
              const order = value?.value - value?.return - value?.cancel
              return <span style={{fontWeight: 'bold'}}>{formatNumberToCurrency(order)} {`(${value?.value ? (order/value?.value*100).toFixed(2) : 0}%)`}</span>
            },
            align: 'center',
          },
          selectedFeat?.includes('effective-order') && (
            {
                title: 
                <OverlayTrigger
                    placement='top'
                    overlay={
                        <Tooltip>
                            <span>
                              Tổng đơn hàng đã đặt
                            </span>
                        </Tooltip>
                    }
                ><span style={{fontWeight: 'lighter'}}>Tổng đơn hàng</span></OverlayTrigger>,
                dataIndex: 'id',
                width: 200,
                key: 'id',
                render: (item, record) => {
                  const value = record?.items.find(item => item?.title == 'Đơn hàng hiệu quả')
                  return <span style={{fontWeight: 'lighter'}}>{formatNumberToCurrency(value?.value)} {`(100%)`}</span>
                },
                align: 'center',
            }
          ),
          selectedFeat?.includes('effective-order') && (
            {
                title: <span style={{fontWeight: 'lighter'}}>Đơn hàng hủy</span>,
                dataIndex: 'id',
                width: 200,
                key: 'id',
                render: (item, record) => {
                  const value = record?.items.find(item => item?.title == 'Đơn hàng hiệu quả')
                  return <span style={{fontWeight: 'lighter'}}>{formatNumberToCurrency(value?.cancel)} {`(${value?.value ? (value?.cancel/value?.value*100).toFixed(2) : 0}%)`}</span>
                },
                align: 'center',
            }
          ),
          selectedFeat?.includes('effective-order') && (
            {
                title: <span style={{fontWeight: 'lighter'}}>Đơn hàng hoàn</span>,
                dataIndex: 'id',
                width: 200,
                key: 'id',
                render: (item, record) => {
                  const value = record?.items.find(item => item?.title == 'Đơn hàng hiệu quả')
                  return <span style={{fontWeight: 'lighter'}}>{formatNumberToCurrency(value?.return)} {`(${value?.value ? (value?.return/value?.value*100).toFixed(2) : 0}%)`}</span>
                },
                align: 'center',
            }
          ),
        ]
      }, [selectedFeat]);
    const groupByLabel = (data) => {
      const result = {};
    
      const temp = data?.forEach(statistic => {
        const mock = statistic?.data?.forEach(item => {
          if (!result[item?.label]) {
            result[item?.label] = [];
          }
          result[item?.label].push({
            ...item,
            title: statistic?.title,
            description: statistic?.description,
            tooltip: statistic?.tooltip,
            unit: statistic?.unit,
            color: statistic?.color
          });
        });
      });
    
      return Object.entries(result).map(([label, items]) => ({ label, items }));
    };
    const dataTableGroupedByLabel = groupByLabel(dataTable)

    const calculateSummary = (data) => {
      const summary = {
        effectiveProduct: 0,
        totalQuantity: 0,
        cancelQuantity: 0,
        returnQuantity: 0,
        effectiveBusiness: 0,
        totalSales: 0,
        cancelSales: 0,
        returnSales: 0,
        effectiveOrder: 0,
        totalOrders: 0,
        cancelOrders: 0,
        returnOrders: 0
      };
  
      data.forEach(record => {
        const items = record.items;
        items.forEach(item => {
          if (item.title === 'Số lượng hiệu quả') {
            summary.effectiveProduct += item.value - item.return - item.cancel;
            summary.totalQuantity += item.value;
            summary.cancelQuantity += item.cancel;
            summary.returnQuantity += item.return;
          } else if (item.title === 'Doanh số hiệu quả') {
            summary.effectiveBusiness += item.value - item.return - item.cancel;
            summary.totalSales += item.value;
            summary.cancelSales += item.cancel;
            summary.returnSales += item.return;
          } else if (item.title === 'Đơn hàng hiệu quả') {
            summary.effectiveOrder += item.value - item.return - item.cancel;
            summary.totalOrders += item.value;
            summary.cancelOrders += item.cancel;
            summary.returnOrders += item.return;
          }
        });
      });
  
      return summary;
    };
  
    const summaryData = calculateSummary(dataTableGroupedByLabel);

    return (
        <Card>
            <CardBody>
                <Table
                    className="upbase-table"
                    // style={loadingCrmProductByCustomer ? { opacity: 0.4 } : {}}
                    columns={columns}
                    data={ dataTableGroupedByLabel?.reverse() || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có sản phẩm' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                    scroll={{ x: selectedFeat?.length > 0 ? 'max-content' : 'unset' }}
                    summary={() => (
                      <Table.Summary fixed="bottom">
                      <Table.Summary.Row>
                        <Table.Summary.Cell align='center' fixed={true}><strong>Tổng</strong></Table.Summary.Cell>
                        <Table.Summary.Cell align='center'><strong>{formatNumberToCurrency(summaryData.effectiveProduct)} {`(${summaryData.totalQuantity ? (summaryData.effectiveProduct/summaryData.totalQuantity*100).toFixed(2): 0}%)`}</strong></Table.Summary.Cell>
                        {selectedFeat.includes('effective-product') && (
                          <>
                            <Table.Summary.Cell align='center'>{formatNumberToCurrency(summaryData.totalQuantity)} {`(100%)`}</Table.Summary.Cell>
                            <Table.Summary.Cell align='center'>{formatNumberToCurrency(summaryData.cancelQuantity)} {`(${summaryData.totalQuantity ? (summaryData.cancelQuantity/summaryData.totalQuantity*100).toFixed(2): 0} %)`}</Table.Summary.Cell>
                            <Table.Summary.Cell align='center'>{formatNumberToCurrency(summaryData.returnQuantity)} {`(${summaryData.totalQuantity ? (summaryData.returnQuantity/summaryData.totalQuantity*100).toFixed(2): 0} %)`}</Table.Summary.Cell>
                          </>
                        )}
                        <Table.Summary.Cell align='center'><strong>{formatNumberToCurrency(summaryData.effectiveBusiness)} {`(${summaryData.totalSales ? (summaryData.effectiveBusiness/summaryData.totalSales*100).toFixed(2): 0} %)`}</strong></Table.Summary.Cell>
                        {selectedFeat.includes('effective-bussiness') && (
                          <>
                            <Table.Summary.Cell align='center'>{formatNumberToCurrency(summaryData.totalSales)} {`(100%)`}</Table.Summary.Cell>
                            <Table.Summary.Cell align='center'>{formatNumberToCurrency(summaryData.cancelSales)} {`(${summaryData.totalSales ? (summaryData.cancelSales/summaryData.totalSales*100).toFixed(2): 0} %)`}</Table.Summary.Cell>
                            <Table.Summary.Cell align='center'>{formatNumberToCurrency(summaryData.returnSales)} {`(${summaryData.totalSales ? (summaryData.returnSales/summaryData.totalSales*100).toFixed(2): 0} %)`}</Table.Summary.Cell>
                          </>
                        )}
                        <Table.Summary.Cell align='center'><strong>{formatNumberToCurrency(summaryData.effectiveOrder)} {`(${summaryData.totalOrders ? (summaryData.effectiveOrder/summaryData.totalOrders*100).toFixed(2): 0} %)`}</strong></Table.Summary.Cell>
                        {selectedFeat.includes('effective-order') && (
                          <>
                            <Table.Summary.Cell align='center'>{formatNumberToCurrency(summaryData.totalOrders)} {`(100%)`}</Table.Summary.Cell>
                            <Table.Summary.Cell align='center'>{formatNumberToCurrency(summaryData.cancelOrders)} {`(${summaryData.totalOrders ? (summaryData.cancelOrders/summaryData.totalOrders*100).toFixed(2): 0} %)`}</Table.Summary.Cell>
                            <Table.Summary.Cell align='center'>{formatNumberToCurrency(summaryData.returnOrders)} {`(${summaryData.totalOrders ? (summaryData.returnOrders/summaryData.totalOrders*100).toFixed(2): 0} %)`}</Table.Summary.Cell>
                          </>
                        )}
                      </Table.Summary.Row>
                      </Table.Summary>
                    )}
                />
            </CardBody>
        </Card>
    )
}