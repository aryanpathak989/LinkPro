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
    allowNull:false
  },
  is_Phone_verfied:{
    type:DataTypes.BOOLEAN,
    defaultValue:false
  }
});

module.exports = Users;
