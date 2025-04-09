const { DataTypes, INTEGER } = require("sequelize");
const sequelize = require("../lib/database");
const Url = require("./TableUrl");

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
            model: 'tblurls', // table name (lowercased + pluralized by default)
            key: 'urlId'
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
    foreignKey: 'urlId',
    sourceKey: 'urlId'
});

// Each tracking entry belongs to one URL
Tracking.belongsTo(Url, {
    foreignKey: 'urlId',
    targetKey: 'urlId'
});

module.exports = Tracking;
