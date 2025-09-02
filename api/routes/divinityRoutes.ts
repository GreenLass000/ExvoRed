import { Router } from 'express';
import { divinityController } from '../controllers/divinityController.js';

const router = Router();

router.get('/', divinityController.getAll);
router.get('/:id', divinityController.getById);
router.post('/', divinityController.create);
router.put('/:id', divinityController.update);
router.delete('/:id', divinityController.delete);

export default router;
