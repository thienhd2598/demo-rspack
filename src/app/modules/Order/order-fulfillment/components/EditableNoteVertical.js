import clsx from 'clsx';
import React, { memo, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button, ButtonToolbar, Overlay, OverlayTrigger, Popover } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import * as Yup from "yup";

const EditableNoteVertical = ({
    text,
    onConfirm,
    id
}) => {
    const { formatMessage } = useIntl();
    const [show, setShow] = useState(false);
    const [note, setNote] = useState(text || '');
    const [error, setError] = useState(null);
    const target = useRef(null);

    const yupSchema = Yup.object().shape({
        smeNote: Yup.string()
            .max(255, formatMessage({ defaultMessage: "Ghi chú tối đa 255 ký tự." }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Ghi chú không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return true;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Ghi chú không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return true;
                },
            ).nullable(),
    });

    const resetValue = useCallback(() => {
        setNote(text);
        setError(null);
        setShow(prev => !prev);
    }, [text]);

    return (
        <div className="d-flex justify-content-start align-items-center w-100">
            <span style={{ wordBreak: 'break-all' }}>
                {text || '--'}
            </span>
            <ButtonToolbar>
                <i
                    ref={target}
                    role="button"
                    className="ml-2 text-dark far fa-edit"
                    onClick={resetValue}
                />
                <Overlay
                    rootClose
                    onHide={resetValue}
                    show={show}
                    target={target.current}
                    placement="right"
                >
                    <Popover>
                        <Popover.Title className="p-3" as="h6">{formatMessage({ defaultMessage: "Cập nhật ghi chú" })}
                        </Popover.Title>
                        <Popover.Content>
                            <div className="d-flex justify-content-between flex-column">
                                <div className='mr-2 d-flex flex-column'>
                                    <textarea
                                        type="text"
                                        rows={4}
                                        style={{ width: 242 }}
                                        maxLength={255}
                                        className={clsx(`form-control`, { ['border border-danger']: !!error })}
                                        value={note}
                                        onBlur={() => {
                                            yupSchema.validate({
                                                smeNote: note
                                            }).then(value => {
                                                setError(null);
                                            }).catch(error => {
                                                setError(error?.message);
                                            })
                                        }}
                                        onChange={(event) => {
                                            const newValue = event.target.value;

                                            setError(null);
                                            setNote(newValue)
                                        }}
                                    />
                                    <span className="text-right mt-1" style={{ color: 'rgba(0,0,0, 0.45)' }} >{`${note?.length || 0}/${255}`}</span>
                                </div>
                                {!!error && (
                                    <span className='text-danger d-block'>{error}</span>
                                )}
                                <div className='d-flex align-items-center justify-content-end mt-4'>
                                    <Button
                                        variant="secondary"
                                        style={{ height: 30, minWidth: 100 }}
                                        onClick={resetValue}
                                        size="xl"
                                        className="d-flex justify-content-center align-items-center">
                                        {formatMessage({ defaultMessage: 'Hủy' })}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="xl"
                                        style={{ height: 30, minWidth: 100 }}
                                        onClick={() => {
                                            yupSchema.validate({
                                                smeNote: note
                                            }).then(value => {
                                                !!onConfirm && onConfirm({ note, id }, () => resetValue())
                                            }).catch(error => {
                                                setError(error?.message);
                                            })
                                        }}
                                        className="ml-2 d-flex justify-content-center align-items-center">
                                        {formatMessage({ defaultMessage: 'Xác nhận' })}
                                    </Button>
                                </div>
                            </div>
                        </Popover.Content>
                    </Popover>
                </Overlay>
            </ButtonToolbar>
        </div>
    )
};

export default memo(EditableNoteVertical);