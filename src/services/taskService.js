const getPrismaClient = require('../database/prisma');
const logger = require('../utils/logger');

const prisma = getPrismaClient();

class TaskService {
    async createTask(userId, taskData) {
        const { title, description, status, priority, dueDate, tags } = taskData;

        try {
            // Handle tags if provided
            let taskTags = [];
            if (tags && tags.length > 0) {
                // Create tags that don't exist and get all tag IDs
                for (const tagName of tags) {
                    const tag = await prisma.tag.upsert({
                        where: { name: tagName },
                        update: {},
                        create: { name: tagName },
                    });
                    taskTags.push({ tagId: tag.id });
                }
            }

            // Create task with tags
            const task = await prisma.task.create({
                data: {
                    title,
                    description,
                    status: status || 'PENDING',
                    priority: priority || 'MEDIUM',
                    dueDate: dueDate ? new Date(dueDate) : null,
                    userId,
                    tags: {
                        create: taskTags
                    }
                },
                include: {
                    tags: {
                        include: {
                            tag: true
                        }
                    }
                }
            });

            // Format response
            const formattedTask = this.formatTask(task);
            logger.info(`Task created: ${task.id} for user: ${userId}`);

            return formattedTask;
        } catch (error) {
            logger.error(`Error creating task: ${error.message}`);
            throw error;
        }
    }

    async getTasks(userId, options = {}) {
        const {
            page = 1,
            limit = 10,
            status,
            priority,
            search
        } = options;

        const skip = (page - 1) * limit;

        // Build where clause
        const where = {
            userId,
            ...(status && { status }),
            ...(priority && { priority }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } }
                ]
            })
        };

        try {
            const [tasks, total] = await Promise.all([
                prisma.task.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: [
                        { priority: 'desc' },
                        { dueDate: 'asc' },
                        { createdAt: 'desc' }
                    ],
                    include: {
                        tags: {
                            include: {
                                tag: true
                            }
                        }
                    }
                }),
                prisma.task.count({ where })
            ]);

            const formattedTasks = tasks.map(task => this.formatTask(task));

            return {
                tasks: formattedTasks,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error(`Error fetching tasks: ${error.message}`);
            throw error;
        }
    }

    async getTaskById(userId, taskId) {
        try {
            const task = await prisma.task.findFirst({
                where: {
                    id: parseInt(taskId),
                    userId
                },
                include: {
                    tags: {
                        include: {
                            tag: true
                        }
                    }
                }
            });

            if (!task) {
                throw new Error('Task not found');
            }

            return this.formatTask(task);
        } catch (error) {
            logger.error(`Error fetching task ${taskId}: ${error.message}`);
            throw error;
        }
    }

    async updateTask(userId, taskId, updateData) {
        try {
            // Check if task exists and belongs to user
            const existingTask = await prisma.task.findFirst({
                where: {
                    id: parseInt(taskId),
                    userId
                }
            });

            if (!existingTask) {
                throw new Error('Task not found');
            }

            // Update task
            const task = await prisma.task.update({
                where: { id: parseInt(taskId) },
                data: {
                    ...updateData,
                    ...(updateData.dueDate && { dueDate: new Date(updateData.dueDate) })
                },
                include: {
                    tags: {
                        include: {
                            tag: true
                        }
                    }
                }
            });

            logger.info(`Task updated: ${taskId} by user: ${userId}`);
            return this.formatTask(task);
        } catch (error) {
            logger.error(`Error updating task ${taskId}: ${error.message}`);
            throw error;
        }
    }

    async deleteTask(userId, taskId) {
        try {
            // Check if task exists and belongs to user
            const existingTask = await prisma.task.findFirst({
                where: {
                    id: parseInt(taskId),
                    userId
                }
            });

            if (!existingTask) {
                throw new Error('Task not found');
            }

            // Delete task (cascade will handle task_tags)
            await prisma.task.delete({
                where: { id: parseInt(taskId) }
            });

            logger.info(`Task deleted: ${taskId} by user: ${userId}`);
            return { message: 'Task deleted successfully' };
        } catch (error) {
            logger.error(`Error deleting task ${taskId}: ${error.message}`);
            throw error;
        }
    }

    // Helper method to format task response
    formatTask(task) {
        return {
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            tags: task.tags ? task.tags.map(taskTag => ({
                id: taskTag.tag.id,
                name: taskTag.tag.name,
                color: taskTag.tag.color
            })) : []
        };
    }
}

module.exports = new TaskService();