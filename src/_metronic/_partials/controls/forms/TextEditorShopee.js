import { useFormikContext } from "formik";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";


import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

import { EditorState, convertToRaw, convertFromRaw, ContentState, Modifier } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import axios from "axios";
import { loadSizeImage } from '../../../../utils'
import { toAbsoluteUrl } from "../../../_helpers";
import { useToasts } from "react-toast-notifications";
import { stateFromHTML } from "draft-js-import-html";
import { useIntl } from "react-intl";


export function TextEditorShopee({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors, submitCount, ...rest }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  withFeedbackLabel = true,
  customFeedbackLabel,
  type = "text",
  required = false,
  countChar = false,
  allowCopy = false,
  maxChar = 5000,
  rows = 10,
  cols = ['col-3', 'col-9'],
  onErrorUpload,
  ...props
}) {
  const { addToast } = useToasts();
  const { setFieldValue, values, setFieldTouched } = useFormikContext()  
  // const [editorState, setEditorState] = useState(EditorState.createEmpty())

  // useEffect(() => {
  //   const blocksFromHtml = htmlToDraft(values[`${field.name}_init`] || ``);
  //   const { contentBlocks, entityMap } = blocksFromHtml;
  //   const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
  //   const _state = EditorState.createWithContent(contentState);
  //   setEditorState(_state);
  // }, [values[`${field.name}_init`]])
  const {formatMessage} = useIntl()
  const _imageCountRef = useRef(0)
  const _refSubmitCount = useRef(submitCount)
  const _uploadImageCallBack = useCallback((file) => {
    console.log('file----', file)

    return new Promise(
      async (resolve, reject) => {

        if (_imageCountRef.current >= 12) {
          !!onErrorUpload && onErrorUpload(formatMessage({defaultMessage:'Bạn chỉ có thể tải lên tối đa 12 ảnh'}))
          reject()
          return
        }

        let resSize = await loadSizeImage(file)
        console.log('resSize', resSize)
        let ratio = resSize.width / resSize.height
        if (resSize.width < 700 || resSize.height < 32 || resSize.size > 2 * 1024 * 1024 || ratio < 0.5 || ratio > 32) {

          !!onErrorUpload && onErrorUpload("-1")
          reject(formatMessage({defaultMessage:'Size không đúng định dạng'}))
          return
        }

        let formData = new FormData();
        formData.append('type', 'file')
        formData.append('file', file, file.name || 'file.jpg')
        let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData)
        if (res.data.success) {
          resolve({ data: { link: res.data.data.source } });
        } else {
          !!onErrorUpload && onErrorUpload("-1")
          reject(formatMessage({defaultMessage:'Gặp lỗi trong quá trình tải lên'}))
        }

      }
    );
  }, [])

  const [count, imgCount] = useMemo(() => {
    let _count = 0;
    let _imageCount = 0
    try {
      let { blocks } = convertToRaw(field.value.getCurrentContent());
      _count = blocks.reduce(
        (previousValue, currentValue) => {
          if (currentValue.entityRanges.length > 0) {
            _imageCount++;
            return previousValue
          }
          return previousValue + currentValue.text.length
        },
        0
      )
    } catch (error) {
    }

    _imageCountRef.current = _imageCount;

    setFieldValue(field.name + '_count', _count, true)
    setFieldValue(field.name + '_img_count', _imageCount, true)
    return [_count, _imageCount]
  }, [field.value, field.name])

  return (
    <div className="form-group row " style={{ position: 'relative' }} >
      {label && <label className={`${cols[0]} col-form-label`}>{label}{!!required && <span className='text-danger' > *</span>}</label>}
      <div className={`${cols[1]}`}>
        <div className='w-100 ' style={{ position: 'relative' }}>
          <Editor
            editorState={field.value}
            toolbarClassName="toolbarClassName"
            wrapperClassName="wrapperClassName"
            editorClassName={`editorClassName ${((submitCount != _refSubmitCount.current || touched[field.name + '_count']) && errors[field.name + '_count']) || values[`${field.name}_error`] ? 'border-error' : ''}`}
            toolbar={{
              options: ['image'],
              image: {
                uploadCallback: _uploadImageCallBack,
                previewImage: true,
                inputAccept: 'image/jpeg,image/jpg,image/png',
                defaultSize: {
                  height: 'auto',
                  width: '100%',
                },
              },
            }}
            handlePastedText={(text, html) => {
              // if they try to paste something they shouldn't let's handle it
              if (!!text && text.length > 0 && !html) {

                // we'll add a message for the offending user to the editor state
                // let content = EditorState.createEmpty()
                // text.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '<br />').split("<br />").map(__ => {})
                try {
                  const newContent = Modifier.insertText(
                    field.value.getCurrentContent(),
                    field.value.getSelection(),
                    text.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, `
  `)
                  );

                  // update our state with the new editor content
                  setFieldValue(`${field.name}_error`, false)
                  setFieldValue('__changed__', true)
                  setFieldValue(field.name, EditorState.push(
                    field.value,
                    newContent,
                    'insert-characters'
                  ), true)
                } catch (error) {
                  let content = EditorState.createEmpty()
                  const newContent = Modifier.insertText(
                    content.getCurrentContent(),
                    content.getSelection(),
                    text.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, `
  `)
                  );

                  // update our state with the new editor content
                  setFieldValue(`${field.name}_error`, false)
                  setFieldValue('__changed__', true)
                  setFieldValue(field.name, EditorState.push(
                    content,
                    newContent,
                    'insert-characters'
                  ), true)
                }
                return true;
              } else {
                if (!!html) {
                  try {
                    const blockMap = stateFromHTML(html).blockMap;
                    const newContent = Modifier.replaceWithFragment(
                      field.value.getCurrentContent(),
                      field.value.getSelection(),
                      blockMap,
                    );
                    setFieldValue(`${field.name}_error`, false)
                    setFieldValue('__changed__', true)
                    setFieldValue(field.name, EditorState.push(
                      field.value,
                      newContent,
                      'insert-characters'
                    ), true)
                  } catch (error) {
                    let content = EditorState.createEmpty()
                    const blockMap = stateFromHTML(html).blockMap;
                    const newContent = Modifier.replaceWithFragment(
                      field.value.getCurrentContent(),
                      field.value.getSelection(),
                      blockMap,
                    );

                    // update our state with the new editor content
                    setFieldValue(`${field.name}_error`, false)
                    setFieldValue('__changed__', true)
                    setFieldValue(field.name, EditorState.push(
                      content,
                      newContent,
                      'insert-characters'
                    ), true)
                  }
                  return true;
                }
              }
              return false;
            }}
            placeholder={props.placeholder}
            onEditorStateChange={(editorState) => {              
              // setEditorState(editorState)
              setFieldValue(`${field.name}_error`, false)
              setFieldValue('__changed__', true)
              setFieldValue(field.name, editorState, true)
            }}
            onBlur={(e) => {
              setFieldTouched(field.name, true)
            }}
          />
          {
            (!!countChar || !!allowCopy) && <p>
              {
                countChar && <span className="" style={{ position: 'absolute', right: allowCopy ? 40 : 0, bottom: -22, color: 'rgba(0,0,0, 0.45)' }} >{`${count}/${maxChar}`}</span>
              } {
                // <CopyToClipboard text={draftToHtml(convertToRaw(field.value.getCurrentContent()))}
                //   onCopy={() => {
                //     addToast('Đã sao chép vào bộ nhớ', { appearance: 'success' });
                //   }}>
                //   <img src={toAbsoluteUrl(
                //     "/media/ic_copy.svg"
                //   )} style={{ position: 'absolute', right: 0, bottom: -24, color: 'rgba(0,0,0, 0.45)', cursor: 'pointer' }}
                //     onClick={e => {
                //       e.preventDefault()
                //     }}
                //   />
                // </CopyToClipboard>
              }
            </p>
          }
        </div>
        {withFeedbackLabel && (
          <FieldFeedbackLabel
            error={errors[field.name + '_count']}
            touched={submitCount != _refSubmitCount.current || touched[field.name + '_count']}
            label={label}
            type={type}
            customFeedbackLabel={customFeedbackLabel}
          />
        )}
      </div>
    </div >
  );
}
