var bcrypt = require('bcrypt');
var _ = require('underscore');
var jwt = require('jsonwebtoken');
var crypto = require('crypto-js');

module.exports = function(sequelize, DataTypes) {
	var user = sequelize.define('user', {
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
		classMethods: {
			authenticate: function(body) {
				return new Promise(function(resolve, reject) {
					if (!_.isString(body.email) || !_.isString(body.password)) {
						return reject();
					}
					user.findOne({
						where: {
							email: body.email
						}
					}).then(function(user) {
						if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
							return reject();
						}
						resolve(user);
					}, function(err) {
						return reject();
					});
				});
			}
		},
		instanceMethods: {
			toPublicJSON: function() {
				var json = this.toJSON();
				return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
			},
			generateToken: function(type) {
				if (!_.isString(type)) {
					return undefined;
				}
				try { // encrypt user info and return jwt
					var stringData = JSON.stringify({ id: this.get('id'), type: type });
					var encryptedData = crypto.AES.encrypt(stringData, 'crypto!@#').toString();
					var token = jwt.sign({
						token: encryptedData
					}, 'jwt!@#$');

					return token;
				}
				catch (e) {
					return undefined;
				}

			}
		}

	});

	return user;
}