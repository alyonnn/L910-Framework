const parseUrl = (baseUrl) => (url) => {
    const fullUrl = new URL(url, baseUrl);
    const params = {};
    fullUrl.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return {
        pathname: fullUrl.pathname,
        query: params
    };
};

module.exports = { parseUrl };