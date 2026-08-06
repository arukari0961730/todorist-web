import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  FRONTEND_URL: Joi.alternatives()
    .try(
      Joi.string().valid('same-origin'),
      Joi.string().uri({ scheme: ['http', 'https'] }),
    )
    .required(),
  SESSION_SECRET: Joi.string().min(32).required(),
  SESSION_COOKIE_NAME: Joi.string().min(1).default('todorist_session'),
  SESSION_DAYS: Joi.number().integer().min(1).max(365).default(30),
});
