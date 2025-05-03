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
  password:{
    type:DataTypes.STRING,
    allowNull:false
  },
  phone_number:{
    type:DataTypes.STRING,
    allowNull:false,
    unique:true
  },
  phone_code:{
    type:DataTypes.INTEGER,
    allowNull:false
  },
  is_Phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  preferences:{
    type:DataTypes.BOOLEAN,
    defaultValue:true
  }
});

module.exports = Users;
