var express = require('express');
var body_parser = require('body-parser');
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

    for (var i = 0; i < todos.length; i++) {
    	if (todos[i].id === todoId) {
    		return res.json(todos[i])
    	}
    }

    res.status(404).send();
});

app.use(body_parser.json());

// POST add todo
app.post('/todos', function(req, res) {
	var body = req.body;
	body.id = todoNextId++;
	todos.push(body);
	res.json(body);
});

app.listen(PORT, function() {
	console.log('Express server now listening'
		+ ' on port ' + PORT);
});










