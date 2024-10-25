import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from "react";
  import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
  import { useMutation } from "@apollo/client";
  import { useToasts } from "react-toast-notifications";
  import SVG from "react-inlinesvg";
  import { useIntl } from "react-intl";
  import Axios from "axios";
  import { useSelector } from "react-redux";
  import dayjs from "dayjs";
  import { saveAs } from "file-saver";
  import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
  import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";
  import { ModalResultShippingFile } from './ModalResultShippingFile'
  import mutate_coImportDataShipping from '../../../../graphql/mutate_coImportDataShipping'

  const UploadFileShipping = ({ show, onHide , setDataImportShipping}) => {
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [linkFile, setLinkFile] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const user = useSelector((state) => state.auth.user);
    
    const resetData = () => {
      setLinkFile(null);
      setFileName(null);
      onHide()
    };
  
    const [coImportDataShipping] = useMutation(mutate_coImportDataShipping, { awaitRefetchQueries: true,
      refetchQueries: ['scGetPackages', 'scPackageAggregate']
    });


    const addProductFromFile = useCallback(async () => {
      setLoadingSubmit(true);
      let { data } = await coImportDataShipping({
        variables: {
          file_url: linkFile,
        },
      });
      setLoadingSubmit(false);
      if (!!data?.coImportDataShipping?.success) {
        setDataImportShipping(data?.coImportDataShipping || [])
        resetData();
      } else {
        addToast(data?.coImportDataShipping?.message || formatMessage({defaultMessage: "Nhập file không thành công",}),{ appearance: "error" });
      }
    }, [linkFile]);
    const handleFileChange = useCallback(async (event) => {
      const fileObj = event.target.files && event.target.files[0];
      if (!fileObj) {
        return;
      }
      if (event.target.files[0].size > 5 * 1024 * 1024) {
        addToast(formatMessage({defaultMessage:'Dung lượng file tối đa 5MB'}), { appearance: 'error' });
        return;
    }
  
      setLoading(true);
      try {
        let formData = new FormData();
        formData.append("type", "file");
        formData.append("file", fileObj, fileObj.name);
        let res = await Axios.post(process.env.REACT_APP_URL_FILE_UPLOAD,formData,{isSubUser: user?.is_subuser,});
        if (res.data?.success) {
          setLinkFile(res.data?.data.source);
          setFileName(fileObj.name);
        } else {
          addToast(formatMessage({ defaultMessage: "Tệp tải lên không thành công" }), { appearance: "error" });
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }, []);
  
    return (
      <Modal size="lg" show={show} aria-labelledby="example-modal-sizes-title-sm" dialogClassName="modal-show-connect-product" centered onHide={resetData} backdrop={true}>
        <Modal.Header closeButton={false}>
          <Modal.Title>{formatMessage({ defaultMessage: "Tải file vận chuyển" })}</Modal.Title>
            <span><i style={{cursor: 'pointer'}} onClick={resetData} className="drawer-filter-icon fas fa-times icon-md text-right"></i></span>
        </Modal.Header>
        <div className="d-flex align-items-center py-2 px-4" style={{ backgroundColor: '#CFF4FC', border: '1px solid #B6EFFB', borderRadius: 4 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" style={{ color: '#055160' }} className="bi bi-lightbulb mr-2" viewBox="0 0 16 16">
          <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z" />
          </svg>
          <span className="fs-14" style={{ color: '#055160' }}>
          {formatMessage({ defaultMessage: 'Với các dơn hàng đã có dữ liệu vận chuyển, hệ thống sẽ thực hiện ghi đè dữ liệu trước đó.' })}
          </span>
        </div>
        <Modal.Body className="overlay overlay-block cursor-default px-10 pb-15">
          <div className="row">
            <div className="col-3">{formatMessage({ defaultMessage: "Tải excel mẫu" })}</div>
            <div className="col-9 px-0 mb-5">
              <button type="button" className="btn btn-primary mr-3" style={{color: "#ffffff",borderColor: "#ff5629"}}
                onClick={async () => {
                  const fileTemplate = "https://prod-statics.s3.ap-southeast-1.amazonaws.com/template/Stagging/file_mau_van_chuyen.xlsx"
              
                  let name = fileTemplate?.split("/template/");
                  let getNameFile = name.at(1).split(".").at(0)
  
                  const nameDownload = `${getNameFile.charAt(0).toUpperCase() + getNameFile.slice(1)}${dayjs(new Date()).format("DDMMYYYY").toString()}`;
                  saveAs(fileTemplate, nameDownload)
                }}
              >
                {formatMessage({ defaultMessage: "Tải file mẫu tại đây" })}
              </button>
            </div>
            <div className="col-3">{formatMessage({ defaultMessage: "Tải lên tập tin" })}<span className="text-danger">*</span></div>
            <div className="col-9 d-flex align-items-center justify-content-center" style={{ height: 150,padding: "16px, 0px, 16px, 0px",border: "1px solid rgba(0, 0, 0, 0.2)", borderRadius: 5,}}>
              <input accept=".xlsx, .xls" style={{ display: "none" }} type="file"onChange={handleFileChange} ref={inputRef}/>
              <div className="text-center">
                {loading && <span className="spinner "></span>}
                {!linkFile && !loading && (
                  <>
                    <div role="button" onClick={async () => inputRef.current.click()}>
                      <SVG src={toAbsoluteUrl("/media/svg/icon.svg")} className="h-75 align-self-end mb-5"></SVG>
                    </div>
                    <b className="fs-16 mb-2">Click or drag file to this area to upload</b>
                    <div className="text-secondary-custom fs-14">
                      {formatMessage({defaultMessage: "File dưới 5MB, định dạng xls"})}
                    </div>
                  </>
                )}
                {linkFile && (
                  <>
                    <i class="fas fa-file-excel mb-4" style={{color: "green",fontSize: 70,}}></i>
                    <p className="text-secondary-custom fs-14">{fileName}</p>
                  </>
                )}
              </div>
            </div>
            <div className="col-3"></div>
            <div className="col-9 px-0 mt-3">
              <div className="text-secondary-custom fs-14">{formatMessage({defaultMessage:"File nhập có dung lượng tối đa 5MB và 1000 bản ghi",})}</div>
            </div>
          </div>
          <LoadingDialog show={loadingSubmit} />
   
        </Modal.Body>
        <Modal.Footer className="form" style={{borderTop: "1px solid #dbdbdb", justifyContent: "end",paddingTop: 10,paddingBottom: 10}}>
          <div className="form-group">
            <button onClick={addProductFromFile} type="button" disabled={loadingSubmit || loading || !linkFile} className="btn btn-primary btn-elevate mr-3" style={{ width: 100 }}>
              {formatMessage({defaultMessage: 'Đồng ý'})}
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    );
  };
  
  export default memo(UploadFileShipping);
  