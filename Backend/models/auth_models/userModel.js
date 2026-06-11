module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false, 
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,  
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,  
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,  
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,  
      validate: {
        isEmail: true,  
      },
    },
    phn_num: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.STRING,  
      allowNull: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active',  
      validate: {
        isIn: [['active', 'inactive']],  
      },
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    id_code: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

  User.associate = (models) => {
  User.belongsTo(models.Role, {
    foreignKey: 'role_id',
    as: 'Role'
  });
};

  return User;
};