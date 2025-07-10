import { db } from './index.js';
import { miracle, character, sem, catalog, exvoto } from './schema.js';

async function seedDatabase() {
  console.log('Seeding database...');

  try {
    // Insertar algunos milagros de ejemplo
    const miracles = await db.insert(miracle).values([
      { name: 'Curación milagrosa' },
      { name: 'Salvación en accidente' },
      { name: 'Protección en viaje' },
      { name: 'Recuperación de enfermedad' },
      { name: 'Ayuda económica' }
    ]).returning();

    // Insertar algunos personajes de ejemplo
    const characters = await db.insert(character).values([
      { name: 'Virgen María' },
      { name: 'Santo Cristo' },
      { name: 'San José' },
      { name: 'Santa Teresa' },
      { name: 'San Antonio' }
    ]).returning();

    // Insertar algunos sems de ejemplo
    const sems = await db.insert(sem).values([
      {
        name: 'Santuario de la Virgen del Rocío',
        region: 'Andalucía',
        province: 'Huelva',
        town: 'Almonte',
        associated_divinity: 'Virgen del Rocío',
        festivity: 'Romería del Rocío',
        pictorial_exvoto_count: 150,
        numero_exvotos: 150,
        comments: 'Importante santuario mariano'
      },
      {
        name: 'Ermita de San Isidro',
        region: 'Castilla-La Mancha',
        province: 'Toledo',
        town: 'Madrid',
        associated_divinity: 'San Isidro Labrador',
        festivity: 'Fiesta de San Isidro',
        pictorial_exvoto_count: 75,
        numero_exvotos: 75,
        comments: 'Ermita tradicional'
      }
    ]).returning();

    // Insertar algunos catálogos de ejemplo
    const catalogs = await db.insert(catalog).values([
      {
        title: 'Exvotos de Andalucía',
        author: 'Dr. García Hernández',
        publication_year: 2020,
        publication_place: 'Sevilla',
        exvoto_count: 200,
        location_description: 'Archivo General de Andalucía',
        comments: 'Estudio completo de exvotos andaluces'
      },
      {
        title: 'Arte Popular Religioso',
        author: 'Dra. López Martín',
        publication_year: 2018,
        publication_place: 'Madrid',
        exvoto_count: 150,
        location_description: 'Biblioteca Nacional',
        comments: 'Análisis del arte popular religioso español'
      }
    ]).returning();

    // Insertar algunos exvotos de ejemplo
    const exvotos = await db.insert(exvoto).values([
      {
        internal_id: 'EX001',
        offering_sem_id: sems[0].id,
        origin_sem_id: sems[0].id,
        conservation_sem_id: sems[0].id,
        province: 'Huelva',
        virgin_or_saint: 'Virgen del Rocío',
        exvoto_date: '2023-05-15',
        benefited_name: 'María González',
        offerer_name: 'Juan González',
        offerer_gender: 'Masculino',
        offerer_relation: 'Esposo',
        miracle: 'Curación milagrosa',
        miracle_place: 'Hospital de Sevilla',
        material: 'Óleo sobre lienzo',
        dimensions: '30x40 cm',
        conservation_status: 'Bueno',
        transcription: 'Por el milagro concedido a mi esposa María'
      },
      {
        internal_id: 'EX002',
        offering_sem_id: sems[1].id,
        origin_sem_id: sems[1].id,
        conservation_sem_id: sems[1].id,
        province: 'Toledo',
        virgin_or_saint: 'San Isidro',
        exvoto_date: '2023-03-10',
        benefited_name: 'Pedro Martín',
        offerer_name: 'Pedro Martín',
        offerer_gender: 'Masculino',
        offerer_relation: 'Mismo',
        miracle: 'Protección en viaje',
        miracle_place: 'Carretera de Toledo',
        material: 'Acuarela sobre papel',
        dimensions: '25x35 cm',
        conservation_status: 'Regular',
        transcription: 'Gracias por protegerme en el viaje'
      }
    ]).returning();

    console.log('Database seeded successfully!');
    console.log(`Created ${miracles.length} miracles`);
    console.log(`Created ${characters.length} characters`);
    console.log(`Created ${sems.length} sems`);
    console.log(`Created ${catalogs.length} catalogs`);
    console.log(`Created ${exvotos.length} exvotos`);

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Ejecutar seed si el script se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;
