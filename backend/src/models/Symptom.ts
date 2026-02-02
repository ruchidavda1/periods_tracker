import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Period from './Period';

export enum SymptomType {
  CRAMPS = 'cramps',
  HEADACHE = 'headache',
  MOOD_SWINGS = 'mood_swings',
  FATIGUE = 'fatigue',
  BLOATING = 'bloating',
  ACNE = 'acne',
  OTHER = 'other',
}

class Symptom extends Model {
  declare id: string;
  declare period_id: string;
  declare date: Date;
  declare symptom_type: SymptomType;
  declare severity: number;
  declare notes: string | null;
}

Symptom.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  period_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'periods',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  symptom_type: {
    type: DataTypes.ENUM('cramps', 'headache', 'mood_swings', 'fatigue', 'bloating', 'acne', 'other'),
    allowNull: false,
  },
  severity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'symptoms',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      fields: ['period_id'],
    },
  ],
});

Period.hasMany(Symptom, { foreignKey: 'period_id', as: 'symptoms' });
Symptom.belongsTo(Period, { foreignKey: 'period_id', as: 'period' });

export default Symptom;
