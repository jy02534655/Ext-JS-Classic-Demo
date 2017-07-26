/* global expect, Ext */

topSuite("Ext.pivot.plugin.Configurator",
    ['Ext.pivot.Grid', 'Ext.form.field.Number'],
function() {
    var store, plugin, grid, record, column, field,
        events = {};

    function eventFired(event) {
        return function() {
            events = events || {};
            events[event] = true;
        };
    }

    function makeGrid(pluginCfg, gridCfg) {
        store = new Ext.data.Store({
            fields: [
                {name: 'person',    type: 'string'},
                {name: 'year',      type: 'integer'},
                {name: 'month',     type: 'integer'},
                {name: 'value',     type: 'float'}
            ],
            data: [
                { person: 'Lisa', year: 2012, month: 0, value: 10 },
                { person: 'John', year: 2012, month: 1, value: 10 },
                { person: 'Mary', year: 2012, month: 2, value: 10 },
                { person: 'Lisa', year: 2013, month: 2, value: 10 },
                { person: 'John', year: 2013, month: 2, value: 10 },
                { person: 'Mary', year: 2013, month: 1, value: 10 },
                { person: 'Mary', year: 2014, month: 0, value: 10 }
            ],
            autoDestroy: true
        });

        plugin = new Ext.pivot.plugin.Configurator(Ext.merge({
            fields: [{
                dataIndex:  'person',
                header:     'Person',

                settings: {
                    // Define here what aggregator functions can be used when this field is
                    // used as an aggregate dimension
                    aggregators: ['count']
                }
            }, {
                dataIndex:  'year',
                header:     'Year',

                settings: {
                    // Define here what aggregator functions can be used when this field is
                    // used as an aggregate dimension
                    aggregators: ['count']
                }
            }, {
                dataIndex:  'value',
                header:     'Value'
            }]
        }, pluginCfg));

        grid = new Ext.pivot.Grid(Ext.merge({
            renderTo: Ext.getBody(),
            width: 500,
            height: 400,

            plugins: [plugin],

            listeners: {
                pivotDone: eventFired('done')
            },

            matrix: {
                type: 'local',
                calculateAsExcel: false,
                store: store,

                aggregate: [{
                    dataIndex: 'value',
                    header: 'Total',
                    aggregator: 'sum',
                    // if you want an aggregate dimension to be editable you need to specify its editor
                    editor: 'numberfield'
                },{
                    dataIndex: 'value',
                    header: 'Count',
                    aggregator: 'count'
                }],

                leftAxis: [{
                    dataIndex: 'person',
                    header: 'Person'
                }],

                topAxis: [{
                    dataIndex: 'year',
                    header: 'Year'
                }]
            }
        }, gridCfg));

    }

    afterEach(function() {

        tearDown();
    });

    function tearDown() {
        store = plugin = grid = record = column = field = Ext.destroy(grid);
        events = {};
    }

    describe('finding the configurator plugin in a pivot grid', function() {
        beforeEach(function() {
            makeGrid({pluginId:'test-configurator'});
        });

        it('should find it by id', function() {
            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                expect(grid.getPlugin('test-configurator')).toBe(plugin);
            });
        });
        it('should find it by ptype', function() {
            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                expect(grid.findPlugin('pivotconfigurator')).toBe(plugin);
            });
        });
    });

    describe('configurator fields', function(){
        it('should render correctly the fields', function () {
            makeGrid();

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = plugin.getConfigPanel(),
                    fieldsAllCt = panel.getAllFieldsContainer(),
                    fieldsLeftCt = panel.getLeftAxisContainer(),
                    fieldsTopCt = panel.getTopAxisContainer(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    items, field;

                items = fieldsAggCt.items.items;
                expect(items.length).toBe(2);
                field = items[0].getField();
                expect(field.getHeader()).toBe('Total');
                expect(field.getAggregator()).toBe('sum');
                field = items[1].getField();
                expect(field.getHeader()).toBe('Count');
                expect(field.getAggregator()).toBe('count');

                items = fieldsAllCt.items.items;
                expect(items.length).toBe(3);
                expect(items[0].getField().getHeader()).toBe('Person');
                expect(items[1].getField().getHeader()).toBe('Year');
                expect(items[2].getField().getHeader()).toBe('Value');

                items = fieldsLeftCt.items.items;
                expect(items.length).toBe(1);
                field = items[0].getField();
                expect(field.getHeader()).toBe('Person');

                items = fieldsTopCt.items.items;
                expect(items.length).toBe(1);
                field = items[0].getField();
                expect(field.getHeader()).toBe('Year');
            });
        });

        it('should extract the fields from the store', function () {
            makeGrid({ fields: null });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = plugin.getConfigPanel(),
                    fieldsAllCt = panel.getAllFieldsContainer(),
                    items;

                items = fieldsAllCt.items.items;
                expect(items.length).toBe(store.model.getFields().length);
            });

        });

        it('should merge configs from the pivot dimensions to the configurator fields', function () {
            var monthRenderer = function (v) {
                    return Ext.Date.monthNames[v];
                },
                yearRenderer = function (v) {
                    return 'Year ' + v;
                },
                renderer = Ext.util.Format.numberRenderer('0,000');

            makeGrid({
                fields: null
            }, {
                matrix: {
                    leftAxis: [{
                        dataIndex: 'month',
                        header: 'Months',
                        labelRenderer: monthRenderer
                    }],
                    topAxis: [{
                        dataIndex: 'year',
                        header: 'Years',
                        labelRenderer: yearRenderer
                    }],
                    aggregate: [{
                        dataIndex: 'value',
                        header: 'Sum of value',
                        aggregator: 'sum',
                        renderer: renderer
                    }]
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = plugin.getConfigPanel(),
                    fieldsAllCt = panel.getAllFieldsContainer(),
                    items;

                items = fieldsAllCt.items.items;
                expect(items.length).toBe(store.model.getFields().length);
                expect(items[0].getField().getHeader()).toBe('Person');
                expect(items[1].getField().getHeader()).toBe('Year');
                expect(items[1].getField().getLabelRenderer()).toBe(yearRenderer);
                expect(items[2].getField().getHeader()).toBe('Month');
                expect(items[2].getField().getLabelRenderer()).toBe(monthRenderer);
                expect(items[3].getField().getHeader()).toBe('Value');
                expect(items[3].getField().getRenderer()).toBe(renderer);
            });

        });

        it('should keep settings on dimensions when pivot is reconfigured via dnd', function () {
            var monthRenderer = function (v) {
                    return Ext.Date.monthNames[v];
                },
                yearRenderer = function (v) {
                    return 'Year ' + v;
                },
                renderer = Ext.util.Format.numberRenderer('0,000');

            makeGrid({
                fields: null
            }, {
                matrix: {
                    leftAxis: [{
                        dataIndex: 'month',
                        header: 'Months',
                        labelRenderer: monthRenderer
                    }],
                    topAxis: [{
                        dataIndex: 'year',
                        header: 'Years',
                        labelRenderer: yearRenderer
                    }],
                    aggregate: [{
                        dataIndex: 'value',
                        header: 'Sum of value',
                        aggregator: 'sum',
                        renderer: renderer
                    }]
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = plugin.getConfigPanel(),
                    fieldsAllCt = panel.getAllFieldsContainer(),
                    fieldsTopCt = panel.getTopAxisContainer(),
                    items;

                events.done = false;
                items = fieldsTopCt.items.items;
                panel.dragDropField(fieldsAllCt, items[0], 'after');
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = plugin.getConfigPanel(),
                    fieldsAllCt = panel.getAllFieldsContainer(),
                    fieldsLeftCt = panel.getLeftAxisContainer(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    matrix = grid.getMatrix(),
                    items;

                items = fieldsAllCt.items.items;
                expect(items.length).toBe(store.model.getFields().length);
                expect(items[0].getField().getHeader()).toBe('Person');
                expect(items[1].getField().getHeader()).toBe('Year');
                expect(items[1].getField().getLabelRenderer()).toBe(yearRenderer);
                expect(items[2].getField().getHeader()).toBe('Month');
                expect(items[2].getField().getLabelRenderer()).toBe(monthRenderer);
                expect(items[3].getField().getHeader()).toBe('Value');
                expect(items[3].getField().getRenderer()).toBe(renderer);

                items = fieldsLeftCt.items.items;
                expect(items.length).toBe(1);
                expect(items[0].getField().getHeader()).toBe('Months');
                expect(items[0].getField().getLabelRenderer()).toBe(monthRenderer);
                expect(matrix.leftAxis.dimensions.items[0].getLabelRenderer()).toBe(monthRenderer);

                items = fieldsAggCt.items.items;
                expect(items.length).toBe(1);
                expect(items[0].getField().getHeader()).toBe('Sum of value');
                expect(items[0].getField().getRenderer()).toBe(renderer);
                expect(matrix.aggregate.items[0].getRenderer()).toBe(renderer);
            });

        });

        it('should move a field from top to left axis when dnd from aggregate to left axis', function () {
            // dragging "year" from aggregate to left axis should move "year" from top to left axis
            makeGrid({
                fields: null
            }, {
                matrix: {
                    leftAxis: [{
                        dataIndex: 'month',
                        header: 'Months'
                    }],
                    topAxis: [{
                        dataIndex: 'year',
                        header: 'Years'
                    }],
                    aggregate: [{
                        dataIndex: 'year',
                        header: 'Years',
                        aggregator: 'count'
                    }]
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = plugin.getConfigPanel(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    fieldsLeftCt = panel.getLeftAxisContainer(),
                    items;

                events.done = false;
                items = fieldsAggCt.items.items;
                panel.dragDropField(fieldsLeftCt, items[0], 'after');
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = plugin.getConfigPanel(),
                    fieldsLeftCt = panel.getLeftAxisContainer(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    items;

                items = fieldsLeftCt.items.items;
                expect(items.length).toBe(2);
                expect(items[0].getField().getHeader()).toBe('Months');
                expect(items[1].getField().getHeader()).toBe('Years');

                items = fieldsAggCt.items.items;
                expect(items.length).toBe(1);
                expect(items[0].getField().getHeader()).toBe('Years');
            });

        });

        it('should move a field from aggregate to top axis', function () {
            // dragging "year" from aggregate to left axis should move "year" from top to left axis
            makeGrid({
                fields: null
            }, {
                matrix: {
                    leftAxis: [{
                        dataIndex: 'month',
                        header: 'Months'
                    }],
                    topAxis: [],
                    aggregate: [{
                        dataIndex: 'year',
                        header: 'Years',
                        aggregator: 'count'
                    }]
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = plugin.getConfigPanel(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    fieldsTopCt = panel.getTopAxisContainer(),
                    items;

                events.done = false;
                items = fieldsAggCt.items.items;
                panel.dragDropField(fieldsTopCt, items[0], 'after');
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = plugin.getConfigPanel(),
                    fieldsTopCt = panel.getTopAxisContainer(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    items;

                items = fieldsTopCt.items.items;
                expect(items.length).toBe(1);
                expect(items[0].getField().getHeader()).toBe('Years');

                items = fieldsAggCt.items.items;
                expect(items.length).toBe(0);
            });

        });

        it('should use the custom defined aggregator on the configurator field', function () {
            // dragging "value" from all to aggregate should keep the defined aggregator function
            Ext.apply(Ext.pivot.Aggregators, {
                myFnText: 'My custom Fn',
                myFn: function() {
                    return 50;
                }
            });
            makeGrid({
                fields: [{
                    dataIndex:  'value',
                    header:     'Value',
                    aggregator: 'myFn'
                }]
            }, {
                matrix: {
                    leftAxis: [{
                        dataIndex: 'month',
                        header: 'Months'
                    }],
                    topAxis: [],
                    aggregate: []
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = plugin.getConfigPanel(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    fieldsAllCt = panel.getAllFieldsContainer(),
                    items;

                events.done = false;
                items = fieldsAllCt.items.items;
                panel.dragDropField(fieldsAggCt, items[0], 'after');
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = plugin.getConfigPanel(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    results = grid.getMatrix().results.items.items,
                    len = results.length,
                    items, field, i;

                items = fieldsAggCt.items.items;
                expect(items.length).toBe(1);
                field = items[0].getField();
                expect(field.getFieldText()).toBe('Value (My custom Fn)');
                expect(field.getAggregator()).toBe('myFn');
                for(i = 0; i < len; i++){
                    expect(results[i].getValue(field.getId())).toBe(50);
                }
            });

        });

    });

    describe('Destroying a pivot with configurator plugin attached', function() {
        var container, rendered;

        beforeEach(function() {
            container = Ext.create('Ext.container.Container', {
                renderTo: Ext.getBody(),
                height: 600,
                layout: 'fit',
                listeners: {
                    afterrender: function() {
                        rendered = true;
                    }
                },
                items: [{
                    xtype: 'tabpanel',
                    closable: true,
                    deferredRender: false,
                    items: [{
                        xtype: 'panel',
                        title: 'Tab 1',
                        closable: true,
                        layout: 'accordion',
                        items: [{
                            xtype: 'panel'
                        }, {
                            xtype: 'tabpanel',
                            deferredRender: false,
                            items: [{
                                xtype: 'pivotgrid',
                                title: 'Grid 1',
                                matrix: {
                                    type: 'local',
                                    leftAxis: [{
                                        dataIndex: 'a',
                                        direction: 'DESC',
                                        header: 'A'
                                    }],
                                    topAxis: [{
                                        dataIndex: 'd',
                                        direction: 'ASC',
                                        header: 'D'
                                    }],
                                    aggregate: [{
                                        dataIndex: 'e',
                                        header: 'E',
                                        aggregator: 'sum'
                                    }]
                                },
                                plugins: [{
                                    ptype: 'pivotconfigurator'
                                }]
                            }]
                        }]
                    }]
                }]
            });
        });

        afterEach(function() {
            container = Ext.destroy(container);
        });

        it('should not throw error when the tab is closed', function() {
            waitsFor(function() {
                return rendered;
            });

            runs(function() {
                var tab = container.down('tabpanel').getActiveTab();

                // fix for EXTJS-23587
                expect(function() {
                    tab.close();
                }).not.toThrow();
            });
        });
    });

});