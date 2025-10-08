import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import morgan from 'morgan';
import { join } from 'path';
import { connect, DatabaseError, Result } from 'ts-postgres';
import { Todo } from './shared/models/todo';
import { body, validationResult } from 'express-validator';
import { HttpResponse } from './shared/dtos/response';

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// Helper function to convert query results to objects with camelCase keys
function rowsToObjects<T>(result: Result<T>): T[] {
  return result.rows.map((row) => {
    const obj: any = {};
    result.names.forEach((name: string, index: number) => {
      const camelCaseName = toCamelCase(name);
      obj[camelCaseName] = row[index];
    });
    return obj;
  });
}

const client = await connect({
  host: 'localhost',
  port: 5433,
  database: 'todo_db',
  user: 'nguyenbin',
  password: '09012003a',
})
  .then((client) => {
    console.log('Connected to PostgreSQL database');
    // truncate database
    client.query('DROP TABLE IF EXISTS todos;');

    client
      .query(
        `CREATE TABLE todos (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL UNIQUE,
          completed BOOLEAN NOT NULL DEFAULT false,
          is_deleted BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      )
      .then(() => {
        console.log('Todos table is ready');
      })
      .catch((err) => {
        console.error('Failed to create todos table', err);
      });

    // seed data
    client
      .query(
        `INSERT INTO todos (title, completed, is_deleted) VALUES
          ('Sample Todo 1', false, false),
          ('Sample Todo 2', true, false)
          ON CONFLICT (title) DO NOTHING`
      )
      .then(() => {
        console.log('Seed data inserted');
      })
      .catch((err) => {
        console.error('Failed to insert seed data', err);
      });

    return client;
  })
  .catch((err) => {
    console.error('Failed to connect to PostgreSQL database', err);
    throw err;
  });

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const angularApp = new AngularNodeAppEngine();

app.use(
  morgan('combined', {
    skip: function (req, res) {
      return res.statusCode < 400;
    },
  })
);

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

app.get('/api/todos', async (req, res) => {
  try {
    const result = await client.query<Todo>(
      'SELECT * FROM todos WHERE is_deleted = false ORDER BY id ASC'
    );

    const todos = rowsToObjects(result);
    res.status(200).json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    await client.query('UPDATE todos SET is_deleted = true WHERE id = $1', [id]);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

app.post(
  '/api/todos',
  body('title').notEmpty().withMessage('Title must not be empty'),
  body('title').isLength({ max: 255 }).withMessage('Title must be at most 255 characters long'),
  body('completed').isBoolean({ strict: true }).withMessage('Completed must be a boolean'),
  body('isDeleted')
    .default(false)
    .isBoolean({ strict: true })
    .withMessage('Is Deleted must be a boolean'),
  async (req, res) => {
    const result = validationResult(req);
    if (result.isEmpty()) {
      const todo = req.body as Todo;

      try {
        const queryResult = await client.query(
          'INSERT INTO todos (title, completed, is_deleted) VALUES ($1, $2, $3) RETURNING *',
          [todo.title, todo.completed, todo.isDeleted]
        );

        return res.status(201).json(
          HttpResponse.toResponse('Todo created successfully', {
            data: rowsToObjects(queryResult)[0],
            statusCode: 201,
          })
        );
      } catch (error) {
        console.error('Error inserting todo:', error);
        if (error instanceof DatabaseError) {
          return res.status(400).json(
            HttpResponse.toResponse(error.message, {
              statusCode: 400,
              data: error,
              retCode: error.code,
            })
          );
        }
        return res.status(500).json(HttpResponse.toResponse('Internal server error'));
      }
    }

    const errors = result.array();
    const message = errors.map((err) => err.msg).join(', ');
    return res.send(
      HttpResponse.toResponse(message, {
        statusCode: 400,
        data: errors,
      })
    );
  }
);

app.put('/api/todos/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, completed } = req.body;

  try {
    const queryResult = await client.query(
      'UPDATE todos SET title = COALESCE($1, title), completed = COALESCE($2, completed), updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND is_deleted = false RETURNING *',
      [title, completed, id]
    );

    if (queryResult.rows.length === 0) {
      return res.status(404).json(
        HttpResponse.toResponse('Todo not found', {
          statusCode: 404,
        })
      );
    }

    const updatedTodo = rowsToObjects(queryResult)[0];
    return res.status(200).json(
      HttpResponse.toResponse('Todo updated successfully', {
        data: updatedTodo,
        statusCode: 200,
      })
    );
  } catch (error) {
    console.error('Error updating todo:', error);
    return res.status(500).json(
      HttpResponse.toResponse('Failed to update todo', {
        statusCode: 500,
      })
    );
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .then(() => console.log('Receive request for: ' + req.url))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
