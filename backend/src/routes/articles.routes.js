const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
    getArticles,
    getBookmarks,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    toggleBookmark,
} = require('../controllers/articles.controller');

const router = Router();

router.get('/', authenticate, getArticles);
router.get('/bookmarks', authenticate, getBookmarks);
router.get('/:id', authenticate, getArticleById);

router.post('/:id/bookmark', authenticate, toggleBookmark);

router.post('/', authenticate, authorize('admin'), createArticle);
router.put('/:id', authenticate, authorize('admin'), updateArticle);
router.delete('/:id', authenticate, authorize('admin'), deleteArticle);

module.exports = router;
