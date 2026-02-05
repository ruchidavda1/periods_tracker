import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class Prediction extends Model {
  declare id: string;
  declare user_id: string;
  declare predicted_start_date: Date;
  declare predicted_end_date: Date;
  declare ovulation_start: Date;
  declare ovulation_end: Date;
  declare confidence_score: number;
  declare predicted_flow_intensity: 'light' | 'moderate' | 'heavy' | null;
  declare readonly created_at: Date;
}

Prediction.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  predicted_start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  predicted_end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  ovulation_start: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  ovulation_end: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  confidence_score: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  predicted_flow_intensity: {
    type: DataTypes.ENUM('light', 'moderate', 'heavy'),
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'predictions',
  timestamps: true,
  updatedAt: false,
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'predicted_start_date'],
    },
  ],
});

User.hasMany(Prediction, { foreignKey: 'user_id', as: 'predictions' });
Prediction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default Prediction;
