/*
 * Created by duydatpham@gmail.com on 01/09/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { useHistory } from "react-router";

export function RouterPrompt(props) {
    const { when, forkWhen, onOK, onCancel, title, okText, cancelText } = props;

    const history = useHistory();

    const [showPrompt, setShowPrompt] = useState(false);
    const [currentPath, setCurrentPath] = useState("");
    const _refLastPath = useRef(history.location.pathname)

    useEffect(() => {
        if (when || forkWhen) {
            history.block((prompt) => {
                let newpath = prompt.pathname + (prompt.search || '');
                setCurrentPath(newpath);
                if (_refLastPath.current != prompt.pathname || forkWhen) {
                    setShowPrompt(true);
                } else {
                    _refLastPath.current = prompt.pathname
                    return undefined;
                }

                return "true";
            });
        } else {
            history.block(() => { });
        }

        return () => {
            history.block(() => { });
        };
    }, [history, when, forkWhen]);

    const handleOK = useCallback(async () => {
        if (onOK) {
            setShowPrompt(false);
            const canRoute = await Promise.resolve(onOK());
            if (canRoute) {
                history.block(() => { });
                history.push(currentPath);
            }
        }
    }, [currentPath, history, onOK]);

    const handleCancel = useCallback(async () => {
        if (onCancel) {
            const canRoute = await Promise.resolve(onCancel());
            if (canRoute) {
                history.block(() => { });
                history.push(currentPath);
            }
        }
        setShowPrompt(false);
    }, [currentPath, history, onCancel]);

    return showPrompt ? (
        <Modal
            show={showPrompt}
            aria-labelledby="example-modal-sizes-title-lg"
            centered
            backdrop={'static'}
        >
            <Modal.Body className="overlay overlay-block cursor-default text-center">
                <div className="mb-4" >{title}</div>

                <div className="form-group mb-0">
                    <button
                        type="button"
                        className="btn btn-light btn-elevate mr-3"
                        style={{ minWidth: 100 }}
                        onClick={handleCancel}
                    >
                        <span className="font-weight-boldest">{cancelText}</span>
                    </button>
                    <button
                        type="button"
                        className={`btn btn-primary font-weight-bold`}
                        style={{ minWidth: 100 }}
                        onClick={handleOK}
                    >
                        <span className="font-weight-boldest">{okText}</span>
                    </button>
                </div>
            </Modal.Body>
        </Modal >
    ) : null;
}