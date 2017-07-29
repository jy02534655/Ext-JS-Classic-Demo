describe("Ext.calendar.store.EventSource", function() {

    var D = Ext.Date,
        calendarData, cal1Data, cal2Data, cal3Data, store, source,
        asyncCalendar, asyncEvents, defaultRange;

    function makeCalStore(cfg) {
        store = new Ext.calendar.store.Calendars(Ext.apply({
            proxy: {
                type: 'ajax',
                url: 'fake'
            }
        }, cfg));
    }

    function makeAutoStore(cfg, preventAutoLoad) {
        makeCalStore(cfg);
        source = store.getEventSource();
        if (!preventAutoLoad) {
            store.load();
            Ext.Ajax.mockCompleteWithData(calendarData);
        }
    }

    function format(d) {
        return D.format(d, 'c');
    }

    beforeEach(function() {
        asyncCalendar = Ext.calendar.store.Calendars.prototype.config.asynchronousLoad;
        asyncEvents = Ext.calendar.store.Events.prototype.config.asynchronousLoad;
        Ext.calendar.store.Calendars.prototype.config.asynchronousLoad = false;
        Ext.calendar.store.Events.prototype.config.asynchronousLoad = false;

        MockAjaxManager.addMethods();

        defaultRange = [new Date(2010, 0, 1), new Date(2010, 1, 1)];

        calendarData = [{
            id: 1,
            title: 'Cal1',
            eventCfg: {
                proxy: {
                    type: 'ajax',
                    url: 'fake1'
                }
            }
        }, {
            id: 2,
            title: 'Cal2',
            eventCfg: {
                proxy: {
                    type: 'ajax',
                    url: 'fake2'
                }
            }
        }];

        cal1Data = [{
            id: 1,
            title: 'Cal1.1',
            // Fully outside range, but in prefetch range
            startDate: format(new Date(2009, 11, 25)),
            endDate: format(new Date(2009, 11, 27))
        }, {
            id: 2,
            title: 'Cal1.2',
            // Start outside range, end inside range
            startDate: format(new Date(2009, 11, 29)),
            endDate: format(new Date(2010, 0, 5))
        }, {
            id: 3,
            title: 'Cal1.3',
            // Single day, in range
            startDate: format(new Date(2010, 0, 4)),
            endDate: format(new Date(2010, 0, 5)),
            allDay: true
        }, {
            id: 4,
            title: 'Cal1.4',
            // Multiple day, in range
            startDate: format(new Date(2010, 0, 17)),
            endDate: format(new Date(2010, 0, 22)),
        }, {
            id: 5,
            title: 'Cal1.5',
            // Start inside range, end outside range
            startDate: format(new Date(2010, 0, 29)),
            endDate: format(new Date(2010, 1, 3)),
        }, {
            id: 6,
            title: 'Cal1.6',
            // Fully outside range, but in prefetch range
            startDate: format(new Date(2010, 1, 2)),
            endDate: format(new Date(2010, 1, 3)),
            allDay: true
        }];

        cal2Data = [{
            id: 7,
            title: 'Cal2.1',
            startDate: format(new Date(2010, 0, 1, 9)),
            endDate: format(new Date(2010, 0, 1, 11, 30)),
        }, {
            id: 8,
            title: 'Cal2.2',
            startDate: format(new Date(2010, 0, 20)),
            endDate: format(new Date(2010, 0, 21)),
            allDay: true
        }, {
            id: 9,
            title: 'Cal2.3',
            startDate: format(new Date(2010, 0, 20)),
            endDate: format(new Date(2010, 0, 21)),
            allDay: true
        }, {
            id: 10,
            // Over the whole range
            title: 'Cal2.4',
            startDate: format(new Date(2009, 11, 20)),
            endDate: format(new Date(2010, 1, 3)),
            allDay: true
        }];
    });

    afterEach(function() {
        source = store = Ext.destroy(source, store);

        MockAjaxManager.removeMethods();
        defaultRange = calendarData = cal1Data = cal2Data = cal3Data = null;

        Ext.calendar.store.Calendars.prototype.config.asynchronousLoad = asyncCalendar;
        Ext.calendar.store.Events.prototype.config.asynchronousLoad = asyncEvents;
    });

    function setDefaultRange() {
        return source.setRange(defaultRange[0], defaultRange[1]);
    }

    function setDefaultRangeAndComplete() {
        setDefaultRange();
        doComplete.apply(this, arguments);
    }

    function increaseDefaultRange(days) {
        return [D.add(defaultRange[0], D.DAY, days), D.add(defaultRange[1], D.DAY, days)];
    }

    function expectIds(ids) {
        var range = source.getRange();

        expect(range.length).toBe(ids.length);


        Ext.Array.forEach(ids, function(id, index) {
            expect(range[index].id).toBe(id);
        });
    }

    function doComplete() {
        var len = arguments.length,
            i;

        for (i = 0; i < len; ++i) {
            Ext.Ajax.mockCompleteWithData(arguments[i]);
        }
    }

    describe("calendar operations", function() {
        var spies;

        beforeEach(function() {
            spies = {};
            Ext.Array.forEach(['add', 'remove', 'load', 'refresh'], function(key) {
                spies[key] = jasmine.createSpy();
            });
        });

        afterEach(function() {
            spies = null;
        });

        function attachSpies() {
            source.on({
                add: spies.add,
                remove: spies.remove,
                load: spies.load,
                refresh: spies.refresh
            });
        }

        describe("loading", function() {
            it("should add the events when they load", function() {
                makeAutoStore();
                setDefaultRangeAndComplete(cal1Data, cal2Data);
                expectIds([10, 2, 7, 3, 4, 8, 9, 5]);
            });

            it("should add events when loading a new dataset", function() {
                makeAutoStore();
                setDefaultRangeAndComplete(cal1Data, cal2Data);

                store.load();
                doComplete([{
                    id: 3,
                    title: 'Cal3',
                    eventCfg: {
                        proxy: {
                            type: 'ajax',
                            url: 'fake3'
                        }
                    }
                }]);
                doComplete([{
                    id: 11,
                    startDate: format(new Date(2010, 0, 3)),
                    endDate: format(new Date(2010, 0, 4)),
                    allDay: true
                }]);
                expectIds([11]);
            });

            describe("events", function() {
                it("should fire a single refresh event when loading first time", function() {
                    makeAutoStore(null, true);
                    attachSpies();
                    store.load();
                    doComplete(calendarData);

                    expect(spies.add).not.toHaveBeenCalled();
                    expect(spies.remove).not.toHaveBeenCalled();
                    expect(spies.load).not.toHaveBeenCalled();
                    expect(spies.refresh).not.toHaveBeenCalled();

                    setDefaultRangeAndComplete(cal1Data, cal2Data);

                    expect(spies.add).not.toHaveBeenCalled();
                    expect(spies.remove).not.toHaveBeenCalled();
                    expect(spies.load.callCount).toBe(1);
                    expect(spies.refresh.callCount).toBe(1);
                });

                it("should fire a single refresh/load event on subsequent reloads", function() {
                    makeAutoStore();
                    setDefaultRangeAndComplete(cal1Data, cal2Data);

                    attachSpies();

                    store.load();
                    doComplete([{
                        id: 3,
                        title: 'Cal3',
                        eventCfg: {
                            proxy: {
                                type: 'ajax',
                                url: 'fake3'
                            }
                        }
                    }]);
                    doComplete([{
                        id: 11,
                        startDate: format(new Date(2010, 0, 3)),
                        endDate: format(new Date(2010, 0, 4)),
                        allDay: true
                    }]);

                    expect(spies.add).not.toHaveBeenCalled();
                    expect(spies.remove).not.toHaveBeenCalled();
                    expect(spies.load.callCount).toBe(1);
                    expect(spies.refresh.callCount).toBe(1);
                });
            });
        });

        describe("adding", function() {
            var cal3;

            beforeEach(function() {
                makeAutoStore();
                setDefaultRangeAndComplete(cal1Data, cal2Data);

                cal3 = new Ext.calendar.model.Calendar({
                    id: 3,
                    title: 'Cal3',
                    eventCfg: {
                        proxy: {
                            type: 'ajax',
                            url: 'fake3'
                        }
                    }
                });
                cal3.events().setRange(defaultRange[0], defaultRange[1]);
                doComplete([{
                    id: 11,
                    title: 'Cal3.1',
                    startDate: format(new Date(2010, 0, 9)),
                    endDate: format(new Date(2010, 0, 10)),
                    allDay: true
                }]);
            });

            afterEach(function() {
                cal3 = null;
            });

            it("should add events when adding a calendar", function() {
                store.add(cal3);
                expectIds([10, 2, 7, 3, 11, 4, 8, 9, 5]);
            });

            it("should exclude events not in the range", function() {
                cal3.events().add({
                    id: 12,
                    title: 'Cal3.2',
                    startDate: new Date(2010, 1, 12),
                    endDate: new Date(2010, 1, 13),
                    allDay: true
                });
                store.add(cal3);
                expectIds([10, 2, 7, 3, 11, 4, 8, 9, 5]);
            });

            describe("events", function() {
                it("should fire a refresh event", function() {
                    attachSpies();
                    store.add(cal3);

                    expect(spies.add).not.toHaveBeenCalled();
                    expect(spies.remove).not.toHaveBeenCalled();
                    expect(spies.load).not.toHaveBeenCalled();
                    expect(spies.refresh.callCount).toBe(1);
                });
            });
        });

        describe("removing", function() {
            beforeEach(function() {
                makeAutoStore();
                setDefaultRangeAndComplete(cal1Data, cal2Data);
            });

            it("should remove events when removing a calendar", function() {
                store.removeAt(0);
                expectIds([10, 7, 8, 9]);
            });

            describe("events", function() {
                it("should fire a refresh event", function() {
                    attachSpies();
                    store.removeAt(0);

                    expect(spies.add).not.toHaveBeenCalled();
                    expect(spies.remove).not.toHaveBeenCalled();
                    expect(spies.load).not.toHaveBeenCalled();
                    expect(spies.refresh.callCount).toBe(1);
                });
            });
        });
    });

    describe("event operations", function() {
        beforeEach(function() {
            makeAutoStore();
            setDefaultRangeAndComplete(cal1Data, cal2Data);
        });

        describe("adding", function() {
            describe("record is in the range", function() {
                it("should add an event", function() {
                    store.getAt(0).events().add({
                        id: 100,
                        startDate: new Date(2010, 0, 10),
                        endDate: new Date(2010, 0, 11),
                        allDay: true
                    });

                    expect(source.indexOfId(100)).not.toBe(-1);
                });

                it("should fire an add event", function() {
                    var addSpy = jasmine.createSpy(),
                        refreshSpy = jasmine.createSpy();

                    source.on('add', addSpy);
                    source.on('refresh', refreshSpy);

                    store.getAt(0).events().add({
                        id: 100,
                        startDate: new Date(2010, 0, 10),
                        endDate: new Date(2010, 0, 11),
                        allDay: true
                    });

                    expect(addSpy.callCount).toBe(1);
                    expect(refreshSpy).not.toHaveBeenCalled();
                });
            });

            describe("record is outside the range", function() {
                it("should not add an event", function() {
                    store.getAt(0).events().add({
                        id: 100,
                        startDate: new Date(2010, 1, 10),
                        endDate: new Date(2010, 1, 11),
                        allDay: true
                    });

                    expect(source.indexOfId(100)).toBe(-1);
                });

                it("should not fire an add event", function() {
                    var addSpy = jasmine.createSpy(),
                        refreshSpy = jasmine.createSpy();

                    source.on('add', addSpy);
                    source.on('refresh', refreshSpy);

                    store.getAt(0).events().add({
                        id: 100,
                        startDate: new Date(2010, 1, 10),
                        endDate: new Date(2010, 1, 11),
                        allDay: true
                    });

                    expect(addSpy).not.toHaveBeenCalled();
                    expect(refreshSpy).not.toHaveBeenCalled();
                });
            });
        });

        describe("removing", function() {
            describe("record is in the range", function() {
                it("should remove an event", function() {
                    var events = store.getAt(0).events();
                    events.remove(events.getById(3));

                    expect(store.indexOfId(3)).toBe(-1);
                });

                it("should fire a remove event", function() {
                    var removeSpy = jasmine.createSpy(),
                        refreshSpy = jasmine.createSpy(),
                        events = store.getAt(0).events();

                    source.on('remove', removeSpy);
                    source.on('refresh', refreshSpy);

                    events.remove(events.getById(3));

                    expect(removeSpy.callCount).toBe(1);
                    expect(refreshSpy).not.toHaveBeenCalled();
                });
            });

            describe("record is outside the range", function() {
                it("should do nothing", function() {
                    var events = store.getAt(0).events();
                    expect(function() {
                        events.remove(events.getById(1));
                    }).not.toThrow();
                });

                it("should not fire a remove event", function() {
                    var removeSpy = jasmine.createSpy(),
                        refreshSpy = jasmine.createSpy(),
                        events = store.getAt(0).events();

                    source.on('remove', removeSpy);
                    source.on('refresh', refreshSpy);

                    events.remove(events.getById(1));

                    expect(removeSpy).not.toHaveBeenCalled();
                    expect(refreshSpy).not.toHaveBeenCalled();
                });
            });

        });

        describe("clearing", function() {
            describe("all records in range", function() {
                var events;
                beforeEach(function() {
                    events = store.getAt(0).events();
                    // Both out of range
                    events.removeAt(5);
                    events.removeAt(0);
                });

                afterEach(function() {
                    events = null;
                });

                it("should remove the records", function() {
                    var records = events.getRange();
                    events.removeAll();

                    Ext.Array.forEach(records, function(rec) {
                        expect(source.contains(rec)).toBe(false);
                    });
                });

                it("should fire a refresh event", function() {
                    var removeSpy = jasmine.createSpy(),
                        refreshSpy = jasmine.createSpy();

                    source.on('remove', removeSpy);
                    source.on('refresh', refreshSpy);

                    events.removeAll();

                    expect(removeSpy).not.toHaveBeenCalled();
                    expect(refreshSpy.callCount).toBe(1);
                });
            });

            describe("some records in range", function() {
                var events;
                beforeEach(function() {
                    events = store.getAt(0).events();
                    events.removeAt(5); // Out of range
                    events.removeAt(4); // In range
                });

                afterEach(function() {
                    events = null;
                });

                it("should remove the records", function() {
                    var records = events.getRange();
                    events.removeAll();

                    Ext.Array.forEach(records, function(rec) {
                        expect(source.contains(rec)).toBe(false);
                    });
                });

                it("should fire a refresh event", function() {
                    var removeSpy = jasmine.createSpy(),
                        refreshSpy = jasmine.createSpy();

                    source.on('remove', removeSpy);
                    source.on('refresh', refreshSpy);

                    events.removeAll();

                    expect(removeSpy).not.toHaveBeenCalled();
                    expect(refreshSpy.callCount).toBe(1);
                });
            });

            describe("no records in range", function() {
                var events;
                beforeEach(function() {
                    events = store.getAt(0).events();
                    events.removeAt(1, 4); // Only leave out of range records
                });

                afterEach(function() {
                    events = null;
                });

                it("should remove the records", function() {
                    var records = events.getRange();
                    events.removeAll();

                    Ext.Array.forEach(records, function(rec) {
                        expect(source.contains(rec)).toBe(false);
                    });
                });

                it("should not fire an refresh event", function() {
                    var removeSpy = jasmine.createSpy(),
                        refreshSpy = jasmine.createSpy();

                    source.on('remove', removeSpy);
                    source.on('refresh', refreshSpy);

                    events.removeAll();

                    expect(removeSpy).not.toHaveBeenCalled();
                    expect(refreshSpy).not.toHaveBeenCalled();
                });
            });
        });

        describe("updating", function() {
            var events;

            beforeEach(function() {
                events = store.getAt(0).events();
            });

            afterEach(function() {
                events = null;
            });

            describe("changing the dates", function() {
                describe("record outside range -> record outside range", function() {
                    it("should not fire any events", function() {
                        var spy = jasmine.createSpy();

                        source.on({
                            add: spy,
                            update: spy,
                            refresh: spy
                        });

                        var event = store.getAt(0).events().getAt(0),
                            start = event.getStartDate();

                        event.setRange(D.subtract(start, D.DAY, 1), event.getEndDate());
                        expect(spy).not.toHaveBeenCalled();
                    });
                });

                describe("record outside range -> record inside range", function() {
                    it("should fire an add event", function() {
                        var spy = jasmine.createSpy(),
                            addSpy = jasmine.createSpy();

                        source.on({
                            add: addSpy,
                            update: spy,
                            refresh: spy
                        });

                        var event = store.getAt(0).events().getAt(0);
                        event.setRange(new Date(2010, 0, 2), new Date(2010, 0, 3));
                        expect(addSpy.callCount).toBe(1);
                        expect(spy).not.toHaveBeenCalled();
                    });
                });

                describe("record inside range -> record outside range", function() {
                    it("should fire a remove event", function() {
                        var spy = jasmine.createSpy(),
                            removeSpy = jasmine.createSpy();

                        source.on({
                            remove: removeSpy,
                            update: spy,
                            refresh: spy
                        });

                        var event = store.getAt(0).events().getAt(2);
                        event.setRange(new Date(2009, 0, 1), new Date(2009, 0, 2));
                        expect(removeSpy.callCount).toBe(1);
                        expect(spy).not.toHaveBeenCalled();
                    });
                });

                describe("record inside range -> record inside range", function() {
                    it("should fire an update event", function() {
                        var spy = jasmine.createSpy(),
                            updateSpy = jasmine.createSpy();

                        source.on({
                            update: updateSpy,
                            add: spy,
                            remove: spy,
                            refresh: spy
                        });

                        var event = store.getAt(0).events().getAt(2);
                        event.setRange(new Date(2010, 0, 28), new Date(2010, 0, 29));
                        expect(updateSpy.callCount).toBe(1);
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            });

            describe("changing other fields", function() {
                describe("record is in the range", function() {
                    it("should fire an update event", function() {
                        var spy = jasmine.createSpy();
                        source.on('update', spy);

                        events.getAt(2).setTitle('Foo');
                        expect(spy.callCount).toBe(1);
                    });
                });

                describe("record is outside the range", function() {
                    it("should not fire an update event", function() {
                        var spy = jasmine.createSpy();
                        source.on('update', spy);

                        events.getAt(0).setTitle('Foo');
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            });
        });

        describe("refreshing", function() {

        });
    });

    // The purpose of these tests isn't to test the setRange behaviour of the events store,
    // just that things are relayed and reacted to correctly.
    describe("setRange", function() {
        describe("with no range set", function() {
            describe("with calendars not loaded", function() {
                describe("before loading calendars", function() {
                    it("should not call events setRange", function() {
                        var spy = spyOn(Ext.calendar.store.Events.prototype, 'setRange').andCallThrough();

                        makeAutoStore(null, true);
                        setDefaultRange();
                        expect(spy).not.toHaveBeenCalled();
                    });
                });

                describe("after loading calendars", function() {
                    it("should call setRange on each event store once calendars load", function() {
                        var spy = spyOn(Ext.calendar.store.Events.prototype, 'setRange').andCallThrough();
                        makeAutoStore(null, true);
                        setDefaultRange();

                        store.load();
                        doComplete(calendarData);
                        expect(spy.callCount).toBe(2);
                        expect(spy.calls[0].object).toBe(store.getAt(0).events());
                        expect(spy.calls[0].args).toEqual([defaultRange[0], defaultRange[1]]);
                        expect(spy.calls[1].object).toBe(store.getAt(1).events());
                        expect(spy.calls[1].args).toEqual([defaultRange[0], defaultRange[1]]);
                        doComplete(cal1Data, cal2Data);
                    });

                    it("should fire a beforeload event", function() {
                        var spy = jasmine.createSpy();
                        makeAutoStore(null, true);
                        setDefaultRange();

                        source.on('beforeload', spy);

                        store.load();
                        doComplete(calendarData);
                        expect(spy.callCount).toBe(1);
                        doComplete(cal1Data, cal2Data);
                    });
                });
            });

            describe("with calendars loaded", function() {
                it("should call setRange on each event store", function() {
                    var spy = spyOn(Ext.calendar.store.Events.prototype, 'setRange').andCallThrough();
                    makeAutoStore();

                    setDefaultRange();
                    expect(spy.callCount).toBe(2);
                    expect(spy.calls[0].object).toBe(store.getAt(0).events());
                    expect(spy.calls[0].args).toEqual([defaultRange[0], defaultRange[1]]);
                    expect(spy.calls[1].object).toBe(store.getAt(1).events());
                    expect(spy.calls[1].args).toEqual([defaultRange[0], defaultRange[1]]);
                    doComplete(cal1Data, cal2Data);
                });

                it("should fire a beforeload event", function() {
                    var spy = jasmine.createSpy();
                    makeAutoStore();
                    source.on('beforeload', spy);

                    setDefaultRange();
                    expect(spy.callCount).toBe(1);
                    doComplete(cal1Data, cal2Data);
                });
            });
        });

        describe("with an existing range", function() {
            describe("where the range is within the existing range", function() {
                it("should not setRange on each event store", function() {
                    makeAutoStore();
                    setDefaultRangeAndComplete(cal1Data, cal2Data);

                    var spy1 = spyOn(store.getAt(0).events(), 'setRange'),
                        spy2 = spyOn(store.getAt(1).events(), 'setRange'),
                        newRange = increaseDefaultRange(1);

                    source.setRange(newRange[0], newRange[1]);

                    expect(spy1).not.toHaveBeenCalled();
                    expect(spy2).not.toHaveBeenCalled();
                });
            });

            describe("where the range is outside of the existing range", function() {
                it("should call setRange on each event store", function() {
                    makeAutoStore();
                    setDefaultRangeAndComplete(cal1Data, cal2Data);

                    var spy1 = spyOn(store.getAt(0).events(), 'setRange'),
                        spy2 = spyOn(store.getAt(1).events(), 'setRange'),
                        newRange = increaseDefaultRange(600);

                    source.setRange(newRange[0], newRange[1]);

                    expect(spy1.callCount).toBe(1);
                    expect(spy1.mostRecentCall.args).toEqual(newRange);

                    expect(spy2.callCount).toBe(1);
                    expect(spy2.mostRecentCall.args).toEqual(newRange);
                });
            });
        });

        describe("events", function() {
            beforeEach(function() {
                makeAutoStore();
                setDefaultRangeAndComplete(cal1Data, cal2Data);
            });


            describe("when all event stores have range", function() {
                it("should not fire a load/beforeload event", function() {
                    var newRange = increaseDefaultRange(1),
                        spy = jasmine.createSpy();

                    source.on({
                        beforeload: spy,
                        load: spy
                    });

                    source.setRange(newRange[0], newRange[1]);
                    // Prefetch
                    doComplete([], []);
                    expect(spy).not.toHaveBeenCalled();
                });
            });

            describe("when all event stores don't have range", function() {
                it("should fire a beforeload event", function() {
                    var newRange = increaseDefaultRange(500),
                        spy = jasmine.createSpy();

                    source.on('beforeload', spy);
                    source.setRange(newRange[0], newRange[1]);
                    expect(spy.callCount).toBe(1);
                    doComplete([], []);
                });

                it("should fire the load event with success: true when all stores have finished loading", function() {
                    var newRange = increaseDefaultRange(500),
                        D = Ext.Date,
                        spy = jasmine.createSpy();

                    source.on('load', spy);
                    source.setRange(newRange[0], newRange[1]);
                    doComplete([{
                        id: 100,
                        startDate: D.add(newRange[0], D.DAY, 1),
                        endDate: D.add(newRange[0], D.DAY, 2),
                        allDay: true
                    }]);
                    expect(spy).not.toHaveBeenCalled();
                    doComplete([{
                        id: 101,
                        startDate: D.subtract(newRange[1], D.DAY, 2),
                        endDate: D.subtract(newRange[1], D.DAY, 1),
                        allDay: true
                    }]);
                    expect(spy.callCount).toBe(1);

                    expect(spy.mostRecentCall.args[0]).toBe(source);
                    expect(spy.mostRecentCall.args[1]).toEqual([source.getAt(0), source.getAt(1)]);
                    expect(spy.mostRecentCall.args[2]).toBe(true);
                });

                it("should fire the load event with success: false when one of the stores fails", function() {
                    var newRange = increaseDefaultRange(500),
                        D = Ext.Date,
                        spy = jasmine.createSpy();

                    source.on('load', spy);
                    source.setRange(newRange[0], newRange[1]);
                    doComplete([{
                        id: 100,
                        startDate: D.add(newRange[0], D.DAY, 1),
                        endDate: D.add(newRange[0], D.DAY, 2),
                        allDay: true
                    }]);
                    expect(spy).not.toHaveBeenCalled();
                    Ext.Ajax.mockComplete({
                        status: 500
                    });
                    expect(spy.callCount).toBe(1);

                    expect(spy.mostRecentCall.args[0]).toBe(source);
                    expect(spy.mostRecentCall.args[1]).toEqual([]);
                    expect(spy.mostRecentCall.args[2]).toBe(false);
                });
            });
        });
    });

});