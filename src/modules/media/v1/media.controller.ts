import { StatusCodes } from 'http-status-codes';
import { MediaService } from './media-processing.service.js';
import { HttpResponseError } from '../../../utils/appError.js';

export const uploadMedia = async (req, res) => {
    const files = Array.isArray(req.files)
        ? req.files
        : req.file
            ? [req.file]
            : [];

    if (!files.length) {
        throw new HttpResponseError(StatusCodes.BAD_REQUEST, 'No file uploaded');
    }

    const media = await MediaService.processAndUploadMany(files);
    const responsePayload = media.length === 1 ? media[0] : media;
    res.status(StatusCodes.CREATED).json(responsePayload);
};

export const getMedia = async (req, res) => {
    const { id } = req.params;
    const media = await MediaService.getMedia(id);

    res.set('Content-Type', media.contentType);
    res.send(media.buffer);
};

export const getMediaInfo = async (req, res) => {
    const { id } = req.params;
    const mediaInfo = await MediaService.getMediaInfo(id);
    res.json(mediaInfo);
};