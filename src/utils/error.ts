/* eslint-disable prettier/prettier */
export const ERROR = {
  NOT_FOUND: 'Not found',
  UNAUTHORIZED: 'Unauthorized access',
  BAD_REQUEST: 'Bad request',
  FORBIDDEN: 'Forbidden resource',
  INTERNAL_SERVER_ERROR: 'Unexpected error occured',
  EXTERNAL_SERVER_ERROR: 'External server error',
} as const;

export type ErrorMessageKey = keyof typeof ERROR;
export type ErrorMessage = typeof ERROR[ErrorMessageKey];
