const generateUUID = require('./js/util');
const Controller = require('./js/server/Controller');
const AddCatalogEvent = require('./js/events/AddCatalogEvent');
const AddCategoryEvent = require('./js/events/AddCategoryEvent');
const AddProductEvent = require('./js/events/AddProductEvent');

var express = require('express')
    , bodyParser = require('body-parser');
var cors = require('cors');

function branchName(request) {
    const b = (request.headers["x-branch"] || "").trim();
    return !b ? 'master' : b;
}

var app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/events', function(request, response){
    Controller.insertEvents(request.body.events, request.body.parentId, (catalog) => {
        response.send(catalog);    // echo the result back
    })
});

app.get('/catalog/:id', function(request, response){
    Controller.getCatalog(request.params.id).then((catalog) => {
        response.send(catalog);    // echo the result back
    }).catch((e) => {
        response.send(e);    // echo the result back
    })

});

app.get('/events/:id', function(request, response){
    Controller.getEvents(request.params.id).then((events) => {
        response.send({ events });    // echo the result back
    }).catch((e) => {
        response.send(e);    // echo the result back
    })
});

app.delete('/events/:id', function(request, response){
    Controller.deleteEvent(request.params.id).then((catalog) => {
        response.send(catalog);    // echo the result back
    }).catch((e) => {
        response.send(e);    // echo the result back
    })

});

app.post('/events/:id/merge/:from', function(request, response){
    Controller.mergeEvents(request.params.id, request.params.from).then((catalog) => {
        response.send(catalog);    // echo the result back
    }).catch((e) => {
        response.send(e);    // echo the result back
    })

});

// new endpoints

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
    })
});

app.listen(80);
