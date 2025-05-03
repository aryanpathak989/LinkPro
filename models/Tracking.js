const { DataTypes, INTEGER } = require("sequelize");
const sequelize = require("../lib/database");
const TableUrl = require("./TableUrl");

const Tracking = sequelize.define("tbltracking", {
    id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },
    urlId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: TableUrl,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    ip: DataTypes.STRING,
    browser: DataTypes.STRING,
    os: DataTypes.STRING,
    deviceType: DataTypes.STRING,
    deviceModel: DataTypes.STRING,
    deviceVendor: DataTypes.STRING,
    city: DataTypes.STRING,
    region: DataTypes.STRING,
    country: DataTypes.STRING,
    emailClient: DataTypes.STRING
}, {
    timestamps: true
});


Url.hasMany(Tracking, {
    foreignKey: 'id',
    sourceKey: 'id'
});

Tracking.belongsTo(Url, {
    foreignKey: 'id',
    targetKey: 'id'
});

module.exports = Tracking;
