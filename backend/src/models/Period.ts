import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export enum FlowIntensity {
  LIGHT = 'light',
  MODERATE = 'moderate',
  HEAVY = 'heavy',
}

class Period extends Model {
  declare id: string;
  declare user_id: string;
  declare start_date: Date;
  declare end_date: Date | null;
  declare flow_intensity: FlowIntensity | null;
  declare notes: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Period.init({
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
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  flow_intensity: {
    type: DataTypes.ENUM('light', 'moderate', 'heavy'),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'periods',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'start_date'],
    },
    {
      fields: ['user_id'],
    },
  ],
});

User.hasMany(Period, { foreignKey: 'user_id', as: 'periods' });
Period.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default Period;
