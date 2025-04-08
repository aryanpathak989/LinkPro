const { DataTypes, Sequelize, INTEGER } = require("sequelize");
const sequelize = require("../lib/database");

const Url = sequelize.define("tblurl",{
    id:{
        type:INTEGER,
        primaryKey:true,
        autoIncrement:true,
        unique:true,
    },
    urlId:{
        type:DataTypes.STRING,
        unique:true
    },
    actualUrl:{
        type:DataTypes.STRING,
        allowNull:false
    }
})

module.exports = Url