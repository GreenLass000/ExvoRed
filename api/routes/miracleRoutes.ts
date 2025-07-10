import { Router } from 'express';
import { miracleController } from '../controllers/miracleController.js';

const router = Router();

router.get('/', miracleController.getAll);
router.get('/:id', miracleController.getById);
router.post('/', miracleController.create);
router.put('/:id', miracleController.update);
router.delete('/:id', miracleController.delete);

export default router;
