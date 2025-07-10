import { Router } from 'express';
import { catalogController } from '../controllers/catalogController.js';

const router = Router();

router.get('/', catalogController.getAll);
router.get('/:id', catalogController.getById);
router.post('/', catalogController.create);
router.put('/:id', catalogController.update);
router.delete('/:id', catalogController.delete);

export default router;
