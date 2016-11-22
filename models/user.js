var bcrypt = require('bcrypt');
var _ = require('underscore');

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
		salt: { // appends random characters to end of plain-text password
			type: DataTypes.STRING
		},
		password_hash: {
			type: DataTypes.STRING
		},
		password: {
			type: DataTypes.VIRTUAL, // Do not persist this attribute to the database
			allowNull: false,
			validate: {
				len: [8, 100],
				is: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/i
			},
			set: function(password) {
				var salt = bcrypt.genSaltSync(10);
				var hashedPassword = bcrypt.hashSync(password, salt);

				this.setDataValue('password', password);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', hashedPassword);
			}
		}
	}, {
		hooks: {
			beforeValidate: function(user) {
				if (typeof user.email === 'string') {
					user.email = user.email.toLowerCase();
				}
			}
		},
		instanceMethods: {
			toPublicJSON: function() {
				var json = this.toJSON();
				return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
			}
		}

	})
}