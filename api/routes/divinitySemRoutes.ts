import { Router } from 'express';
import { divinitySemController } from '../controllers/divinitySemController.js';

const router = Router();

router.get('/', divinitySemController.getAll);
router.get('/divinity/:divinityId', divinitySemController.getByDivinityId);
router.get('/sem/:semId', divinitySemController.getBySemId);
router.post('/', divinitySemController.create);
router.delete('/:divinityId/:semId', divinitySemController.delete);

export default router;
