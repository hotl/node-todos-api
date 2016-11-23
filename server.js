var express = require('express');
var body_parser = require('body-parser');
var _ = require('underscore');
var bcrypt = require('bcrypt');
var db = require('./db.js');
var middleware = require('./middleware.js')(db);

var app = express();
const PORT = process.env.PORT || 3000;


app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET todos collection
app.get('/todos', middleware.requireAuthentication, function(req, res) {
	var query = _.pick(req.query, 'q', 'completed');
	query.userId = req.user.get('id');

	if (query.completed) {
		query.completed = (query.completed.toLowerCase() === 'true');
	}
	if (query.q && query.q.trim().length > 0) {
		query.q = {
			$like: '%' + query.q.toLowerCase() + '%'
		};
		query.description = query.q;
		delete query.q;
	}
	db.todo.findAll({
		where: query,
	}).then(function(todos) {
		res.json(todos);
	}, function(err) {
		res.status(500).send();
	});
});

// GET individual todo
app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	db.todo.findOne({
		where: {
			id: todoId,
			userId: req.user.get('id')
		}
	}).then(function(todo) {
		if (todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send('Resource was not found');
		}
	}, function(err) {
		res.status(500).send();
	});
});

// Add middleware to parse req.body for appropriate HTTP methods
app.use(body_parser.json());

// POST add todo
app.post('/todos', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function(todo) {
		req.user.addTodo(todo).then(function() {
			return todo.reload();
		}).then(function(todo) {
			res.json(todo.toJSON());
		});
	}, function(err) {
		res.status(400).json(err);
	});
});


// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	db.todo.destroy({
		where: {
			id: todoId,
			userId: req.user.get('id')
		}
	}).then(function(rowsDeleted) {
		if (rowsDeleted < 1) {
			return res.status(404).json({
				error: 'No todo with id ' + todoId
			});
		}
		res.status(204).send();
	}, function(err) {
		res.status(500).send();
	});
});

// PUT (UPDATE) /todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');
	var todoId = parseInt(req.params.id, 10);
	var attributes = {};

	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	}
	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}

	db.todo.findOne({
		where: {
			id: todoId,
			userId: req.user.get('id')
		}
	}).then(function(todo) {
		if (todo) {
			return todo.update(attributes).then(function(todo) {
				res.json(todo.toJSON());
			}, function(err) {
				res.status(400).json(err);
			});
		} else {
			return res.status(404).send();
		}
	}, function(err) {
		res.status(500).send();
	});
});


// POST /users
app.post('/users', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.user.create(body).then(function(user) {
		return res.json(user.toPublicJSON());
	}, function(err) {
		res.status(400).json(err);
	});
});

// POST /users/login
app.post('/users/login', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.user.authenticate(body).then(function(user) {
		var token = user.generateToken('authentication');
		if (!token) {
			return res.status(401).send();
		}
		res.header('Auth', token).json(user.toPublicJSON());
	}, function(err) {
		res.status(401).send();
	})
	
});

db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log('Express server now listening' + ' on port ' + PORT);
	});
});