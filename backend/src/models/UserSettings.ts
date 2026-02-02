import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class UserSettings extends Model {
  declare id: string;
  declare user_id: string;
  declare avg_cycle_length: number;
  declare avg_period_length: number;
  declare last_calculated_at: Date | null;
  declare notifications_enabled: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

UserSettings.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  avg_cycle_length: {
    type: DataTypes.INTEGER,
    defaultValue: 28,
    allowNull: false,
  },
  avg_period_length: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    allowNull: false,
  },
  last_calculated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notifications_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'user_settings',
  timestamps: true,
  underscored: true,
});

User.hasOne(UserSettings, { foreignKey: 'user_id', as: 'settings' });
UserSettings.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default UserSettings;
