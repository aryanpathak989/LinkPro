const { DataTypes, INTEGER } = require("sequelize");
const sequelize = require("../lib/database"); // this is your Sequelize instance

const Users = sequelize.define("tbluser", {
  id: {
    type: INTEGER,
    primaryKey: true,
    autoIncrement: true,
    unique: true,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // Made optional for social login
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: true, // Made optional for social login
    unique: true
  },
  phone_code: {
    type: DataTypes.INTEGER,
    allowNull: true // Made optional for social login
  },
  is_Phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  preferences: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  profile_picture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  auth_provider: {
    type: DataTypes.ENUM('local', 'google', 'facebook', 'microsoft'),
    defaultValue: 'local'
  },
  auth_provider_id: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Users;
