describe("Ext.calendar.store.Events", function() {
    var store;

    function makeStore(cfg) {
        store = new Ext.calendar.store.Events(Ext.apply({
            model: 'Ext.calendar.model.Event'
        }, cfg));
    }

    afterEach(function() {
        store = Ext.destroy(store);
    });

    describe("setRange", function() {

    });

    describe("getInRange", function() {

    });
});