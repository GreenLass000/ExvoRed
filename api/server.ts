import express from 'express';
import cors from 'cors';

import miracleRoutes from './routes/miracleRoutes.js';
import characterRoutes from './routes/characterRoutes.js';
import exvotoRoutes from './routes/exvotoRoutes.js';
import semRoutes from './routes/semRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import catalogSemRoutes from './routes/catalogSemRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

// Rutas de API
app.use('/api/miracles', miracleRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/exvotos', exvotoRoutes);
app.use('/api/sems', semRoutes);
app.use('/api/catalogs', catalogRoutes);
app.use('/api/catalog-sems', catalogSemRoutes);
import divinityRoutes from './routes/divinityRoutes.js';
app.use('/api/divinities', divinityRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
