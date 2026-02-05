import sequelize from '../config/database';

const addFlowIntensityColumn = async () => {
  try {
    console.log('Adding predicted_flow_intensity column to predictions table...');

    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'predictions' 
      AND column_name = 'predicted_flow_intensity';
    `);

    if ((results as any[]).length > 0) {
      console.log('Column already exists!');
      return;
    }

    // Add the column
    await sequelize.query(`
      ALTER TABLE predictions 
      ADD COLUMN predicted_flow_intensity VARCHAR(20);
    `);

    console.log('  Added predicted_flow_intensity column');

    // Add check constraint for valid values
    await sequelize.query(`
      ALTER TABLE predictions 
      ADD CONSTRAINT check_flow_intensity 
      CHECK (predicted_flow_intensity IN ('light', 'moderate', 'heavy') OR predicted_flow_intensity IS NULL);
    `);

    console.log('Added check constraint');
    console.log('Migration complete!');
  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  }
};

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await addFlowIntensityColumn();

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

run();
