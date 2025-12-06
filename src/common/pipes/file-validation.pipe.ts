// src/common/pipes/validation.pipe.ts
import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import * as Joi from 'joi';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
    async transform(value: any, metadata: ArgumentMetadata) {
        if (!value || metadata.type === 'custom') return value;

        const schema = this.getSchema(metadata.metatype);

        if (!schema) return value;

        try {
            const sanitized = await schema.validateAsync(value, {
                abortEarly: false,
                stripUnknown: true,
            });
            return sanitized;
        } catch (error) {
            throw new BadRequestException(
                error.details.map(d => d.message).join(', '),
            );
        }
    }

    private getSchema(metatype: any): Joi.ObjectSchema | null {
        const schemas = {
            CreateProductDto: Joi.object({
                name: Joi.string().trim().min(3).max(500).required(),
                description: Joi.string().trim().max(5000),
                basePrice: Joi.number().positive().precision(2).required(),
                categoryId: Joi.string().uuid().required(),
                seoTitle: Joi.string().trim().max(500),
                seoDescription: Joi.string().trim().max(2000),
                metadata: Joi.object().unknown(true),
            }),
            RegisterDto: Joi.object({
                email: Joi.string().email().normalize().required(),
                password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
                    .messages({
                        'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
                    }),
                firstName: Joi.string().trim().min(2).max(100).required(),
                lastName: Joi.string().trim().min(2).max(100).required(),
                phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
            }),
            // ... other schemas
        };

        return schemas[metatype.name] || null;
    }
}