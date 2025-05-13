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
        type: DataTypes.INTEGER,
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


// Correct: urlId in Tracking references id in TableUrl
TableUrl.hasMany(Tracking, {
    foreignKey: 'urlId'
});

Tracking.belongsTo(TableUrl, {
    foreignKey: 'urlId'
});

module.exports = Tracking;
