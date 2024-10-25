import { useMutation, useQuery } from "@apollo/client";
import React, { useCallback, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { ProductsTable } from "./components/ProductsTable";
import mutate_scProductLoad from '../../../../graphql/mutate_scProductLoad'
import mutate_scProductSyncDown from '../../../../graphql/mutate_scProductSyncDown'
import query_sc_store from "../../../../graphql/query_sc_store";
import _ from 'lodash'
import { formatNumberToCurrency, getDeltaDateString } from "../../../../utils";
import dayjs from "dayjs";
import queryString from 'querystring'
import { useIntl } from "react-intl";

function ChannelsSyncDialog({ show, onHide }) {
  const params = useRouteMatch()
  const history = useHistory()
  const queryParams = queryString.parse(useLocation().search.slice(1, 100000))
  const [selectedId, setSelectedId] = useState([])
  const [timeRefresh, setTimeRefresh] = useState(Date.now())
const {formatMessage} = useIntl()

  const [scProductLoad, { loading: loadingProductload }] = useMutation(mutate_scProductLoad, {
    // refetchQueries: ['sc_store', 'sc_stores'],
    // awaitRefetchQueries: true
  })
  const [scProductSyncDown, { loading: loadingSync }] = useMutation(mutate_scProductSyncDown, {
    // refetchQueries: ['sc_store', 'sc_stores'],
    // awaitRefetchQueries: true
  })
  const { data, loading } = useQuery(query_sc_store, {
    variables: {
      id: !!params?.params?.shopID ? parseInt(params?.params?.shopID) : 0,
      skip: !(show && !!params?.params?.shopID)
    },
    fetchPolicy: 'cache-and-network',
    pollInterval: !(show && !!params?.params?.shopID) ? 0 : 3000
  })

  const currentSyncJob = useMemo(() => {
    if (!data?.sc_store) {
      return null;
    }
    setTimeRefresh(Date.now())
    let productSyncJobs = (data?.sc_store?.productSyncJobs || []).filter(_job => _job.st_sync_status == 1 && _job.st_sync_type != 1)
    if (productSyncJobs.length == 0) {
      return null;
    }

    return {
      total: _.sumBy(productSyncJobs, 'st_sync_total_product'),
      current: _.sumBy(productSyncJobs, 'st_sync_total_product_processed'),
      time: getDeltaDateString(dayjs(), dayjs().add(_.sumBy(productSyncJobs, 'st_sync_estimate_time'), 'second')).join(' '),
    }
  }, [data?.sc_store]);

  const _onSync = useCallback(async id => {
    setSelectedId([id])
    let res = await scProductSyncDown({
      variables: {
        store_id: parseInt(params?.params?.shopID),
        products: [id]
      }
    })
    setSelectedId([])
    console.log('useCallback::resresres', res)
  }, [params?.params?.shopID])


  return (
    <Modal
      onHide={onHide}
      show={show}
      aria-labelledby="example-modal-sizes-title-lg"
      centered
      size='xl'
    >
      <Modal.Body className="overlay overlay-block cursor-default text-center" >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} >
          <h4>{formatMessage({defaultMessage:'CHỌN SẢN PHẨM LƯU XUỐNG UPBASE'})}</h4>
          <a className='btn mb-2'
            onClick={onHide}
            href="#"
          >
            <i className="flaticon2-cross"></i>
          </a>
        </div>
        <div className='row mb-4' >
          <div className='col-6 d-flex' >
            <div className="input-icon mr-4" style={{ flex: 1, height: 'fit-content' }} >
              <input type="text" className="form-control" placeholder={formatMessage({defaultMessage:"Tên sản phẩm/SKU"})}
                onBlur={(e) => {
                  history.push(`${params?.url}?q=${e.target.value}`)
                }}
                defaultValue={queryParams?.q || ''}
                onKeyDown={e => {
                  if (e.keyCode == 13) {
                    history.push(`${params?.url}?q=${e.target.value}`)
                  }
                }}
              />
              <span><i className="flaticon2-search-1 icon-md"></i></span>
            </div>
            {/* <select
              className="form-control mr-4"
              onChange={(e) => {
              }}
              style={{ width: 100 }}
            >
              <option value="">Tồn kho</option>
              <option value="0">Selling</option>
              <option value="1">Sold</option>
            </select> */}
            <select
              className="form-control mr-4"
              onChange={(e) => {
              }}
              style={{ width: 100 }}
            >
              <option value="">{formatMessage({defaultMessage:'Đánh giá'})}</option>
              <option value="0">{formatMessage({defaultMessage:'1 sao'})}</option>
              <option value="1">{formatMessage({defaultMessage:'2 sao'})}</option>
              <option value="2">{formatMessage({defaultMessage:'3 sao'})}</option>
              <option value="3">{formatMessage({defaultMessage:'4 sao'})}</option>
              <option value="4">{formatMessage({defaultMessage:'5 sao'})}</option>
            </select>
          </div>
          <div className='col-6 d-flex justify-content-end ' >
            {
              !!currentSyncJob && <div className='text-left' >
                <p className='mb-0' >{formatMessage({defaultMessage:'Đang đồng bộ'})} ({formatNumberToCurrency(currentSyncJob.current)}/{formatNumberToCurrency(currentSyncJob.total)})</p>
                <div style={{
                  backgroundColor: "#C4C4C4", height: 10, width: 200,
                  borderRadius: 10, marginTop: 4, marginBottom: 4
                }}>
                  <div className='bg-primary' style={{ height: 10, width: 200.0 * currentSyncJob.current / (currentSyncJob.total || 1), borderRadius: 10 }} />
                </div>
                <p className='mt-0' >{formatMessage({defaultMessage:'Còn'})} {currentSyncJob.time} {formatMessage({defaultMessage:'nữa'})}</p>
              </div>
            }
            {/* {
              !loadingSync ? <button className="btn btn-primary ml-4" style={{ height: 'fit-content', textTransform: 'uppercase' }}
                disabled={selectedId.length == 0 || loading || loadingSync}
                onClick={async e => {
                  e.preventDefault()
                  let res = await scProductSyncDown({
                    variables: {
                      store_id: parseInt(params?.params?.shopID),
                      products: selectedId
                    }
                  })
                  setSelectedId([])

                  onHide()
                }}
              >Lưu xuống Upbase</button> : <span className="spinner spinner-primary mr-8" />
            } */}
            {
              !loadingProductload ? <button className="btn btn-primary ml-4" style={{ height: 'fit-content' }}
                disabled={loadingProductload}
                onClick={async e => {
                  e.preventDefault()
                  scProductLoad({
                    variables: {
                      store_id: parseInt(params?.params?.shopID)
                    }
                  })
                }}
              >{formatMessage({defaultMessage:'LOAD SẢN PHẨM'})} </button> : <span className="spinner spinner-primary mr-8" />
            }
          </div>
        </div>
        <ProductsTable selectedId={selectedId} setSelectedId={setSelectedId} onSync={_onSync} loadingSync={loadingSync} timeRefresh={timeRefresh} />
      </Modal.Body>
    </Modal >
  );
}

export default ChannelsSyncDialog;