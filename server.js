var express = require('express');
var app = express();
const PORT = process.env.PORT || 3000;

// app.use(express.static(__dirname));

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

app.listen(PORT, function() {
	console.log('Express server now listening'
		+ ' on port ' + PORT);
});