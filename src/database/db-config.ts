// database.ts
import { Sequelize } from 'sequelize';
import { env } from '../config/env.js';
import { debugLogger, errorLogger, infoLogger } from '../config/logger.config.js';

const DB_URL = env.DB_URI;

export const sequelize = new Sequelize(DB_URL, {
    logging: env.NODE_ENV === 'development' ? (msg) => debugLogger.debug(msg) : false,
});

sequelize.sync({ force: true });

export async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        infoLogger.info(`DB Connected to ${DB_URL}`);
    } catch (error) {
        errorLogger.error('DB Connection Error:', error);
    }
}
