import {
    ApolloClient,
    HttpLink,
    from,
    split,
    InMemoryCache,
    fromPromise,
    ApolloLink,
} from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { RetryLink } from "@apollo/client/link/retry";
import { WebSocketLink } from "@apollo/client/link/ws";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { auth } from '../firebase'
import { asyncAuthLink, accountHeaders } from "./AccountsLink";
// import { useToasts } from 'react-toast-notifications';
import { onError } from "@apollo/client/link/error";
import ws from "ws";
import mutate_subUserRefreshToken from "../graphql/mutate_subUserRefreshToken";


const { REACT_APP_GRAPHQL_ENDPOINT, REACT_APP_GRAPHQL_WS_ENDPOINT } = process.env || {}
console.log({ env: process.env })

const retryLink = new RetryLink();

const httpLink = new HttpLink({
    uri: REACT_APP_GRAPHQL_ENDPOINT,
    credentials: "same-origin",
});

const subscriptionClient = new SubscriptionClient(
    REACT_APP_GRAPHQL_WS_ENDPOINT,
    {
        reconnect: true,
        lazy: true,
        connectionParams: accountHeaders,
    }, ws,
);

const wsLink = new WebSocketLink(subscriptionClient);


const permissionLink = new ApolloLink((operation, forward) => {
    return forward(operation)
});

const link = from([
    asyncAuthLink,
    retryLink,
    permissionLink,
    split(
        ({ query }) => {
            const definition = getMainDefinition(query);
            return (
                definition.kind === "OperationDefinition" &&
                definition.operation === "subscription"
            );
        },
        wsLink,
        httpLink,
    ),
]);

const link_ssr = from([
    retryLink,
    split(
        ({ query }) => {
            const definition = getMainDefinition(query);
            return (
                definition.kind === "OperationDefinition" &&
                definition.operation === "subscription"
            );
        },
        wsLink,
        httpLink,
    ),
]);

const cache = new InMemoryCache({
    typePolicies: {
        // address: { keyFields: ['id'] },
        // users: { keyFields: ['id'] },
    },
});

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
    // console.log('graphQLErrors, networkError',graphQLErrors, networkError)
    if (graphQLErrors) {
        for (let err of graphQLErrors) {
            console.log(
                `[GraphQL error]: Message: ${err.message}`,
                err
            );
            if (err.message == 'Authentication hook unauthorized this request') {
                return fromPromise(
                    new Promise(async (resolve) => {
                        let cout = 0;
                        let _interval = setInterval(async () => {
                            const refreshToken = localStorage.getItem('refresh_token');

                            if (!!refreshToken) {
                                window.localStorage.removeItem('jwt');
                                clearInterval(_interval);

                                try {
                                    const { data } = await client.mutate({
                                        mutation: mutate_subUserRefreshToken,
                                        variables: {
                                            token: refreshToken
                                        }
                                    });

                                    if (!!data?.subUserRefreshToken?.success) {
                                        localStorage.setItem('refresh_token', data?.subUserRefreshToken?.refreshToken);
                                        resolve(data?.subUserRefreshToken?.accessToken)
                                    } else {
                                        resolve(null)
                                    }
                                } catch (error) {
                                    resolve(null)
                                }
                            }

                            if (!refreshToken && !!auth.currentUser) {
                                clearInterval(_interval)
                                try {
                                    let token = await auth.currentUser.getIdToken(true)
                                    resolve(token)
                                } catch (error) {
                                    resolve(null)
                                }
                            }

                            cout++;
                            if (cout >= 5) {
                                clearInterval(_interval)
                                resolve(null)
                            }
                        }, 1000);

                    })
                        .then(token => {
                            if (!!token) {
                                localStorage.setItem('jwt', token)
                                return token
                            }
                            window.localStorage.removeItem('jwt')
                            return null;
                        })
                        .catch(e => {
                            window.localStorage.removeItem('jwt')
                            return null
                        })
                )
                    .filter(value => {
                        console.log('value', value)
                        return !!value
                    })
                    .flatMap(() => {
                        console.log('forward')
                        // retry the request, returning the new observable
                        return forward(operation);
                    })
            }
        };
    }
});


const client = new ApolloClient({
    link: errorLink.concat(link),
    cache,
    defaultOptions: { mutate: { errorPolicy: "all" } },
    // name: "device",
    // version: "1.0.0",
    // connectToDevTools: false,
});


// client.onClearStore(async () => {
//     console.log("onClearStore");
//     await persistor.purge();
// });

export function createApolloClientSSR() {
    return new ApolloClient({
        link: errorLink.concat(link),
        cache,
    });
}

export default client;
