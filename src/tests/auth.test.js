const request = require('supertest');
const app = require('../app');

describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
        const validUser = {
            email: 'test@example.com',
            password: 'TestPass123',
            name: 'Test User'
        };

        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(validUser);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(validUser.email);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.password).toBeUndefined();
        });

        it('should fail with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    ...validUser,
                    email: 'invalid-email'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors.email).toBeDefined();
        });

        it('should fail with weak password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    ...validUser,
                    password: 'weak'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors.password).toBeDefined();
        });

        it('should fail with duplicate email', async () => {
            // First registration
            await request(app)
                .post('/api/auth/register')
                .send(validUser);

            // Second registration with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send(validUser);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        const userData = {
            email: 'test@example.com',
            password: 'TestPass123',
            name: 'Test User'
        };

        beforeEach(async () => {
            // Register user before each login test
            await request(app)
                .post('/api/auth/register')
                .send(userData);
        });

        it('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.token).toBeDefined();
        });

        it('should fail with invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/profile', () => {
        let authToken;

        beforeEach(async () => {
            const userResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'TestPass123',
                    name: 'Test User'
                });

            authToken = userResponse.body.data.token;
        });

        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('test@example.com');
        });

        it('should fail without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
});