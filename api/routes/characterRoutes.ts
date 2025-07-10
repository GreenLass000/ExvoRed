import { Router } from 'express';
import { characterController } from '../controllers/characterController.js';

const router = Router();

router.get('/', characterController.getAll);
router.get('/:id', characterController.getById);
router.post('/', characterController.create);
router.put('/:id', characterController.update);
router.delete('/:id', characterController.delete);

export default router;
