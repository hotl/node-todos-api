module.exports = function(sequelize, DataTypes) {
	return sequelize.define('user', {
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [8, 100],
				is: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/i
			}
		}
	}, {
		hooks: {
			beforeValidate: function(user) {
				if (typeof user.email === 'string') {
					user.email = user.email.toLowerCase();	
				}
			}
		}
	})
}