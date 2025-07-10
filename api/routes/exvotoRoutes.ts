import { Router } from 'express';
import { exvotoController } from '../controllers/exvotoController.js';

const router = Router();

router.get('/', exvotoController.getAll);
router.get('/:id', exvotoController.getById);
router.post('/', exvotoController.create);
router.put('/:id', exvotoController.update);
router.delete('/:id', exvotoController.delete);

export default router;
