import { UserEntity } from '../../../user/v1/entity/user.entity.js';
import { ChatEntity } from './chat.entity.js';
import { MessageEntity } from './message.entity.js';

UserEntity.hasOne(ChatEntity, { foreignKey: 'userId', as: 'chat' });
ChatEntity.belongsTo(UserEntity, { foreignKey: 'userId', as: 'user' });

ChatEntity.hasMany(MessageEntity, { foreignKey: 'chatId', as: 'messages' });
MessageEntity.belongsTo(ChatEntity, { foreignKey: 'chatId', as: 'chat' });

MessageEntity.belongsTo(UserEntity, { foreignKey: 'senderId', as: 'sender' });
UserEntity.hasMany(MessageEntity, { foreignKey: 'senderId', as: 'sentMessages' });
