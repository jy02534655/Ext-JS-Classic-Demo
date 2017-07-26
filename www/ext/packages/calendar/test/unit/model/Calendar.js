describe("Ext.calendar.model.Calendar", function() {

    var calendar;

    function makeCalendar(cfg) {
        calendar = new Ext.calendar.model.Calendar(cfg);
    }

    afterEach(function() {
        calendar = null;
    });

    describe("events", function() {
        it("should return a store", function() {
            makeCalendar();
            var store = calendar.events();
            expect(store.$className).toBe('Ext.calendar.store.Events');
        });

        it("should return the same instance on repeated accesses", function() {
            makeCalendar();
            var a = calendar.events(),
                b = calendar.events();

            expect(a).toBe(b);
        });

        it("should use the eventStoreDefaults", function() {
            var T = Ext.define(null, {
                extend: 'Ext.calendar.model.Calendar',
                eventStoreDefaults: {
                    proxy: {
                        type: 'ajax',
                        url: 'foo'
                    }
                }
            });

            calendar = new T();
            var store = calendar.events();
            expect(store.getProxy().getUrl()).toBe('foo');
        });

        it("should use the eventStore field", function() {
            makeCalendar({
                eventStore: {
                    proxy: {
                        type: 'ajax',
                        url: 'bar'
                    }
                }
            });
            var store = calendar.events();
            expect(store.getProxy().getUrl()).toBe('bar');
        });

        it("should give preference to the field", function() {
            var T = Ext.define(null, {
                extend: 'Ext.calendar.model.Calendar',
                eventStoreDefaults: {
                    proxy: {
                        type: 'ajax',
                        url: 'foo'
                    }
                }
            });

            calendar = new T({
                eventStore: {
                    proxy: {
                        type: 'ajax',
                        url: 'bar'
                    }
                }
            });
            var store = calendar.events();
            expect(store.getProxy().getUrl()).toBe('bar');
        });
    });

});