import express from 'express';
import { getGendersController, getRolesController } from './constant.controller.js';

export const constantRouter = express.Router();

constantRouter.get('/roles', getRolesController);
constantRouter.get('/genders', getGendersController);