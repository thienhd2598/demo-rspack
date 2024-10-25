import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl';
import RcTable from 'rc-table';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useQuery, useMutation } from '@apollo/client';
import query_sme_catalog_category from '../../../../graphql/query_sme_catalog_category';
import mutate_insert_sme_catalog_category_one from '../../../../graphql/mutate_insert_sme_catalog_category_one';
import mutate_update_sme_catalog_category from '../../../../graphql/mutate_update_sme_catalog_category';
import mutate_userDeleteCatalogCategory from '../../../../graphql/mutate_userDeleteCatalogCategory';
import DialogAddCategory from './dialogs/DialogAddCategory';
import dayjs from "dayjs";
import { useToasts } from 'react-toast-notifications';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { useLocation, useHistory, Link } from "react-router-dom";
import queryString from 'querystring'
import Pagination from '../../../../components/Pagination';
import { stubTrue } from 'lodash';
import DialogConfirm from './dialogs/DialogConfirm';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const TableProductCategories = () => {
    const [dataDialogCategory, setDataDialogCategory] = useState({
      isOpen: false
    })
    const { addToast } = useToasts()
    const params = queryString.parse(useLocation().search.slice(1, 100000))
    const { formatMessage } = useIntl()
    // ================= ****** =========================
    let page = useMemo(() => {
        try {
          let _page = Number(params.page)
          if (!Number.isNaN(_page)) {
            return Math.max(1, _page)
          } else {
            return 1
          }
        } catch (error) {
          return 1
        }
      }, [params.page])
      
      let limit = useMemo(() => {
        try {
          let _value = Number(params.limit)
          if (!Number.isNaN(_value)) {
            return Math.max(25, _value)
          } else {
            return 25
          }
        } catch (error) {
          return 25
        }
      }, [params.limit]);
    // ===============================================
    const { loading, data, error, refetch } = useQuery(query_sme_catalog_category, {
        variables: {
            limit,
            offset: (page - 1) * limit,
            order_by: { updated_at: 'desc' }
          },
        fetchPolicy: "cache-and-network",
      });

    const [insertCatalogCategory] = useMutation(mutate_insert_sme_catalog_category_one, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_catalog_category']
    })

    const [deleteCatalogCategory] = useMutation(mutate_userDeleteCatalogCategory, {
      awaitRefetchQueries: true,
      refetchQueries: ['sme_catalog_category']
    })

    const [updateCatalogCategory] = useMutation(mutate_update_sme_catalog_category, {
      awaitRefetchQueries: true,
      refetchQueries: ['sme_catalog_category']
    })
    const toast = (status, msgSuccess, msgError) => {
      addToast(!!status ? msgSuccess : msgError, {appearance: !!status ? 'success' : 'error'})

        setDataDialogCategory({
          isOpen: false
        })
    }
 
  const updateAddCategory = async (id, name) => {
    try {
      const { data } = await updateCatalogCategory({
        variables: {
            id: id,
            name: name
        }
      })
      toast(data?.update_sme_catalog_category?.affected_rows, formatMessage({defaultMessage: 'Cập nhật danh mục thành công'}), formatMessage({defaultMessage: 'Cập nhật danh mục thất bại'}))

      } catch (err) {

      }
  }


    const handleAddCategory = async (name) => {
        try {
          const { data } = await insertCatalogCategory({
            variables: {
                object: {
                    name: name
                }
            }
        })
        toast(data?.insert_sme_catalog_category_one, formatMessage({defaultMessage: 'Thêm danh mục thành công'}), formatMessage({defaultMessage: 'Thêm danh mục thất bại'}))
        } catch(err) {

        }
    }

    const handleDeleteCategory = async (id) => {
      try {
        const { data } = await deleteCatalogCategory({
          variables: {
             id: id
          }
        })
         toast(data?.userDeleteCatalogCategory?.success, formatMessage({defaultMessage: 'Xóa danh mục thành công'}), formatMessage({defaultMessage: 'Xóa danh mục thất bại'}))
      } catch(err) {

      }
      
  }
    

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'ID' }),
            align: 'left',
            width: '10%',
            className: 'p-0',
            render: (record, item) => {
                return (
                    <div className={{ borderBottomNone: !item?.borderBottomNone }} style={{ padding: '5px' }}>
                        {item?.id}
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Tên danh mục' }),
            align: 'left',
            width: '40%',
            render: (record, item) => {
                return (
                    <div className='d-flex align-items-center'>
                         {item?.name || '--'}
                         <AuthorizationWrapper keys={["warehouse_category_action"]}>
                          <i onClick={() => setDataDialogCategory({
                            isOpen: true,
                            id: item?.id,
                            name: item?.name,
                            action: 'UPDATE'
                          })} style={{cursor: 'pointer'}} className="ml-2 text-dark far fa-edit" />
                         </AuthorizationWrapper>
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Ngày cập nhật' }),
            align: 'center',
            width: '30%',
            render: (record, item) => {
                return (
                    <div>
                       {dayjs(item?.updated_at).format("HH:mm DD/MM/YYYY") || '--'}
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thao tác' }),
            align: 'center',
            width: '20%',
            render: (record, item) => {
                return (
                    <div>
                      <AuthorizationWrapper keys={['warehouse_category_action']}>
                        <span style={{cursor: 'pointer'}}
                          onClick={() => setDataDialogCategory({isOpen: true, id: item?.id, action: 'DELETE'})}>
                            {formatMessage({defaultMessage: 'Xóa'})}
                          </span>
                      </AuthorizationWrapper>
                    </div>
                )
            }
        }
    ]

  let totalRecord = data?.sme_catalog_category_aggregate?.aggregate?.count || 0

  let totalPage = Math.ceil(totalRecord / limit)

  const errorView = () => {
    return (
      <div
        className="w-100 text-center mt-8r"
        style={{ position: "absolute", zIndex: 100, left: '50%', transform: 'translateX(-50%)' }}
      >
        <div className="d-flex flex-column justify-content-center align-items-center">
            <i className="far fa-times-circle text-danger" style={{ fontSize: 48, marginBottom: 8 }}></i>
            <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
            <button
                className="btn btn-primary btn-elevate"
                style={{ width: 100 }}
                onClick={(e) => {
                    e.preventDefault();
                    refetch();
                }}
            >
                {formatMessage({ defaultMessage: 'Tải lại' })}
            </button>
        </div>
    </div>
    )
  }

  return (
    <div>
        <LoadingDialog show={loading} />
        <DialogConfirm handleDeleteCategory={() => handleDeleteCategory(dataDialogCategory?.id)} show={dataDialogCategory?.isOpen && dataDialogCategory?.action == 'DELETE'} onHide={() => setDataDialogCategory({ isOpen: false })}/>
        {(dataDialogCategory.isOpen && ['UPDATE', 'ADD'].includes(dataDialogCategory.action) ) && (
             <DialogAddCategory 
              updateAddCategory={(id, name) => updateAddCategory(id, name)}
              handleAddCategory={(name) => handleAddCategory(name)}
              dataDialogAddCategory={dataDialogCategory} onHide={() => setDataDialogCategory(false)}
         />
        )}
          <AuthorizationWrapper keys={['warehouse_category_action']}>
            <button className="btn btn-primary mb-4 d-flex" style={{marginLeft: 'auto', cursor: 'pointer', color: '#white', borderColor: '#ff5629'}}
                onClick={() => setDataDialogCategory({isOpen: true, action: 'ADD'})}
                disabled={false}
            >
                {formatMessage({defaultMessage: 'Thêm danh mục'})}
              </button>
            </AuthorizationWrapper>
          {!!error && !loading && errorView()}
        <RcTable
            style={loading ? { opacity: 0.4 } : {}}
            className="upbase-table"
            columns={columns}
            data={data?.sme_catalog_category || []}
            emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                <img src={toAbsoluteUrl("/media/empty.png")} alt="" width={80} />
                <span className='mt-4'>{formatMessage({ defaultMessage: 'Không có dữ liệu' })}</span>
            </div>}
            tableLayout="auto"
            sticky={{ offsetHeader: 43 }}
        />

        {!error && (
          <Pagination
            page={page}
            totalPage={totalPage}
            loading={loading}
            limit={limit}
            totalRecord={totalRecord}
            count={data?.sme_catalog_category?.length}
            basePath={'/products/warehouse-bill/product-categories'}
            emptyTitle=''
            style={{ zIndex: 1000 }}
          />
        )}
    </div>
  )
}

export default TableProductCategories