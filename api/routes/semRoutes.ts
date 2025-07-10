import { Router } from 'express';
import { semController } from '../controllers/semController.js';

const router = Router();

router.get('/', semController.getAll);
router.get('/:id', semController.getById);
router.post('/', semController.create);
router.put('/:id', semController.update);
router.delete('/:id', semController.delete);

export default router;
