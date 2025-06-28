import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { MODULES } from '../config/privileges.js';

export const getPrivilegeModules = asyncHandler(async (req, res) => {
    res.status(StatusCodes.OK).json(MODULES);
}); 