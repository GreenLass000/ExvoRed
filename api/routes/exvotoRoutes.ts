import { Router } from 'express';
import { exvotoController } from '../controllers/exvotoController.js';

const router = Router();

router.get('/', exvotoController.getAll);
router.get('/:id', exvotoController.getById);
router.get('/:id/image', exvotoController.getImage);
router.post('/', exvotoController.create);
router.put('/:id', exvotoController.update);
router.delete('/:id', exvotoController.delete);

// Imágenes adicionales
router.post('/:id/images', exvotoController.addImages);
router.get('/:id/images', exvotoController.getImages);
router.delete('/:id/images/:imageId', exvotoController.deleteImage);

export default router;
