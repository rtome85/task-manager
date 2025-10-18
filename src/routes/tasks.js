const express = require('express');
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const {
    validateCreateTask,
    validateUpdateTask,
    validateTaskId,
    validateTaskQuery
} = require('../middleware/validation');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

// Task CRUD routes
router.get('/', validateTaskQuery, taskController.getTasks);
router.post('/', validateCreateTask, taskController.createTask);
router.get('/:id', validateTaskId, taskController.getTask);
router.put('/:id', validateUpdateTask, taskController.updateTask);
router.delete('/:id', validateTaskId, taskController.deleteTask);

module.exports = router;