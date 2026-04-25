const prisma = require('../config/db');

async function getArticles(req, res, next) {
    try {
        const { category, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where = { isApproved: true };
        if (category) where.category = category;

        const [articles, total] = await prisma.$transaction([
            prisma.article.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                select: { id: true, title: true, category: true, content: true, imageUrl: true, createdAt: true },
            }),
            prisma.article.count({ where }),
        ]);

        return res.json({ success: true, total, page: Number(page), data: articles });
    } catch (err) {
        next(err);
    }
}

async function getBookmarks(req, res, next) {
    try {
        const bookmarks = await prisma.bookmark.findMany({
            where: { userId: req.user.id },
            include: {
                article: {
                    select: { id: true, title: true, category: true, imageUrl: true, createdAt: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ success: true, data: bookmarks.map(b => b.article) });
    } catch (err) {
        next(err);
    }
}

async function getArticleById(req, res, next) {
    try {
        const article = await prisma.article.findFirst({
            where: { id: req.params.id, isApproved: true },
        });
        if (!article) return res.status(404).json({ success: false, message: 'Article not found.' });
        return res.json({ success: true, data: article });
    } catch (err) {
        next(err);
    }
}

async function createArticle(req, res, next) {
    try {
        const { title, category, content, imageUrl, sourceCitation, isApproved, reviewedBy } = req.body;
        if (!title || !category || !content) {
            return res.status(400).json({ success: false, message: 'title, category, and content are required.' });
        }

        const article = await prisma.article.create({
            data: { title, category, content, imageUrl, sourceCitation, isApproved: isApproved ?? false, reviewedBy },
        });
        return res.status(201).json({ success: true, data: article });
    } catch (err) {
        next(err);
    }
}

async function updateArticle(req, res, next) {
    try {
        const { title, category, content, imageUrl, sourceCitation, isApproved, reviewedBy } = req.body;
        const article = await prisma.article.update({
            where: { id: req.params.id },
            data: { title, category, content, imageUrl, sourceCitation, isApproved, reviewedBy },
        });
        return res.json({ success: true, data: article });
    } catch (err) {
        next(err);
    }
}

async function deleteArticle(req, res, next) {
    try {
        await prisma.article.delete({ where: { id: req.params.id } });
        return res.json({ success: true, message: 'Article deleted.' });
    } catch (err) {
        next(err);
    }
}

async function toggleBookmark(req, res, next) {
    try {
        const existing = await prisma.bookmark.findFirst({
            where: { userId: req.user.id, articleId: req.params.id },
        });

        if (existing) {
            await prisma.bookmark.delete({ where: { id: existing.id } });
            return res.json({ success: true, bookmarked: false, message: 'Bookmark removed.' });
        }

        const article = await prisma.article.findUnique({ where: { id: req.params.id } });
        if (!article) return res.status(404).json({ success: false, message: 'Article not found.' });

        await prisma.bookmark.create({ data: { userId: req.user.id, articleId: req.params.id } });
        return res.json({ success: true, bookmarked: true, message: 'Article bookmarked.' });
    } catch (err) {
        next(err);
    }
}

module.exports = { getArticles, getBookmarks, getArticleById, createArticle, updateArticle, deleteArticle, toggleBookmark };
