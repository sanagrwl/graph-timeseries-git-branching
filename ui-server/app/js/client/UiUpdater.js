const UiGraph = require('./UiGraph');
const CatalogAPI = require('./CatalogAPI');
const CategoryAPI = require('./CategoryAPI');
const BranchAPI = require('./BranchAPI');
const generateUUID = require('../util');

const events = [];

class UiUpdater {
    static updateBranchesList(branches) {
        const options = $("#branchList");
        
        options.empty();
        branches.forEach(br => {
            options.append($(`<option value="${br.name}">${br.name}</option>`))
        });
    }

    static  updateCategoryTable(categories) {
        const tbody = $("#tbody-categories");

        tbody.empty();
        categories.forEach((category) => {
            tbody
                .append($('<tr>')
                    .append($('<td>')
                        .append(category.id)
                    )
                    .append($('<td>')
                        .append(category.name)
                    )
                    .append($('<td>')
                        .append($('<button/>', {
                            text: 'sub categories',
                            class: 'btn btn-primary',
                            click: () => {
                                UiUpdater.getSubCategories(category.id)
                            }
                        }))
                        .append($('<button/>', {
                            text: 'products',
                            class: 'btn btn-primary',
                            click: () => {
                                UiUpdater.getProducts(category.id)
                            }
                        }))
                        .append($('<button/>', {
                            text: 'delete',
                            class: 'btn btn-primary',
                            click: () => {
                                UiUpdater.deleteCategory(category.parentId, category.id)
                            }
                        }))
                    )
                )
        });
    }

    static updateProductTable(categoryId, products) {
        const tbody = $("#tbody-products");

        tbody.empty();
        (products || []).forEach((product) => {
            let categoryName = '';
            if (product.category) {
                const category = catalog.getCategory(product.category);

                if (category) {
                    categoryName = category.name;
                }
            }

            tbody
                .append($('<tr>')
                    .append($('<td>')
                        .append(product.id)
                    )
                    .append($('<td>')
                        .append(product.name)
                    )
                    .append($('<td>')
                        .append(categoryName)
                    )
                    .append($('<td>')
                        .append(product.price)
                    )
                    .append($('<td>')
                        .append(product.visible)
                    )
                    .append($('<td>')
                        .append(product.color)
                    )
                    .append($('<td>')
                        .append($('<button/>', {
                            text: 'edit',
                            class: 'btn btn-primary',
                            click: () => {
                                UiUpdater.openUpdateForm(product);
                            }
                        }))
                        .append($('<button/>', {
                            text: 'remove',
                            class: 'btn btn-primary',
                            click: () => {
                                UiUpdater.removeProduct(categoryId, product.id);
                            }
                        }))
                    )
                )
        });
    }

    static processEvent(event) {
        return UiUpdater.processEvents([event]);
    }

    static processEvents(events) {
        CatalogAPI.appendEvents(events, UiUpdater.eventId).then((catalog) => {
            window.catalog = catalog;
            UiUpdater.eventId = catalog.eventId;

            UiUpdater.update(catalog);
        });
    }

    static updateEvents(events) {
        const selectedEventId = (!!events && events.length > 0) ? events[0]._id : null
        UiGraph.update(events, selectedEventId, null, (event, ctrl) => {
            // if (ctrl) {
            //     UiUpdater.secondEventId = event.id;
            //     $('#mergeEvents').prop("disabled",false);
            // } else {
            //     $('#mergeEvents').prop("disabled",true);
            //     UiUpdater.setCatalog(event.id);
            // }
        });
    }

    static update(catalog) {
        // UiUpdater.updateCategoryTable(catalog.categories);
        // UiUpdater.updateProductTable(catalog);

        // const categoriesSelect = $('#productCategory');

        // categoriesSelect.empty();
        // catalog.categories.forEach((category) => {
        //     categoriesSelect.append($('<option></option>').val(category.id).html(category.name));
        // });
        // categoriesSelect.val('');

        // CatalogAPI.getAllCatalogEvents(catalog.id).then((events) => {
        //     UiGraph.update(events, catalog.eventId, null, (event, ctrl) => {
        //         if (ctrl) {
        //             UiUpdater.secondEventId = event.id;
        //             $('#mergeEvents').prop("disabled",false);
        //         } else {
        //             $('#mergeEvents').prop("disabled",true);
        //             UiUpdater.setCatalog(event.id);
        //         }
        //     });
        // });
    }

