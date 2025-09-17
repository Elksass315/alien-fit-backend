import Joi from 'joi';


export const JoiCustomValidateObjectId = (field: string, optional = false) => {
    const schema = Joi.string().custom((value, helpers) => {
        if (!(value)) {
            return helpers.error('string.objectId');
        }
        return value;
    }).messages({
        'any.required': `${field} is a required field`,
        'string.empty': `${field} cannot be empty`,
        'string.base': `${field} must be a string`,
        'string.objectId': `${field} must be a valid ObjectId`
    });

    return optional ? schema.optional() : schema.required();
};