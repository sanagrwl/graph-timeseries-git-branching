const generateUUID = require('./js/util');
const UiUpdater = require('./js/client/UiUpdater');
const AddProductEvent = require('./js/events/AddProductEvent');
const SetProductAttributeEvent = require('./js/events/SetProductAttributeEvent');

$(function() {
    UiUpdater.refresh();
    UiUpdater.getBranches(); 
    UiUpdater.toggleApplyLiveChangesButton();
});

function addProduct(name, price, visible, color, category) {
    const event = new AddProductEvent(catalog,
        generateUUID(),
        name, price, visible, color, category
    );
    UiUpdater.processEvent(event);
}

function updateProduct(id, name, price, visible, color, category) {
    const product = catalog.getProduct(id);
    const events = [];

    if (name != (product.name || '') )
        events.push(new SetProductAttributeEvent(catalog, id, 'name', name));
    if (price != (product.price || ''))
        events.push(new SetProductAttributeEvent(catalog, id, 'price', price));
    if (visible != (product.visible || null))
        events.push(new SetProductAttributeEvent(catalog, id, 'visible', visible));
    if (color != (product.color || ''))
        events.push(new SetProductAttributeEvent(catalog, id, 'color', color));
    if (category != (product.category || '') )
        events.push(new SetProductAttributeEvent(catalog, id, 'category', categoryId));

    UiUpdater.processEvents(events);
}


$('#btnSubmitProduct').click(() => {
    const id = $('#productId').val();
    const name = $('#productName').val();
    const price = $('#productPrice').val();
    const visible = $('#productVisible').val();
    const color = $('#productColor').val();
    const categoryId = $('#productCategory').val();
    let category = null;

    if (id) {
        updateProduct(id, name, price, visible, color, categoryId);
    } else {
        addProduct(name, price, visible, color, categoryId || '');
    }

    $('#productFormModal').modal('hide');
    UiUpdater.resetUpdateForms();
});

$('#btnAddCategory').click(() => {
    const name = $('#categoryName').val();

    UiUpdater.createCategory(name);

    $('#categoryFormModal').modal('hide');
    UiUpdater.resetUpdateForms();
});

$('#deleteEvent').click(() => {
    UiUpdater.deleteEvent();
});


$('#applyLiveChanges').click(() => {
    UiUpdater.applyLiveChanges();
});

$('#btnAddBranch').click(() => {
    const name = $('#branchName').val();

    UiUpdater.createBranch(name);

    $('#branchFormModal').modal('hide');
    UiUpdater.resetUpdateForms();
});

$('select#branchList').on('change', function() {
    UiUpdater.refresh();
    UiUpdater.toggleApplyLiveChangesButton();
});
  


