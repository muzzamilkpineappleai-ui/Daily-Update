module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define("Role", {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    role_name: { 
      type: DataTypes.STRING,
      allowNull: false
    },
    created_at: { 
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: { 
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: "roles",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  });

  Role.associate = (models) => {
    Role.hasMany(models.User, { 
      foreignKey: "role_id", 
      as: "Users" 
    });
  };

  return Role;
};