const { DataTypes, Sequelize, INTEGER } = require("sequelize");
const sequelize = require("../lib/database");

const Users = sequelize.define("tbluser",{
    id:{
        type:INTEGER,
        primaryKey:true,
        autoIncrement:true,
        unique:true,
    },
    first_name:{
        type:DataTypes.STRING,
        allowNull:false
    },
    last_name:{
        type:DataTypes.STRING,
        allowNull:false
    },
    email:{
        type:DataTypes.STRING,
        allowNull:false
    }
})

module.exports = Users