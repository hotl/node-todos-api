var express = require('express');
var body_parser = require('body-parser');
var _ = require('underscore');

var app = express();
const PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET todos collection
app.get('/todos', function(req, res) {
	res.json(todos);
});

// GET individual todo
app.get('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var matched = _.findWhere(todos, { id: todoId });

	if (matched) {
		res.json(matched);
	} else {
		res.status(404).send();
	}
});

app.use(body_parser.json());

// POST add todo
app.post('/todos', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	if (!_.isString(body.description) || !_.isBoolean(body.completed)
		|| body.description.trim().length === 0) 
	{
		return res.status(400).send()
	}

	body.description = body.description.trim();
	body.id = todoNextId++;
	todos.push(body);
	res.json(body);
});


// DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var matched = _.findWhere(todos, { id: todoId });

	if (matched) {
		todos = _.without(todos, matched);
		res.json(matched);
	} else {
		res.status(404).json({"error": "No todo found with that id"});
	}
});

// PUT (UPDATE) /todos/:id
app.put('/todos/:id', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');
	var validAttributes = {};
	var todoId = parseInt(req.params.id, 10);
	var matched = _.findWhere(todos, { id: todoId });

	if (!matched) {
		return res.status(404).send();
	}

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		validAttributes.completed = body.completed;
	}
	else if (body.hasOwnProperty('completed')) {
		return res.status(400).send();
	}

	if (body.hasOwnProperty('description') && _.isString(body.description)
		&& body.description.trim().length > 0) {
		validAttributes.description = body.description;
	}
	else if (body.hasOwnProperty('description')) {
		return res.status(400).send();
	}

	_.extend(matched, validAttributes);
	res.json(matched);

});

app.listen(PORT, function() {
	console.log('Express server now listening'
		+ ' on port ' + PORT);
});










