const { DataTypes, INTEGER } = require("sequelize");
const sequelize = require("../lib/database");
const Users = require("./User");

const Url = sequelize.define("tblurl",{
    id:{
        type:INTEGER,
        primaryKey:true,
        autoIncrement:true,
        unique:true,
    },
    user_id:{
        type:DataTypes.INTEGER,
        references: {
            model: Users,
            key: 'id'
        },
        allowNull:false
    },
    shortUrl:{
        type:DataTypes.STRING,
        unique:true
    },
    actualUrl:{
        type:DataTypes.STRING,
        allowNull:false
    },
    expiryDate:{
        type:DataTypes.DATEONLY
    }
})

module.exports = Url