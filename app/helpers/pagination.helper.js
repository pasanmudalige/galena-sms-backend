// pagination helper
exports.extractPageDetails = (count, limit, page) => {
    const totalPages = Math.ceil(count / limit);
    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;
    return { totalPages, nextPage, prevPage };
}

exports.extractPaginationParams = (req) => {
    const orderBy = req.query.orderBy;
    const order = req.query.order;
    const limit = parseInt(req.query.limit) || 5;
    const page = parseInt(req.query.page);
    const offset = (page - 1) * limit;
    return { offset, limit, orderBy, order, page };
}



