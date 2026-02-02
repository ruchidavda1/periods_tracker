import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class User extends Model {
  declare id: string;
  declare email: string;
  declare password_hash: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

export default User;
