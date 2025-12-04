import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const routesPath = isProduction
  ? path.join(__dirname, '../routes/*.js')
  : './src/routes/*.ts';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Campus Assistant API',
      version: '1.0.0',
      description: 'API documentation for Smart Campus Assistant application',
      contact: {
        name: 'API Support',
        email: 'support@smartcampus.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [routesPath] // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
