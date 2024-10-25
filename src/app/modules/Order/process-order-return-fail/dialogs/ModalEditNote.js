import { Field, Formik } from "formik";
import React, { useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { useIntl } from "react-intl";
import * as Yup from "yup";
import { Input, TextArea } from "../../../../../_metronic/_partials/controls";
import ImageUpload from "../../process-order-return/view/ImageUpload";
import { useToasts } from "react-toast-notifications";
import ImageView from "../../../../../components/ImageView";
import { randomString } from "../../../../../utils";
import VideoUpload from "../../fail-delivery-order/VideoUpload";
import { PATTERN_URL } from "../../OrderUIHelpers";

const ModalEditNote = ({ updateState, state }) => {
  const { formatMessage } = useIntl();
  const { addToast } = useToasts();
  const [imgsNote, setImgsNote] = useState([]);
  const [imageInvalid, setImageInvalid] = useState([]);
  const [switchEdit, setSwitchEdit] = useState(false);
  const [productVideFiles, setProductVideFiles] = useState([])
  const SignupSchema = Yup.object().shape({
    note: Yup.string()
      .notRequired()
      .max(255, formatMessage({ defaultMessage: "Ghi chú nhập tối đa 255 ký tự" })),
      urlVideo: Yup.string().notRequired()
      .matches(PATTERN_URL, 'Vui lòng nhập đúng định dạng')
  });
  const [initialForm, setInitialForm] = useState({
    note: "",
     urlVideo: ''
  });
  const findOrderOfKey = state.dataNote.find((e) => e.key == state.key);

  const noteUpdate = state.dataNote.filter((_note) => _note.key !== state.key);

  useMemo(() => {
    setImgsNote(findOrderOfKey?.links || []);
    setProductVideFiles(findOrderOfKey?.videosLink || []);
  }, [findOrderOfKey]);
  useMemo(() => {
    setInitialForm((prev) => ({
      ...prev,
      note: findOrderOfKey?.note || "",
      videosLink: findOrderOfKey?.videosLink || "",
      urlVideo: findOrderOfKey?.urlVideo
    }));
  }, [findOrderOfKey]);
  return (
    <Formik
      enableReinitialize
      initialValues={initialForm}
      validationSchema={SignupSchema}
      onSubmit={async (values) => {
        if (imgsNote.some(img => !!img?.isUploading)) {
          addToast(formatMessage({ defaultMessage: 'Hình ảnh đang tải lên. Xin vui lòng thử lại sau.' }), { appearance: 'error' });
          return;
        }
        if (productVideFiles.some(video => !!video?.isUploading)) {
          addToast(formatMessage({ defaultMessage: 'Video đang tải lên. Xin vui lòng thử lại sau.' }), { appearance: 'error' });
          return;
        }
        setSwitchEdit(false)
        updateState({
          modalEditNote: false,
          dataNote: [
            ...noteUpdate,
            {
              key: state.key,
              note: values.note,
              links: [...imgsNote],
              videosLink: [...productVideFiles],
              urlVideo: values.urlVideo
            },
          ],
        });
      }}
    >
      {({ values, handleSubmit }) => {
        return (
          <>
            <Modal
              size="lg"
              show={state.modalEditNote}
              aria-labelledby="example-modal-sizes-title-sm"
              dialogClassName="modal-show-connect-product"
              centered
              onHide={() => {
                updateState({
                  modalEditNote: false
                });
              }}
              backdrop={true}
            >
              <Modal.Header closeButton={true}>
                <Modal.Title>
                  {formatMessage({
                    defaultMessage: "Ghi chú xử lý trả hàng",
                  })}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div
                  className="scrollbar"
                  style={{
                    height: "max-content",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "150%",
                      color: "#212529",
                      display: "grid",
                      gridTemplateColumns: "20% auto",
                      gap: "5px 5px",
                    }}
                    className="mb-4"
                  >
                    <span style={{ textAlign: "right" }}>
                      {formatMessage({ defaultMessage: "Ghi chú" })}:
                    </span>
                    {switchEdit ? (
                    <div className="mb-2">
                      <div className="col-12">
                        <Field
                          name="note"
                          value={values?.note || ""}
                          component={TextArea}
                          placeholder={formatMessage({
                            defaultMessage: "Nhập ghi chú",
                          })}
                          label={""}
                          required={false}
                          customFeedbackLabel={" "}
                          cols={["col-0", "col-12"]}
                          countChar
                          rows={4}
                          maxChar={"255"}
                        />
                      </div>
                    </div> ): (
                      <div style={{ width: "300px", wordWrap: "break-word" }}>
                      <span>{values.note || "--"}</span>
                      <i
                        onClick={() => setSwitchEdit(true)}
                        style={{ width: "14px", cursor: "pointer" }}
                        role="button"
                        className="ml-2 text-dark far fa-edit"
                      ></i>
                    </div>
                    )}
                  </div>

                  <div
                    className="imgs_reason mb-2"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "20% auto",
                      gap: "5px 5px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 400,
                        fontSize: "16px",
                        lineHeight: "150%",
                        textAlign: "right",
                        color: "#212529",
                      }}
                    >
                      {formatMessage({ defaultMessage: "Hình ảnh" })}:
                    </span>
                    <div className="d-flex flex-wrap flex-gap-2">
                    {imgsNote?.map((file, index) => (
                        <div
                          className="img_upload_note"
                          style={{
                            width: "66px",
                            height: "66px",
                            margin: "5px",
                          }}
                        >
                          <ImageUpload
                            key={`refund-order-note-${index}`}
                            data={file}
                            accept={".png, .jpg, .jpeg"}
                            allowDowload
                            allowRemove
                            isSmall
                            onUploading={(isUploading) => {
                              setImgsNote(prev => prev.map(_ff => {
                                if (_ff.id != file.id) {
                                  return _ff
                                }
                                return {
                                  ..._ff,
                                  isUploading
                                }
                              }))
                            }}
                            onRemove={() => {
                              setImgsNote((prev) => {
                                let newImgs = [...prev];
                                newImgs.splice(index, 1);
                                return newImgs;
                              });
                            }}
                            onUploadSuccess={(dataAsset, id) => {
                              console.log({ dataAsset, id, imgsNote });
                              setImgsNote((prev) =>
                                prev.map((_ff) => {
                                  if (_ff.id == id) {
                                    return dataAsset;
                                  }
                                  return _ff;
                                })
                              );
                            }}
                          />
                        </div>
                      ))}
                      {imgsNote?.length < 5 && (
                        <div
                          className="img_upload_note"
                          style={{
                            width: "66px",
                            height: "66px",
                            margin: "5px",
                          }}
                        >
                          <ImageUpload
                            accept={".png, .jpg, .jpeg"}
                            multiple={true}
                            required={false}
                            isSmall
                            onChooseFile={(files) => {
                              console.log({ files });
                              let errorDuplicate = [];
                              let filesAccept = files.filter(
                                (_file) => _file.size <= 3 * 1024 * 1024
                              );

                              setImageInvalid(
                                files
                                  .map((_file, _index) => {
                                    let mess = [];
                                    if (_file.size > 3 * 1024 * 1024) {
                                      mess.push(
                                        formatMessage({
                                          defaultMessage: `Dung lượng tối đa 3MB`,
                                        })
                                      );
                                    }

                                    if (mess.length > 0)
                                      return {
                                        file: _file,
                                        message: mess.join(". "),
                                      };
                                    return null;
                                  })
                                  .filter((_error) => !!_error)
                              );

                              setImgsNote((prev) =>
                                prev
                                  .concat(
                                    filesAccept.map((_file) => ({
                                      id: randomString(12),
                                      file: _file,
                                      refFile: _file,
                                    }))
                                  )
                                  .slice(0, 5)
                              );
                              if (errorDuplicate.length > 0) {
                                addToast(
                                  formatMessage({
                                    defaultMessage:
                                      "Vui lòng không chọn hình ảnh trùng nhau",
                                  }),
                                  { appearance: "error" }
                                );
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {state?.dataScaned?.find(order => order?.other?.id == state?.key)?.other?.fulfillment_provider_type == 1 && (
                    <>
                    <div
                     className="imgs_reason mb-2"
                     style={{
                       display: "grid",
                       gridTemplateColumns: "20% auto",
                       gap: "5px 5px",
                     }}
                   >
                     <span
                       style={{
                         fontWeight: 400,
                         fontSize: "16px",
                         lineHeight: "150%",
                         textAlign: "right",
                         color: "#212529",
                       }}
                     >
                       {formatMessage({ defaultMessage: "Videos" })}:
                     </span>
                     <div className="d-flex flex-wrap flex-gap-2">
                     {
                       productVideFiles.map((_file, index) => {
                         return (
                           <VideoUpload
                           customeStyle={{width: 66, height: 66}}
                           isSingle={false}
                           setErrorVideo={mess => {
                             setProductVideFiles(prev => prev.map(_ff => {
                               return {
                                 ..._ff,
                                 hasError: true
                               }
                             }))
                           }}
                           data={_file} key={`file-pro-${_file.id}`} accept={".mp4"} allowRemove
                           onUploadError={(isUploadError) => {
                             setProductVideFiles(prev => prev.map(_ff => {
                               if (_ff.id != _file.id) {
                                 return _ff
                               }
                               return {
                                 ..._ff,
                                 isUploadError
                               }
                             }))
                           }}
                           onRemove={() => {
                             setProductVideFiles(prev => prev.filter(_ff => _ff.id != _file.id))
                           }}
                           onUploading={(isUploading) => {
                             setProductVideFiles(prev => prev.map(_ff => {
                               if (_ff.id != _file.id) {
                                 return _ff
                               }
                               return {
                                 ..._ff,
                                 isUploading
                               }
                             }))
                           }}
                           onUploadSuccess={(dataAsset) => {
                             setProductVideFiles(prev => prev.map(_ff => {
                               if (_ff.id == _file.id) {
                                 return dataAsset
                               }
                               return _ff
                             }))
                           }}
                         />
                         )
                        
                       })
                     }
                     {productVideFiles.length < 1 && 
                       <VideoUpload accept={".mp4"}
                         customeStyle={{width: 66, height: 66}}
                         onChooseFile={async files => {
                           setProductVideFiles(prev => prev.concat(files.map(_file => ({
                             id: randomString(12),
                             file: _file
                           }))).slice(0, 8))
                         }}
                       />
                     }
                     </div>
                   </div>
                    <div className="imgs_reason mb-2" style={{display: "grid", gridTemplateColumns: "20% auto", gap: "5px 5px",}}>
                  <span
                    style={{ fontWeight: 400, fontSize: "16px",  lineHeight: "150%", textAlign: "right", color: "#212529" }}
                  >
                    {formatMessage({ defaultMessage: "Đường dẫn" })}:
                  </span>
                  <div className="d-flex flex-wrap flex-gap-2">
                    <Field
                        name={`urlVideo`}
                        component={Input}
                        placeholder={formatMessage({defaultMessage: "https://"})}
                        label={""}
                        required={false}
                        customFeedbackLabel={" "}
                        cols={["col-0", "col-12"]}
                        rows={2}
                      />
                  </div>
                </div>
                    </>
                    
                  )}
                 

                </div>
              </Modal.Body>
              <Modal.Footer
                className="form"
                style={{
                  borderTop: "1px solid #dbdbdb",
                  justifyContent: "end",
                  paddingTop: 10,
                  paddingBottom: 10,
                }}
              >
                <div className="form-group">
                  <button
                    type="button"
                    className="btn btn mr-3"
                    style={{ width: 100, border: '1px solid gray' }}
                    onClick={() => {
                      updateState({
                        modalEditNote: false,
                      });
                    }}
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-elevate mr-3"
                    style={{ width: 100 }}
                    onClick={handleSubmit}
                  >
                    Xác nhận
                  </button>
                </div>
              </Modal.Footer>
            </Modal>
            <Modal
              show={imageInvalid.length > 0}
              aria-labelledby="example-modal-sizes-title-lg"
              centered
              size="lg"
              onHide={() => setImageInvalid([])}
            >
              <Modal.Body className="overlay overlay-block cursor-default text-center">
                <div className="mb-4 row">
                  {imageInvalid.map((_img, _index) => {
                    return (
                      <div className="col-12" key={`_index-img-${_index}`}>
                        <div
                          style={{
                            alignItems: "center",
                            display: "flex",
                            flexDirection: "row",
                            marginBottom: 16,
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: "#F7F7FA",
                              width: 50,
                              height: 50,
                              borderRadius: 8,
                              overflow: "hidden",
                              minWidth: 50,
                            }}
                            className="mr-6"
                          >
                            <ImageView
                              file={_img.file}
                              style={{
                                width: 50,
                                height: 50,
                                objectFit: "contain",
                              }}
                            />
                          </div>
                          <p
                            className="font-weight-normal mb-1"
                            style={{ textAlign: "left" }}
                          >
                            {_img.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="form-group mb-0">
                  <button
                    type="button"
                    className={`btn btn-primary font-weight-bold`}
                    style={{ width: 180 }}
                    onClick={async () => {
                      setImageInvalid([]);
                    }}
                  >
                    <span className="font-weight-boldest">
                      {formatMessage({ defaultMessage: "Xác nhận" })}
                    </span>
                  </button>
                </div>
              </Modal.Body>
            </Modal>
          </>
        );
      }}
    </Formik>
  );
};

export default ModalEditNote;
