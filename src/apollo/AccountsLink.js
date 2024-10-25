import { setContext } from '@apollo/client/link/context';
import { auth } from '../firebase';

const LANG_DEFAULT = ["vi", "vi-VN", "en", "en-US"];

const getBrowserLang = () => {
  if (navigator?.language?.startsWith('en')) {
    return "en";
  } else if (navigator?.language?.startsWith('vi')) {
    return "vi";
  } else {
    if (!!navigator?.language && LANG_DEFAULT.some(_lang => navigator?.language === _lang)) {
      return navigator?.language;
    } else {
      return "vi"
    }
  }
};

const isTokenExpired = (jwtToken) => {
  if (jwtToken) {
    const payloadToken = jwtToken.split('.')[1];
    const { exp } = JSON.parse(window.atob(payloadToken));    
  
    const isExpired = Date.now() - 60 * 1000 >= exp * 1000;
  
    return isExpired    
  } else {
    return false
  }
}

export const accountHeaders = async (prevHeaders = {}) => {
  let jwt = localStorage.getItem('jwt');
  const lang = !!localStorage.getItem("i18nConfig")
    ? JSON.parse(localStorage.getItem("i18nConfig"))?.selectedLang
    : getBrowserLang()

  // if (isTokenExpired(jwt)) {    
  //   let newToken = await auth.currentUser.getIdToken(true);
  //   console.log(`NEW TOKEN: `, newToken)
  //   if (!!newToken) {
  //     jwt = newToken;
  //     localStorage.setItem('jwt', newToken);
  //   } else {
  //     window.localStorage.removeItem('jwt')
  //   }
  // }

  return {
    headers: {
      ...prevHeaders,
      "x-hasura-language": lang,
      ...(!!jwt
        ? { authorization: `Bearer ${jwt}` }        
        : {}),
    },
  };
};

export const asyncAuthLink = setContext(
  async (_, { headers }) => await accountHeaders(headers),
);
