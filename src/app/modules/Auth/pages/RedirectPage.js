import { useMutation, useQuery } from '@apollo/client';
import { createApolloClientSSR } from "../../../../apollo";
import mutateAuthSSO from '../../../../graphql/authen-sso'
import React, { useEffect, useMemo } from 'react';
import { useDispatch, connect } from 'react-redux';
import { useLocation, useHistory } from 'react-router-dom';
import { auth } from '../../../../firebase';
import LoadingDialog from '../../FrameImage/LoadingDialog';
import query_user from '../../../../graphql/user-me'
import queryString from 'querystring'
import { getUserByToken } from "../_redux/authCrud";
import { actions } from "../_redux/authRedux";


let client = createApolloClientSSR()

const RedirectPage = (props) => {
    const history = useHistory()
    const dispatch = useDispatch();
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000))

    useMemo(async () => {
        try {
            localStorage.setItem('accessToken', params?.token);
            localStorage.setItem('jwt', params?.token);
            localStorage.setItem('fromAgency', true);

            const userMe = await getUserByToken();                   
            dispatch(props.setUser({}));
            dispatch(props.setUser(userMe));
            history.push('/');
        } catch (error) {
            console.log(error)
        }
    }, [params]);

    return (
        <>
            <LoadingDialog />
        </>
    )
};

export default connect(null, actions)(RedirectPage)