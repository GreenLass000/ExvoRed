import { Router } from 'express';
import { catalogSemController } from '../controllers/catalogSemController.js';

const router = Router();

router.get('/', catalogSemController.getAll);
router.get('/catalog/:catalogId', catalogSemController.getByCatalogId);
router.post('/', catalogSemController.create);
router.delete('/:catalogId/:semId', catalogSemController.delete);

export default router;
