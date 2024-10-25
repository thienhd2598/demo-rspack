import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import * as Yup from "yup";

const RolesContext = createContext();

export function useRolesContext() {
    return useContext(RolesContext);
};

export function RolesProvider({ children }) {
    const [initialValues, setInitialValues] = useState({});
    const { formatMessage } = useIntl();

    const validateSchema = useMemo(() => {
        const schema = {
            name: Yup.string()
                .nullable()
                .max(120, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 120, name: formatMessage({ defaultMessage: "Tên nhóm quyền" }) }))
                .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên nhóm quyền" }).toLowerCase() }))
                .test(
                    'chua-ky-tu-space-o-dau-cuoi',
                    formatMessage({ defaultMessage: 'Tên nhóm quyền không được chứa dấu cách ở đầu và cuối' }),
                    (value, context) => {
                        if (!!value) {
                            return value.length == value.trim().length;
                        }
                        return false;
                    },
                )
                .test(
                    'chua-ky-tu-2space',
                    formatMessage({ defaultMessage: 'Tên nhóm quyền không được chứa 2 dấu cách liên tiếp' }),
                    (value, context) => {
                        if (!!value) {
                            return !(/\s\s+/g.test(value))
                        }
                        return false;
                    },
                ).when(`role_name_boolean`, {
                    is: values => {
                      return !!values && !!values[`name`];
                    },
                    then: Yup.string().oneOf([`name`], formatMessage({ defaultMessage: 'Tên nhóm quyền đã tồn tại' }))
                  }),
            description: Yup.string()
                .nullable()
                .max(550, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 550, name: formatMessage({ defaultMessage: "Mô tả" }) }))
                .test(
                    'chua-ky-tu-space-o-dau-cuoi',
                    formatMessage({ defaultMessage: 'Mô tả không được chứa dấu cách ở đầu và cuối' }),
                    (value, context) => {
                        if (!!value) {
                            return value.length == value.trim().length;
                        }
                        return true;
                    },
                )
                .test(
                    'chua-ky-tu-2space',
                    formatMessage({ defaultMessage: 'Mô tả không được chứa 2 dấu cách liên tiếp' }),
                    (value, context) => {
                        if (!!value) {
                            return !(/\s\s+/g.test(value))
                        }
                        return true;
                    },
                )
        };

        return Yup.object().shape(schema)
    }, []);

    const values = useMemo(() => {
        return {
            initialValues, validateSchema, setInitialValues
        }
    }, [initialValues, validateSchema]);

    return (
        <RolesContext.Provider value={values}>
            {children}
        </RolesContext.Provider>
    )
}