    static openUpdateForm(product) {
        $('#productId').val(product.id);
        $('#productName').val(product.name);
        $('#productPrice').val(product.price);
        $('#productVisible').val(product.visible);
        $('#productColor').val(product.color);

        if (product.category) {
            $('#productCategory').val(product.category);
        }

        $('#productFormModal').modal('show');
    }

    static resetUpdateForms() {
        $('#productId').val('');
        $('#productName').val('');
        $('#productPrice').val('');
        $('#productVisible').val('');
        $('#productColor').val('');
        $('#productCategory').val('');

        $('#categoryName').val('');
    }

    static refresh() {
        UiUpdater.getCategories();   
        UiUpdater.getEvents();
    }

    static toggleApplyLiveChangesButton() {
        const selectedBranch = $("#branchList").val();
        if (!selectedBranch || selectedBranch === 'master') {
            $('#applyLiveChanges').prop("disabled", true);
        } else {
            $('#applyLiveChanges').prop("disabled", false);
        }    
    }

    static setCatalog(eventId) {
        UiUpdater.eventId = eventId;
        CatalogAPI.getCatalog(eventId).then((catalog) => {
            window.catalog = catalog;
            UiUpdater.update(catalog);
        });
    }

    static getCategories() {
        CategoryAPI.getCategories().then((categories) => {
            UiUpdater.updateCategoryTable(categories);
        });
    }

    static getSubCategories(categoryId) {
        CategoryAPI.getSubCategories(categoryId).then((categories) => {
            if (!!categories && categories.length > 0) {
                UiUpdater.updateCategoryTable(categories);
            }
        });
    }

    static getProducts(categoryId) {
        CategoryAPI.getProducts(categoryId).then((products) => {
            UiUpdater.updateProductTable(categoryId, products);
        });
    }

    static createCategory(name) {
        CategoryAPI.createCategory(generateUUID(), name).then((result) => {
            UiUpdater.getCategories();
            UiUpdater.getEvents();
        });
    }

    static createBranch(name) {
        BranchAPI.createBranch(name).then((data) => {
            UiUpdater.getBranches();
            UiUpdater.getEvents();
        });
    }

    static getBranches() {
        BranchAPI.getBranches().then(branches => {
            if (!!branches && branches.length > 0) {
                UiUpdater.updateBranchesList(branches);
            }
        });
    }

    static getEvents() {
        BranchAPI.getEvents().then(events => {
            UiUpdater.updateEvents(events)
        })
    }

    static removeProduct(categoryId, productId) {
        CategoryAPI.deleteProduct(productId).then((result) => {
            UiUpdater.getProducts(categoryId);
            UiUpdater.getEvents();
        });
    }

    static deleteCategory(parentId, categoryId) {
        CategoryAPI.deleteCategory(categoryId).then((result) => {
            !!parentId ? UiUpdater.getSubCategories(parentId) : UiUpdater.getCategories();
            UiUpdater.getEvents();
        });
    }


    static setDefaultCatalog() {
        CatalogAPI.getDefaultCatalog().then((catalog) => {
            window.catalog = catalog;
            UiUpdater.eventId = catalog.eventId;

            localStorage.setItem("eventId", catalog.eventId);

            UiUpdater.update(catalog);
        });
    }

    static deleteEvent() {
        CatalogAPI.deleteEvent(UiUpdater.eventId).then((catalog) => {
            window.catalog = catalog;
            UiUpdater.eventId = catalog.eventId || null;

            UiUpdater.update(catalog);
        });
    }

    static applyLiveChanges() {
        BranchAPI.applyLiveChanges(() => {

        });
        // CatalogAPI.mergeEvents(UiUpdater.eventId, UiUpdater.secondEventId).then((catalog) => {
        //     window.catalog = catalog;
        //     UiUpdater.eventId = catalog.eventId || null;

        //     UiUpdater.update(catalog);
        // });
    }
}

UiUpdater.eventId = null;

module.exports = UiUpdater;
