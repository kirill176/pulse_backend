import {
  BadRequestException,
  HttpStatus,
  Injectable,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { getMetadataStorage, ValidationError } from 'class-validator';

const DEFAULT_MESSAGES: Record<string, string> = {
  isString: 'Field should be a string.',
  isNumber: 'Field should be a number.',
  isNotEmpty: 'Field is required.',
  isEmail: 'Field should be correct email.',
};

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const metadataStorage = getMetadataStorage();

        const formattedErrors = errors.reduce(
          (acc, err) => {
            const targetMetadatas = err.target
              ? metadataStorage.getTargetValidationMetadatas(
                  err.target.constructor,
                  '',
                  true,
                  false,
                )
              : [];

            const errorDetails = Object.entries(err.constraints || {}).map(
              ([key, currentMessage]) => {
                const metadata = targetMetadatas.find(
                  (m) => m.propertyName === err.property && m.name === key,
                );

                const hasCustomMessage = Boolean(
                  metadata?.validationTypeOptions?.message,
                );

                if (!hasCustomMessage && DEFAULT_MESSAGES?.[key]) {
                  return DEFAULT_MESSAGES[key];
                }

                return currentMessage;
              },
            );

            acc[err.property] = errorDetails.join(', ');

            return acc;
          },
          {} as Record<string, string>,
        );

        return new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Validation Failed.',
          errors: formattedErrors,
        });
      },
      ...options,
    });
  }
}
