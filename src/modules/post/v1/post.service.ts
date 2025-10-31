import { Op, Transaction, UniqueConstraintError } from 'sequelize';
import { StatusCodes } from 'http-status-codes';
import { sequelize } from '../../../database/db-config.js';
import { HttpResponseError } from '../../../utils/appError.js';
import { Roles } from '../../../constants/roles.js';
import { UserEntity } from '../../user/v1/entity/user.entity.js';
import { MediaEntity } from '../../media/v1/model/media.model.js';
import { PostEntity } from './entity/post.entity.js';
import { PostMediaEntity } from './entity/post-media.entity.js';
import { PostLikeEntity } from './entity/post-like.entity.js';
import { PostViewEntity } from './entity/post-view.entity.js';
import { PostReportEntity } from './entity/post-report.entity.js';
import { PostSaveEntity } from './entity/post-save.entity.js';
import { PostCommentEntity } from './entity/post-comment.entity.js';
import { PostCommentLikeEntity } from './entity/post-comment-like.entity.js';
import { PostCommentReportEntity } from './entity/post-comment-report.entity.js';
import './entity/associate-models.js';

interface PaginationOptions {
    page?: number;
    limit?: number;
}

interface CreatePostPayload {
    text?: string | null;
    mediaIds?: string[];
}

interface UpdatePostPayload extends CreatePostPayload { }

