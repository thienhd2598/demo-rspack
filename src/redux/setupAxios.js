import { auth } from "../firebase";

export default function setupAxios(axios, store) {    
  axios.interceptors.request.use(
    async config => {      
      if (config?.isSubUser) {
        config.headers.Authorization = `Bearer ${localStorage.getItem('jwt')}`;
      } else {
        let jwt = await auth.currentUser.getIdToken(true)
        if (jwt) {
          config.headers.Authorization = `Bearer ${jwt}`;
        }
      }

      return config;
    },
    err => Promise.reject(err)
  );
}
