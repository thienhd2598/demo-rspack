import client from "../apollo";
import query_userGetCustomTokenFirebase from "../graphql/query_userGetCustomTokenFirebase";

const getCustomToken = async (cb) => {
    try {
        const { data } = await client.query({
            query: query_userGetCustomTokenFirebase
        });
    
        cb(data?.userGetCustomTokenFirebase?.data || null);
    } catch (error) {
        cb(null);
    }
};

export default getCustomToken;