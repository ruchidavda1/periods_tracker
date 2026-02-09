import sequelize from '../config/database';
import User from './User';
import UserSettings from './UserSettings';
import Period from './Period';
import Symptom from './Symptom';
import Prediction from './Prediction';

export {
  sequelize,
  User,
  UserSettings,
  Period,
  Symptom,
  Prediction,
};

export const syncDatabase = async (force: boolean = false) => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync({ force });
    console.log('All models synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};
