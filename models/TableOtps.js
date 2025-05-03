const { DataTypes, INTEGER } = require("sequelize");
const sequelize = require("../lib/database");

const TableOtps = sequelize.define("tblOtp",{
    id:{
        type:INTEGER,
        primaryKey:true,
        autoIncrement:true,
        unique:true,
    },
    loginId:{
        type:DataTypes.STRING,
        allowNull:false
    },
    code:{
        type:DataTypes.INTEGER,
        allowNull:false
    }
})

module.exports = TableOtps