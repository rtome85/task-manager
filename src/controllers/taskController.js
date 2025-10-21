const taskService = require('../services/taskService');

class TaskController {
    async createTask(req, res, next) {
        try {
            const userId = req.user.id;
            const task = await taskService.createTask(userId, req.body);

            res.status(201).json({
                success: true,
                message: 'Task created successfully',
                data: { task }
            });
        } catch (error) {
            next(error);
        }
    }

    async getTasks(req, res, next) {
        try {
            const userId = req.user.id;
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                status: req.query.status,
                priority: req.query.priority,
                search: req.query.search
            };

            const result = await taskService.getTasks(userId, options);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getTask(req, res, next) {
        try {
            const userId = req.user.id;
            const taskId = req.params.id;

            const task = await taskService.getTaskById(userId, taskId);

            res.status(200).json({
                success: true,
                data: { task }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateTask(req, res, next) {
        try {
            const userId = req.user.id;
            const taskId = req.params.id;

            const task = await taskService.updateTask(userId, taskId, req.body);

            res.status(200).json({
                success: true,
                message: 'Task updated successfully',
                data: { task }
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteTask(req, res, next) {
        try {
            const userId = req.user.id;
            const taskId = req.params.id;

            await taskService.deleteTask(userId, taskId);

            res.status(200).json({
                success: true,
                message: 'Task deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new TaskController();