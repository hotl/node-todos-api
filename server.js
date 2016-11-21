var express = require('express');
var body_parser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
const PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET todos collection
app.get('/todos', function(req, res) {
	var filtered = todos;
	var queryParams = _.pick(req.query, 'q', 'completed');

	if (req.query.completed) {
		queryParams.completed = (req.query.completed.toLowerCase() === "true");
		filtered = _.filter(filtered, function(todo) {
			return todo.completed == queryParams.completed;
		});
	}

	if (req.query.q && req.query.q.trim().length > 0) {
		filtered = _.filter(filtered, function(todo) {
			return todo.description.toLowerCase().indexOf(queryParams.q) > -1
		});
	}

	res.json(filtered);
});

// GET individual todo
app.get('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	db.todo.findById(todoId).then(function(todo) {
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
app.post('/todos', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function(todo) {
		res.json(todo.toJSON());
	}, function(err) {
		res.status(400).json(err);
	});
});


// DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var matched = _.findWhere(todos, {
		id: todoId
	});

	if (matched) {
		todos = _.without(todos, matched);
		res.json(matched);
	} else {
		res.status(404).json({
			"error": "No todo found with that id"
		});
	}
});

// PUT (UPDATE) /todos/:id
app.put('/todos/:id', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');
	var validAttributes = {};
	var todoId = parseInt(req.params.id, 10);
	var matched = _.findWhere(todos, {
		id: todoId
	});

	if (!matched) {
		return res.status(404).send();
	}

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		validAttributes.completed = body.completed;
	} else if (body.hasOwnProperty('completed')) {
		return res.status(400).send();
	}

	if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
		validAttributes.description = body.description;
	} else if (body.hasOwnProperty('description')) {
		return res.status(400).send();
	}

	_.extend(matched, validAttributes);
	res.json(matched);

});

db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log('Express server now listening' + ' on port ' + PORT);
	});
});