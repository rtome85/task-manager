const request = require('supertest');
const app = require('../app');

describe('Task Endpoints', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
        // Register and login user for each test
        const userResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@example.com',
                password: 'TestPass123',
                name: 'Test User'
            });

        authToken = userResponse.body.data.token;
        userId = userResponse.body.data.user.id;
    });

    describe('POST /api/tasks', () => {
        const validTask = {
            title: 'Test Task',
            description: 'Test Description',
            priority: 'HIGH',
            dueDate: '2025-12-31T23:59:59.000Z',
            tags: ['work', 'urgent']
        };

        it('should create a task successfully', async () => {
            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send(validTask);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.task.title).toBe(validTask.title);
            expect(response.body.data.task.status).toBe('PENDING');
            expect(response.body.data.task.tags).toHaveLength(2);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/tasks')
                .send(validTask);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should fail with empty title', async () => {
            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ...validTask,
                    title: ''
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors.title).toBeDefined();
        });
    });

    describe('GET /api/tasks', () => {
        beforeEach(async () => {
            // Create some test tasks
            const tasks = [
                { title: 'Task 1', status: 'PENDING', priority: 'HIGH' },
                { title: 'Task 2', status: 'COMPLETED', priority: 'LOW' },
                { title: 'Task 3', status: 'IN_PROGRESS', priority: 'MEDIUM' }
            ];

            for (const task of tasks) {
                await request(app)
                    .post('/api/tasks')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(task);
            }
        });

        it('should get all tasks for authenticated user', async () => {
            const response = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.tasks).toHaveLength(3);
            expect(response.body.data.pagination.total).toBe(3);
        });

        it('should filter tasks by status', async () => {
            const response = await request(app)
                .get('/api/tasks?status=COMPLETED')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.tasks).toHaveLength(1);
            expect(response.body.data.tasks[0].status).toBe('COMPLETED');
        });

        it('should paginate results', async () => {
            const response = await request(app)
                .get('/api/tasks?page=1&limit=2')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.tasks).toHaveLength(2);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(2);
        });
    });

    describe('PUT /api/tasks/:id', () => {
        let taskId;

        beforeEach(async () => {
            const taskResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Original Task',
                    description: 'Original Description'
                });

            taskId = taskResponse.body.data.task.id;
        });

        it('should update task successfully', async () => {
            const updateData = {
                title: 'Updated Task',
                status: 'COMPLETED'
            };

            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.task.title).toBe(updateData.title);
            expect(response.body.data.task.status).toBe(updateData.status);
        });

        it('should fail with invalid task ID', async () => {
            const response = await request(app)
                .put('/api/tasks/999999')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Updated Task' });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        let taskId;

        beforeEach(async () => {
            const taskResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Task to Delete',
                    description: 'This task will be deleted'
                });

            taskId = taskResponse.body.data.task.id;
        });

        it('should delete task successfully', async () => {
            const response = await request(app)
                .delete(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify task is deleted
            const getResponse = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(getResponse.status).toBe(500);
        });
    });
});