interface PaginatedResponse<T> {
    items: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface ToggleResult<T> {
    state: T;
    post: any;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const POST_BASE_INCLUDE: any[] = [
    {
        model: UserEntity,
        as: 'author',
        include: [
            {
                model: MediaEntity,
                as: 'image',
            },
        ],
    },
    {
        model: MediaEntity,
        as: 'media',
        through: { attributes: ['sortOrder'] },
    },
];

const COMMENT_AUTHOR_INCLUDE = {
    model: UserEntity,
    as: 'author',
    include: [
        {
            model: MediaEntity,
            as: 'image',
        },
    ],
};

export class PostService {
    static async createPost(currentUser: UserEntity, payload: CreatePostPayload) {
        const trimmedText = payload.text?.trim() ?? null;
        const mediaIds = sanitizeMediaIds(payload.mediaIds);

        if (mediaIds.length) {
            await assertAllMediaExist(mediaIds);
        }

        const transaction = await sequelize.transaction();
        try {
            const post = await PostEntity.create(
                {
                    userId: currentUser.id,
                    text: trimmedText,
                },
                { transaction }
            );

            if (mediaIds.length) {
                const postMediaPayload = mediaIds.map((mediaId, index) => ({
                    postId: post.id,
                    mediaId,
                    sortOrder: index,
                }));
                await PostMediaEntity.bulkCreate(postMediaPayload, { transaction });
            }

            await transaction.commit();
            return this.getPostWithMeta(post.id, currentUser.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async getMyPosts(currentUser: UserEntity, options: PaginationOptions = {}) {
        return this.getPostsByUser(currentUser.id, currentUser, options, currentUser);
    }

    static async getPostsByUser(
        userId: string,
        currentUser: UserEntity,
        options: PaginationOptions = {},
        cachedUser?: UserEntity
    ) {
        const { page, limit, offset } = normalizePagination(options);
        const user = cachedUser ?? (await getUserProfileById(userId));

        const { rows, count } = await PostEntity.findAndCountAll({
            where: { userId },
            include: POST_BASE_INCLUDE,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        });

        const postIds = rows.map((post) => post.id);
        const likedIds = await getLikedPostIds(currentUser.id, postIds);
        const savedIds = await getSavedPostIds(currentUser.id, postIds);

        const items = rows.map((post) => formatPost(post, currentUser.id, likedIds, savedIds));

        return {
            user: user.get({ plain: true }),
            posts: buildPaginatedResponse(items, count, page, limit),
        };
    }

    static async getFeed(currentUser: UserEntity, options: PaginationOptions = {}) {
        const { page, limit } = normalizePagination(options);
        const seenEntries = await PostViewEntity.findAll({
            where: { userId: currentUser.id },
            attributes: ['postId'],
        });
        const seenPostIds = new Set<string>(seenEntries.map((entry) => entry.postId));

        const unseenPosts = await PostEntity.findAll({
            where: seenPostIds.size
                ? { id: { [Op.notIn]: Array.from(seenPostIds) } }
                : {},
            include: POST_BASE_INCLUDE,
            order: sequelize.random(),
            limit,
        });

        const posts: PostEntity[] = [...unseenPosts];
        if (posts.length < limit && seenPostIds.size) {
            const remaining = limit - posts.length;
            const seenPosts = await PostEntity.findAll({
                where: { id: { [Op.in]: Array.from(seenPostIds) } },
                include: POST_BASE_INCLUDE,
                order: sequelize.random(),
                limit: remaining,
            });
            posts.push(...seenPosts);
        }

        const postIds = posts.map((post) => post.id);
        const likedIds = await getLikedPostIds(currentUser.id, postIds);
        const savedIds = await getSavedPostIds(currentUser.id, postIds);
        const items = posts.map((post) => formatPost(post, currentUser.id, likedIds, savedIds));

        await markPostsAsViewed(currentUser.id, postIds);

        const total = await PostEntity.count();
        return buildPaginatedResponse(items, total, page, limit);
    }

    static async updatePost(postId: string, currentUser: UserEntity, payload: UpdatePostPayload) {
        const post = await PostEntity.findByPk(postId);
        if (!post) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Post not found');
        }

        if (!canManagePost(post, currentUser)) {
            throw new HttpResponseError(StatusCodes.FORBIDDEN, 'You are not allowed to update this post');
        }

        const trimmedText = payload.text?.trim() ?? null;
        const mediaIds = sanitizeMediaIds(payload.mediaIds);

        if (mediaIds.length) {
            await assertAllMediaExist(mediaIds);
        }

        const transaction = await sequelize.transaction();
        try {
            await post.update({ text: trimmedText }, { transaction });

            if (payload.mediaIds) {
                await PostMediaEntity.destroy({ where: { postId: post.id }, transaction });
                if (mediaIds.length) {
                    const postMediaPayload = mediaIds.map((mediaId, index) => ({
                        postId: post.id,
                        mediaId,
                        sortOrder: index,
                    }));
                    await PostMediaEntity.bulkCreate(postMediaPayload, { transaction });
                }
            }

            await transaction.commit();
            return this.getPostWithMeta(post.id, currentUser.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async deletePost(postId: string, currentUser: UserEntity) {
        const post = await PostEntity.findByPk(postId);
        if (!post) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Post not found');
        }

        if (!canManagePost(post, currentUser)) {
            throw new HttpResponseError(StatusCodes.FORBIDDEN, 'You are not allowed to delete this post');
        }

        const transaction = await sequelize.transaction();
        try {
            await PostCommentEntity.destroy({ where: { postId }, transaction });
            await PostLikeEntity.destroy({ where: { postId }, transaction });
            await PostSaveEntity.destroy({ where: { postId }, transaction });
            await PostReportEntity.destroy({ where: { postId }, transaction });
            await PostViewEntity.destroy({ where: { postId }, transaction });
            await PostMediaEntity.destroy({ where: { postId }, transaction });
            await post.destroy({ transaction });

            await transaction.commit();
            return { deleted: true, postId };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async reportPost(postId: string, currentUser: UserEntity, reason?: string | null) {
        await ensurePostExists(postId);
        try {
            const report = await PostReportEntity.create({
                postId,
                userId: currentUser.id,
                reason: reason?.trim() || null,
            });

            return report.get({ plain: true });
        } catch (error) {
            if (error instanceof UniqueConstraintError) {
                throw new HttpResponseError(StatusCodes.CONFLICT, 'You already reported this post');
            }
            throw error;
        }
    }

    static async toggleLike(postId: string, currentUser: UserEntity): Promise<ToggleResult<boolean>> {
        await ensurePostExists(postId);
        const transaction = await sequelize.transaction();
        try {
            const existing = await PostLikeEntity.findOne({
                where: { postId, userId: currentUser.id },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            let isLiked = true;
            if (existing) {
                await existing.destroy({ transaction });
                await PostEntity.decrement('likesCount', { by: 1, where: { id: postId }, transaction });
                isLiked = false;
            } else {
                await PostLikeEntity.create({ postId, userId: currentUser.id }, { transaction });
                await PostEntity.increment('likesCount', { by: 1, where: { id: postId }, transaction });
            }

            await transaction.commit();
            const post = await this.getPostWithMeta(postId, currentUser.id);
            return { state: isLiked, post };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async getPostLikes(postId: string, currentUser: UserEntity, options: PaginationOptions = {}) {
        await ensurePostExists(postId);
        const { page, limit, offset } = normalizePagination(options);

        const { rows, count } = await PostLikeEntity.findAndCountAll({
            where: { postId },
            include: [
                {
                    model: UserEntity,
                    as: 'user',
                    include: [
                        {
                            model: MediaEntity,
                            as: 'image',
                        },
                    ],
                },
            ],
            order: [['createdAt', 'DESC']],
            offset,
            limit,
        });

        const items = rows.map((like) => like.get({ plain: true }));
        return buildPaginatedResponse(items, count, page, limit);
    }

    static async toggleSave(postId: string, currentUser: UserEntity): Promise<ToggleResult<boolean>> {
        await ensurePostExists(postId);
        const transaction = await sequelize.transaction();
        try {
            const existing = await PostSaveEntity.findOne({
                where: { postId, userId: currentUser.id },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            let isSaved = true;
            if (existing) {
                await existing.destroy({ transaction });
                isSaved = false;
            } else {
                await PostSaveEntity.create({ postId, userId: currentUser.id }, { transaction });
            }

            await transaction.commit();
            const post = await this.getPostWithMeta(postId, currentUser.id);
            return { state: isSaved, post };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async getSavedPosts(currentUser: UserEntity, options: PaginationOptions = {}) {
        const { page, limit, offset } = normalizePagination(options);

        const { rows, count } = await PostSaveEntity.findAndCountAll({
            where: { userId: currentUser.id },
            include: [
                {
                    model: PostEntity,
                    as: 'post',
                    include: POST_BASE_INCLUDE,
                },
            ],
            order: [['createdAt', 'DESC']],
            offset,
            limit,
        });

        const posts = rows.map((row: any) => row.post).filter(Boolean) as PostEntity[];
        const postIds = posts.map((post) => post.id);
        const likedIds = await getLikedPostIds(currentUser.id, postIds);
        const savedIds = new Set(postIds);

        const items = posts.map((post) => formatPost(post, currentUser.id, likedIds, savedIds));
        return buildPaginatedResponse(items, count, page, limit);
    }

    private static async getPostWithMeta(postId: string, viewerId: string) {
        const post = await PostEntity.findByPk(postId, {
            include: POST_BASE_INCLUDE,
        });
        if (!post) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Post not found');
        }

        const likedIds = await getLikedPostIds(viewerId, [postId]);
        const savedIds = await getSavedPostIds(viewerId, [postId]);
        return formatPost(post, viewerId, likedIds, savedIds);
    }
}

export class PostCommentService {
    static async createComment(postId: string, currentUser: UserEntity, content: string) {
        await ensurePostExists(postId);
        const transaction = await sequelize.transaction();
        try {
            const comment = await PostCommentEntity.create({
                postId,
                userId: currentUser.id,
                content: content.trim(),
            }, { transaction });

            await PostEntity.increment('commentsCount', { by: 1, where: { id: postId }, transaction });
            await transaction.commit();

            await comment.reload({ include: [COMMENT_AUTHOR_INCLUDE] });
            comment.setDataValue('replies', []);
            const likedIds = await getLikedCommentIds(currentUser.id, [comment.id]);
            return formatComment(comment, currentUser.id, likedIds);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async createReply(postId: string, commentId: string, currentUser: UserEntity, content: string) {
        await ensurePostExists(postId);
        const parent = await PostCommentEntity.findOne({ where: { id: commentId, postId } });
        if (!parent) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Parent comment not found');
        }

        const transaction = await sequelize.transaction();
        try {
            const reply = await PostCommentEntity.create({
                postId,
                userId: currentUser.id,
                parentId: commentId,
                content: content.trim(),
            }, { transaction });

            await PostEntity.increment('commentsCount', { by: 1, where: { id: postId }, transaction });
            await PostCommentEntity.increment('repliesCount', { by: 1, where: { id: commentId }, transaction });

            await transaction.commit();

            await reply.reload({ include: [COMMENT_AUTHOR_INCLUDE] });
            const likedIds = await getLikedCommentIds(currentUser.id, [reply.id]);
            return formatPlainComment(reply.get({ plain: true }), currentUser.id, likedIds);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async listComments(postId: string, currentUser: UserEntity, options: PaginationOptions = {}) {
        await ensurePostExists(postId);
        const { page, limit, offset } = normalizePagination(options);

        const topLevelWhere = { postId, parentId: null } as const;

        try {
            // 1) Fetch top-level comments and total count concurrently
            const [rows, count] = await Promise.all([
                PostCommentEntity.findAll({
                    where: topLevelWhere,
                    include: [COMMENT_AUTHOR_INCLUDE],
                    order: [['createdAt', 'DESC']],
                    limit,
                    offset,
                }),
                PostCommentEntity.count({ where: topLevelWhere }),
            ]);

            // 2) Fetch replies for these comments in a separate query and attach
            const topIds = rows.map((c) => c.id);
            let allCommentIds: string[] = [...topIds];

            if (topIds.length) {
                const replies = await PostCommentEntity.findAll({
                    where: { parentId: { [Op.in]: topIds } },
                    include: [COMMENT_AUTHOR_INCLUDE],
                    order: [['createdAt', 'DESC']],
                });

                const repliesByParent = replies.reduce<Record<string, PostCommentEntity[]>>((acc, reply) => {
                    const pid = (reply.get('parentId') as string) ?? '';
                    if (!acc[pid]) acc[pid] = [];
                    acc[pid].push(reply);
                    return acc;
                }, {});

                rows.forEach((comment) => {
                    const list = repliesByParent[comment.id] ?? [];
                    comment.setDataValue('replies', list);
                    if (list.length) {
                        allCommentIds.push(...list.map((r) => r.id));
                    }
                });
            } else {
                // Ensure replies is present as empty array for consistency
                rows.forEach((comment) => comment.setDataValue('replies', []));
            }

            // 3) Compute liked flags and format
            const likedIds = await getLikedCommentIds(currentUser.id, allCommentIds);
            const items = rows.map((comment) => formatComment(comment, currentUser.id, likedIds));

            return buildPaginatedResponse(items, count, page, limit);
        } catch (error) {
            console.error('Error fetching comments:', error);
            throw error;
        }
    }

    static async updateComment(commentId: string, currentUser: UserEntity, content: string) {
        const comment = await PostCommentEntity.findByPk(commentId, {
            include: [
                {
                    model: PostEntity,
                    as: 'post',
                    attributes: ['id', 'userId'],
                },
                COMMENT_AUTHOR_INCLUDE,
            ],
        });
        if (!comment) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Comment not found');
        }

        if (!canManageComment(comment, currentUser)) {
            throw new HttpResponseError(StatusCodes.FORBIDDEN, 'You are not allowed to update this comment');
        }

        await comment.update({ content: content.trim() });
        const likedIds = await getLikedCommentIds(currentUser.id, [comment.id]);
        comment.setDataValue('replies', []);
        return formatComment(comment, currentUser.id, likedIds);
    }

    static async deleteComment(commentId: string, currentUser: UserEntity) {
        const comment = await PostCommentEntity.findByPk(commentId, {
            include: [
                {
                    model: PostEntity,
                    as: 'post',
                    attributes: ['id', 'userId'],
                },
            ],
        });
        if (!comment) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Comment not found');
        }

        if (!canManageComment(comment, currentUser, true)) {
            throw new HttpResponseError(StatusCodes.FORBIDDEN, 'You are not allowed to delete this comment');
        }

        const transaction = await sequelize.transaction();
        try {
            let totalRemoved = 1;
            if (!comment.parentId) {
                const repliesCount = await PostCommentEntity.count({ where: { parentId: comment.id }, transaction });
                totalRemoved += repliesCount;
                await PostCommentEntity.destroy({ where: { parentId: comment.id }, transaction });
            } else {
                await PostCommentEntity.decrement('repliesCount', { by: 1, where: { id: comment.parentId }, transaction });
            }

            await PostEntity.decrement('commentsCount', { by: totalRemoved, where: { id: comment.postId }, transaction });
            await comment.destroy({ transaction });

            await transaction.commit();
            return { deleted: true, commentId };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async deleteReply(postId: string, commentId: string, replyId: string, currentUser: UserEntity) {
        // Ensure the reply exists and belongs to the specified post/comment
        const reply = await PostCommentEntity.findOne({
            where: { id: replyId, parentId: commentId, postId },
            include: [
                {
                    model: PostEntity,
                    as: 'post',
                    attributes: ['id', 'userId'],
                },
            ],
        });
        if (!reply) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Reply not found');
        }

        if (!canManageComment(reply, currentUser, true)) {
            throw new HttpResponseError(StatusCodes.FORBIDDEN, 'You are not allowed to delete this reply');
        }

        const transaction = await sequelize.transaction();
        try {
            // Decrement counters: parent's repliesCount and post's commentsCount
            await PostCommentEntity.decrement('repliesCount', { by: 1, where: { id: commentId }, transaction });
            await PostEntity.decrement('commentsCount', { by: 1, where: { id: postId }, transaction });

            await reply.destroy({ transaction });
            await transaction.commit();
            return { deleted: true, commentId: replyId };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async toggleLike(commentId: string, currentUser: UserEntity) {
        await ensureCommentExists(commentId);
        const transaction = await sequelize.transaction();
        try {
            const existing = await PostCommentLikeEntity.findOne({
                where: { commentId, userId: currentUser.id },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            let isLiked = true;
            if (existing) {
                await existing.destroy({ transaction });
                await PostCommentEntity.decrement('likesCount', { by: 1, where: { id: commentId }, transaction });
                isLiked = false;
            } else {
                await PostCommentLikeEntity.create({ commentId, userId: currentUser.id }, { transaction });
                await PostCommentEntity.increment('likesCount', { by: 1, where: { id: commentId }, transaction });
            }

            await transaction.commit();
            const comment = await PostCommentEntity.findByPk(commentId, { include: [COMMENT_AUTHOR_INCLUDE] });
            if (!comment) {
                throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Comment not found');
            }
            comment.setDataValue('replies', []);
            const likedIds = await getLikedCommentIds(currentUser.id, [commentId]);
            return { state: isLiked, comment: formatComment(comment, currentUser.id, likedIds) };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async reportComment(commentId: string, currentUser: UserEntity, reason?: string | null) {
        await ensureCommentExists(commentId);
        try {
            const report = await PostCommentReportEntity.create({
                commentId,
                userId: currentUser.id,
                reason: reason?.trim() || null,
            });
            return report.get({ plain: true });
        } catch (error) {
            if (error instanceof UniqueConstraintError) {
                throw new HttpResponseError(StatusCodes.CONFLICT, 'You already reported this comment');
            }
            throw error;
        }
    }
}

function normalizePagination(options: PaginationOptions = {}) {
    const page = Math.max(Number(options.page) || DEFAULT_PAGE, 1);
    let limit = Number(options.limit) || DEFAULT_LIMIT;
    if (limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

function buildPaginatedResponse<T>(items: T[], total: number, page: number, limit: number): PaginatedResponse<T> {
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
    return { items, total, page, limit, totalPages };
}

async function assertAllMediaExist(mediaIds: string[]) {
    if (!mediaIds.length) return;
    const mediaCount = await MediaEntity.count({ where: { id: { [Op.in]: mediaIds } } });
    if (mediaCount !== mediaIds.length) {
        throw new HttpResponseError(StatusCodes.BAD_REQUEST, 'One or more media items were not found');
    }
}

function sanitizeMediaIds(mediaIds?: string[] | null) {
    if (!Array.isArray(mediaIds)) return [];
    return mediaIds.filter((id) => typeof id === 'string');
}

async function getUserProfileById(userId: string) {
    const user = await UserEntity.findByPk(userId, {
        include: [
            {
                model: MediaEntity,
                as: 'image',
            },
        ],
    });
    if (!user) {
        throw new HttpResponseError(StatusCodes.NOT_FOUND, 'User not found');
    }
    return user;
}

async function ensurePostExists(postId: string) {
    const exists = await PostEntity.count({ where: { id: postId } });
    if (!exists) {
        throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Post not found');
    }
}

async function ensureCommentExists(commentId: string) {
    const exists = await PostCommentEntity.count({ where: { id: commentId } });
    if (!exists) {
        throw new HttpResponseError(StatusCodes.NOT_FOUND, 'Comment not found');
    }
}

function canManagePost(post: PostEntity, currentUser: UserEntity) {
    return post.userId === currentUser.id || currentUser.role === Roles.ADMIN;
}

function canManageComment(comment: PostCommentEntity, currentUser: UserEntity, allowPostOwner = false) {
    if (comment.userId === currentUser.id || currentUser.role === Roles.ADMIN) {
        return true;
    }
    if (allowPostOwner) {
        const post = comment.get('post') as PostEntity | undefined;
        if (post && post.userId === currentUser.id) {
            return true;
        }
    }
    return false;
}

async function getLikedPostIds(userId: string, postIds: string[]) {
    if (!postIds.length) return new Set<string>();
    const likes = await PostLikeEntity.findAll({
        where: {
            userId,
            postId: { [Op.in]: postIds },
        },
        attributes: ['postId'],
    });
    return new Set(likes.map((like) => like.postId));
}

async function getSavedPostIds(userId: string, postIds: string[]) {
    if (!postIds.length) return new Set<string>();
    const saves = await PostSaveEntity.findAll({
        where: {
            userId,
            postId: { [Op.in]: postIds },
        },
        attributes: ['postId'],
    });
    return new Set(saves.map((save) => save.postId));
}

async function markPostsAsViewed(userId: string, postIds: string[]) {
    if (!postIds.length) return;
    const now = new Date();
    await PostViewEntity.bulkCreate(
        postIds.map((postId) => ({
            postId,
            userId,
            lastViewedAt: now,
        })),
        {
            updateOnDuplicate: ['lastViewedAt', 'updatedAt'],
        }
    );
}

function formatPost(post: PostEntity, currentUserId: string, likedIds: Set<string>, savedIds: Set<string>) {
    const plain = post.get({ plain: true }) as any;

    if (Array.isArray(plain.media)) {
        plain.media = plain.media
            .map((media) => {
                const sortOrder = media.PostMedia?.sortOrder ?? 0;
                const { PostMedia, ...rest } = media;
                return { ...rest, sortOrder };
            })
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    plain.isMine = plain.userId === currentUserId;
    plain.isLiked = likedIds.has(plain.id);
    plain.isSaved = savedIds.has(plain.id);
    return plain;
}

async function getLikedCommentIds(userId: string, commentIds: string[]) {
    if (!commentIds.length) return new Set<string>();
    const likes = await PostCommentLikeEntity.findAll({
        where: {
            userId,
            commentId: { [Op.in]: commentIds },
        },
        attributes: ['commentId'],
    });
    return new Set(likes.map((like) => like.commentId));
}

function formatComment(comment: PostCommentEntity, currentUserId: string, likedIds: Set<string>) {
    const plain = comment.get({ plain: true }) as any;
    // Ensure replies are plain objects to avoid circular refs from Sequelize instances
    if (Array.isArray(plain.replies)) {
        plain.replies = plain.replies.map((r: any) => (typeof r?.get === 'function' ? r.get({ plain: true }) : r));
    }
    return formatPlainComment(plain, currentUserId, likedIds);
}

function formatPlainComment(comment: any, currentUserId: string, likedIds: Set<string>) {
    const formatted = { ...comment };
    formatted.isMine = formatted.userId === currentUserId;
    formatted.isLiked = likedIds.has(formatted.id);

    if (Array.isArray(formatted.replies)) {
        formatted.replies = formatted.replies
            .map((reply) => formatPlainComment(reply, currentUserId, likedIds))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return formatted;
}
