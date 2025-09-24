import { HttpResponseError } from '../../../utils/appError.js';
import { StatusCodes } from 'http-status-codes';
import { UserEntity } from './entity/user.entity.js';
import { isStrongPassword } from '../../../utils/password.utils.js';
import { Op } from 'sequelize';


interface PaginateOptions {
    page?: number;
    limit?: number;
}

interface PaginationResult {
    users: UserEntity[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export class UserService {

    static getUserByProvider(provider: string) {
        return UserEntity.findOne({ where: { provider } });
    }

    static async createUser(userData: Partial<UserEntity>): Promise<UserEntity> {
        const existingUser = await UserEntity.findOne({ where: { provider: userData.provider } });
        if (existingUser) {
            throw new HttpResponseError(StatusCodes.CONFLICT, 'User with this provider already exists');
        }

        if (userData.password && !isStrongPassword(userData.password)) {
            throw new HttpResponseError(StatusCodes.UNPROCESSABLE_ENTITY, 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character');
        }

        const user = new UserEntity(userData);
        await user.save();
        return this.getUserById(user.id.toString());
    }

    static async getUserById(userId: string | number, scope = 'default'): Promise<UserEntity> {
        let user: UserEntity
        if (scope !== 'default') {
            user = await UserEntity.scope(scope).findByPk(userId);
        } else {
            user = await UserEntity.findByPk(userId)
        }
        if (!user) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'User not found');
        }
        return user;
    }

    static async updateUser(userId: string, updateData: Partial<UserEntity>): Promise<UserEntity> {
        const user = await UserEntity.findByPk(userId);
        if (!user) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'User not found');
        }
        await user.update(updateData);
        return this.getUserById(user.id.toString());
    }


    static async deleteUser(userId: string): Promise<UserEntity> {
        const user = await UserEntity.findByPk(userId);
        if (!user) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'User not found');
        }
        await user.destroy();
        return user;
    }

    static async getUsersByFilter(
        filter: any = {},
        options: PaginateOptions = {}
    ): Promise<PaginationResult> {
        const { page = 1, limit = 10 } = options;
        const skip = (Number(page) - 1) * Number(limit);
        if (filter.name) {
            filter.name = { [Op.iLike]: `%${filter.name}%` }; // Partial, case-insensitive match
        }
        if (filter.provider) {
            filter.provider = { [Op.iLike]: `%${filter.provider}%` }; // Partial, case-insensitive match
        }
        // Handle numeric filters for height and weight
        if (filter.height) {
            filter.height = Number(filter.height);
        }
        if (filter.weight) {
            filter.weight = Number(filter.weight);
        }
        // Handle date filter for birthDate
        if (filter.birthDate) {
            filter.birthDate = new Date(filter.birthDate);
        }

        const [users, total] = await Promise.all([
            UserEntity.findAll({
                where: filter,
                offset: skip,
                limit: Number(limit)
            }),
            UserEntity.count({ where: filter })
        ]);

        if (!users.length) {
            throw new HttpResponseError(StatusCodes.NOT_FOUND, 'No users found with the given filter');
        }

        return {
            users,
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        };
    }
}