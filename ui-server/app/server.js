const Controller = require('./js/server/Controller');

var express = require('express'), bodyParser = require('body-parser');
var cors = require('cors');

function branchName(request) {
    const b = (request.headers["x-branch"] || "").trim();
    return !b ? 'master' : b;
}

var app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/events', function(request, response) {
    Controller.getEvents(branchName(request), (events) => {
        response.send(events);    // echo the result back
    })
});

app.get('/categories', function(request, response){
    Controller.getCategories(branchName(request), (categories) => {
        response.send(categories);    // echo the result back
    })
});

app.get('/categories/:id', function(request, response){
    Controller.getSubCategories(branchName(request), request.params.id, (categories) => {
        response.send(categories);    // echo the result back
    })
});

app.get('/categories/:id/products', function(request, response){
    Controller.getProducts(branchName(request), request.params.id, (products) => {
        response.send(products);
    })
});

app.delete('/categories/:id', function(request, response){
    Controller.deleteCategory(branchName(request), request.params.id, () => {
        response.send({});
    })
});

app.delete('/products/:id', function(request, response){
    Controller.deleteProduct(branchName(request), request.params.id, () => {
        response.send({});
    })
});


app.post('/categories', function(request, response){
    const id = request.body.id
    const name = request.body.name
    Controller.createCategory(branchName(request), id, name, (payload) => {
        response.send(payload);  
    })
});

app.get('/branches', function(request, response) {
    Controller.getBranches((branches) => {
        response.send(branches);
    })
});

app.post('/branches', function(request, response) {
    Controller.createBranch(request.body.name, (payload) => {
        response.send(payload);
    });
});

app.put('/applyLiveChanges', function(request, response) {
    Controller.applyLiveChanges(branchName(request), () => {
        response.send({});
    });
});

app.put('/events/apply', function(request, response) {
    const event = request.body.event;
    Controller.applyEvent(branchName(request), event, (payload) => {
        response.send(payload);
    });
});

app.listen(80);
