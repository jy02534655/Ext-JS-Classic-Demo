/* global expect, Ext */

topSuite("Ext.pivot.plugin.Configurator", ['Ext.pivot.Grid'], function() {
    var store, plugin, grid, record, column, field, configuratorPanel,
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
                pivotDone: eventFired('done'),
                showConfigPanel: eventFired('shown')
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

        configuratorPanel = plugin.getPanel();
    }

    afterEach(function() {
        tearDown();
    });

    function tearDown() {
        store = plugin = grid = record = column = field = Ext.destroy(grid);
        events = {};
    }

    function hideConfigurator () {
        configuratorPanel.hide();

        waitsFor(function() {
            // return events.shown;
            return !configuratorPanel.activeAnimation;
        });
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
        it('should find it by type', function() {
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

            runs(function(){
                plugin.showConfigurator();
            });

            waitsFor(function() {
                return !configuratorPanel.activeAnimation;
            });

            runs(function() {
                var panel = plugin.getPanel(),
                    fieldsAllCt = panel.getAllFieldsContainer(),
                    fieldsLeftCt = panel.getLeftAxisContainer(),
                    fieldsTopCt = panel.getTopAxisContainer(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    items, field;

                items = fieldsAggCt.query('pivotconfigfield');
                expect(items.length).toBe(2);
                field = items[0].getField();
                expect(field.getHeader()).toBe('Total');
                expect(field.getAggregator()).toBe('sum');
                field = items[1].getField();
                expect(field.getHeader()).toBe('Count');
                expect(field.getAggregator()).toBe('count');

                items = fieldsAllCt.query('pivotconfigfield');
                expect(items.length).toBe(3);
                expect(items[0].getField().getHeader()).toBe('Person');
                expect(items[1].getField().getHeader()).toBe('Year');
                expect(items[2].getField().getHeader()).toBe('Value');

                items = fieldsLeftCt.query('pivotconfigfield');
                expect(items.length).toBe(1);
                field = items[0].getField();
                expect(field.getHeader()).toBe('Person');

                items = fieldsTopCt.query('pivotconfigfield');
                expect(items.length).toBe(1);
                field = items[0].getField();
                expect(field.getHeader()).toBe('Year');

                hideConfigurator();
            });
        });

        it('should extract the fields from the store', function () {
            makeGrid({ fields: null });

            waitsFor(function() {
                return events.done;
            });

            runs(function(){
                plugin.showConfigurator();
            });

            waitsFor(function() {
                return events.shown;
            });

            runs(function() {
                var panel = plugin.getPanel(),
                    fieldsAllCt = panel.getAllFieldsContainer(),
                    items;

                items = fieldsAllCt.query('pivotconfigfield');
                expect(items.length).toBe(store.model.getFields().length);

                hideConfigurator();
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

            runs(function(){
                plugin.showConfigurator();
            });

            waitsFor(function() {
                return !configuratorPanel.activeAnimation;
            });

            runs(function() {
                var panel = plugin.getPanel(),
                    fieldsAllCt = panel.getAllFieldsContainer(),
                    items;

                items = fieldsAllCt.query('pivotconfigfield');
                expect(items.length).toBe(store.model.getFields().length);
                expect(items[0].getField().getHeader()).toBe('Person');
                expect(items[1].getField().getHeader()).toBe('Year');
                expect(items[1].getField().getLabelRenderer()).toBe(yearRenderer);
                expect(items[2].getField().getHeader()).toBe('Month');
                expect(items[2].getField().getLabelRenderer()).toBe(monthRenderer);
                expect(items[3].getField().getHeader()).toBe('Value');
                expect(items[3].getField().getRenderer()).toBe(renderer);

                hideConfigurator();
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

            runs(function(){
                plugin.showConfigurator();
            });

            waitsFor(function() {
                return !configuratorPanel.activeAnimation;
            });

            runs(function() {
                var panel = plugin.getPanel(),
                    fieldsAllCt = panel.getAllFieldsContainer(),
                    fieldsTopCt = panel.getTopAxisContainer(),
                    items;

                events.done = false;
                items = fieldsTopCt.query('pivotconfigfield');
                panel.dragDropField(fieldsTopCt, fieldsAllCt, items[0].getRecord(), -1);

                // check if it was really removed from the list
                items = fieldsTopCt.query('pivotconfigfield');
                expect(items.length).toBe(0);

                panel.getController().applyConfiguration();

                hideConfigurator();
            });

            runs(function() {
                var panel = plugin.getPanel(),
                    fieldsAllCt = panel.getAllFieldsContainer(),
                    fieldsLeftCt = panel.getLeftAxisContainer(),
                    fieldsTopCt = panel.getTopAxisContainer(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    matrix = grid.getMatrix(),
                    items;

                items = fieldsAllCt.query('pivotconfigfield');
                expect(items.length).toBe(store.model.getFields().length);
                expect(items[0].getField().getHeader()).toBe('Person');
                expect(items[1].getField().getHeader()).toBe('Year');
                expect(items[1].getField().getLabelRenderer()).toBe(yearRenderer);
                expect(items[2].getField().getHeader()).toBe('Month');
                expect(items[2].getField().getLabelRenderer()).toBe(monthRenderer);
                expect(items[3].getField().getHeader()).toBe('Value');
                expect(items[3].getField().getRenderer()).toBe(renderer);

                items = fieldsTopCt.query('pivotconfigfield');
                expect(items.length).toBe(0);

                items = fieldsLeftCt.query('pivotconfigfield');
                expect(items.length).toBe(1);
                expect(items[0].getField().getHeader()).toBe('Months');
                expect(items[0].getField().getLabelRenderer()).toBe(monthRenderer);
                expect(matrix.leftAxis.dimensions.items[0].getLabelRenderer()).toBe(monthRenderer);

                items = fieldsAggCt.query('pivotconfigfield');
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

            runs(function(){
                plugin.showConfigurator();
            });

            waitsFor(function() {
                return !configuratorPanel.activeAnimation;
            });

            runs(function() {
                var panel = plugin.getPanel(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    fieldsLeftCt = panel.getLeftAxisContainer(),
                    items;

                events.done = false;
                items = fieldsAggCt.query('pivotconfigfield');
                panel.dragDropField(fieldsAggCt, fieldsLeftCt, items[0].getRecord(), -1);
                panel.getController().applyConfiguration();
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = plugin.getPanel(),
                    fieldsLeftCt = panel.getLeftAxisContainer(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    items;

                items = fieldsLeftCt.query('pivotconfigfield');
                expect(items.length).toBe(2);
                expect(items[0].getField().getHeader()).toBe('Months');
                expect(items[1].getField().getHeader()).toBe('Years');

                items = fieldsAggCt.query('pivotconfigfield');
                expect(items.length).toBe(1);
                expect(items[0].getField().getHeader()).toBe('Years');

                hideConfigurator();
            });
        });

        it('should move a field from aggregate to top axis', function () {
            // dragging "year" from aggregate to top axis should move "year" top axis
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

            runs(function(){
                plugin.showConfigurator();
            });

            waitsFor(function() {
                return !configuratorPanel.activeAnimation;
            });

            runs(function() {
                var panel = plugin.getPanel(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    fieldsTopCt = panel.getTopAxisContainer(),
                    items;

                events.done = false;
                items = fieldsAggCt.query('pivotconfigfield');
                panel.dragDropField(fieldsAggCt, fieldsTopCt, items[0].getRecord(), -1);
                panel.getController().applyConfiguration();
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = plugin.getPanel(),
                    fieldsTopCt = panel.getTopAxisContainer(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    items;

                items = fieldsTopCt.query('pivotconfigfield');
                expect(items.length).toBe(1);
                expect(items[0].getField().getHeader()).toBe('Years');

                items = fieldsAggCt.query('pivotconfigfield');
                expect(items.length).toBe(0);

                hideConfigurator();
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

            runs(function(){
                plugin.showConfigurator();
            });

            waitsFor(function() {
                return !configuratorPanel.activeAnimation;
            });

            runs(function() {
                var panel = plugin.getPanel(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    fieldsAllCt = panel.getAllFieldsContainer(),
                    items;

                events.done = false;
                items = fieldsAllCt.query('pivotconfigfield');
                panel.dragDropField(fieldsAllCt, fieldsAggCt, items[0].getRecord(), -1);
                panel.getController().applyConfiguration();
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = plugin.getPanel(),
                    fieldsAggCt = panel.getAggregateContainer(),
                    results = grid.getMatrix().results.items.items,
                    len = results.length,
                    items, field, i;

                items = fieldsAggCt.query('pivotconfigfield');
                expect(items.length).toBe(1);
                field = items[0].getField();
                expect(field.getFieldText()).toBe('Value (My custom Fn)');
                expect(field.getAggregator()).toBe('myFn');
                for(i = 0; i < len; i++){
                    expect(results[i].getValue(field.getId())).toBe(50);
                }

                hideConfigurator();
            });
        });
    });
});
