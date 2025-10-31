import { UserEntity } from '../../../user/v1/entity/user.entity.js';
import { MediaEntity } from '../../../media/v1/model/media.model.js';
import { PostEntity } from './post.entity.js';
import { PostMediaEntity } from './post-media.entity.js';
import { PostLikeEntity } from './post-like.entity.js';
import { PostViewEntity } from './post-view.entity.js';
import { PostReportEntity } from './post-report.entity.js';
import { PostSaveEntity } from './post-save.entity.js';
import { PostCommentEntity } from './post-comment.entity.js';
import { PostCommentLikeEntity } from './post-comment-like.entity.js';
import { PostCommentReportEntity } from './post-comment-report.entity.js';

UserEntity.hasMany(PostEntity, { foreignKey: 'userId', as: 'posts', onDelete: 'CASCADE', hooks: true });
PostEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'author' });

PostEntity.belongsToMany(MediaEntity, {
    through: PostMediaEntity,
    foreignKey: 'postId',
    otherKey: 'mediaId',
    as: 'media',
});
MediaEntity.belongsToMany(PostEntity, {
    through: PostMediaEntity,
    foreignKey: 'mediaId',
    otherKey: 'postId',
    as: 'posts',
});
PostEntity.hasMany(PostMediaEntity, { foreignKey: 'postId', as: 'mediaLinks', onDelete: 'CASCADE', hooks: true });
PostMediaEntity.belongsTo(PostEntity, { foreignKey: 'postId', as: 'post' });
PostMediaEntity.belongsTo(MediaEntity, { foreignKey: 'mediaId', as: 'media' });

PostEntity.hasMany(PostLikeEntity, { foreignKey: 'postId', as: 'likes', onDelete: 'CASCADE', hooks: true });
PostLikeEntity.belongsTo(PostEntity, { foreignKey: 'postId', as: 'post' });
PostLikeEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'user' });
UserEntity.hasMany(PostLikeEntity, { foreignKey: 'userId', as: 'postLikes', onDelete: 'CASCADE', hooks: true });

PostEntity.hasMany(PostViewEntity, { foreignKey: 'postId', as: 'views', onDelete: 'CASCADE', hooks: true });
PostViewEntity.belongsTo(PostEntity, { foreignKey: 'postId', as: 'post' });
PostViewEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'viewer' });
UserEntity.hasMany(PostViewEntity, { foreignKey: 'userId', as: 'postViews', onDelete: 'CASCADE', hooks: true });

PostEntity.hasMany(PostReportEntity, { foreignKey: 'postId', as: 'reports', onDelete: 'CASCADE', hooks: true });
PostReportEntity.belongsTo(PostEntity, { foreignKey: 'postId', as: 'post' });
PostReportEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'reporter' });
UserEntity.hasMany(PostReportEntity, { foreignKey: 'userId', as: 'postReports', onDelete: 'CASCADE', hooks: true });

PostEntity.hasMany(PostSaveEntity, { foreignKey: 'postId', as: 'saves', onDelete: 'CASCADE', hooks: true });
PostSaveEntity.belongsTo(PostEntity, { foreignKey: 'postId', as: 'post' });
PostSaveEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'user' });
UserEntity.hasMany(PostSaveEntity, { foreignKey: 'userId', as: 'savedPosts', onDelete: 'CASCADE', hooks: true });

PostEntity.hasMany(PostCommentEntity, { foreignKey: 'postId', as: 'comments', onDelete: 'CASCADE', hooks: true });
PostCommentEntity.belongsTo(PostEntity, { foreignKey: 'postId', as: 'post' });
PostCommentEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'author' });
UserEntity.hasMany(PostCommentEntity, { foreignKey: 'userId', as: 'postComments', onDelete: 'CASCADE', hooks: true });
PostCommentEntity.belongsTo(PostCommentEntity, { foreignKey: 'parentId', as: 'parent' });
PostCommentEntity.hasMany(PostCommentEntity, { foreignKey: 'parentId', as: 'replies', onDelete: 'CASCADE', hooks: true });

PostCommentEntity.hasMany(PostCommentLikeEntity, { foreignKey: 'commentId', as: 'likes', onDelete: 'CASCADE', hooks: true });
PostCommentLikeEntity.belongsTo(PostCommentEntity, { foreignKey: 'commentId', as: 'comment' });
PostCommentLikeEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'user' });
UserEntity.hasMany(PostCommentLikeEntity, { foreignKey: 'userId', as: 'commentLikes', onDelete: 'CASCADE', hooks: true });

PostCommentEntity.hasMany(PostCommentReportEntity, { foreignKey: 'commentId', as: 'reports', onDelete: 'CASCADE', hooks: true });
PostCommentReportEntity.belongsTo(PostCommentEntity, { foreignKey: 'commentId', as: 'comment' });
PostCommentReportEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'reporter' });
UserEntity.hasMany(PostCommentReportEntity, { foreignKey: 'userId', as: 'commentReports', onDelete: 'CASCADE', hooks: true });
