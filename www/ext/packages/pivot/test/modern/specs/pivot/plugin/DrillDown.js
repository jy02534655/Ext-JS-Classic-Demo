/* global Ext, jasmine, expect */

topSuite("Ext.pivot.plugin.DrillDown.modern",
    [false, 'Ext.pivot.Grid', 'Ext.pivot.plugin.*'],
    function() {
        var companies = ['Google', 'Apple', 'Dell', 'Microsoft', 'Adobe'],
            companiesLen = companies.length,
            persons = ['John', 'Michael', 'Mary', 'Anne', 'Robert'],
            personsLen = persons.length,
            years = 5;

        function isBlank (s) {
            return !s || s === '\xA0' || s === '&nbsp;';
        }
        function expectBlank (s) {
            if (!isBlank(s)) {
                expect(s).toBe('{BLANK}');
            }
        }

        function makeData() {
            var data = [],
                count = 1,
                i, j, k,
                company, person;

            for (i = 0; i < companiesLen; ++i) {
                company = companies[i];
                for (j = 0; j < personsLen; ++j) {
                    person = persons[j];
                    for (k = 1; k <= 20; ++k) {
                        data.push({
                            id: count,
                            company: company,
                            person: person,
                            date: new Date(2012 + (count % years), k, 1),
                            value: count * 1000 + 30
                        });
                        ++count;
                    }
                }
            }

            return data;
        }

        var store, grid, matrix, plugin,
            pivotEvents = {},
            Sale = Ext.define(null, {
                extend: 'Ext.data.Model',

                fields: [
                    {name: 'id',        type: 'int'},
                    {name: 'company',   type: 'string'},
                    {name: 'person',    type: 'string'},
                    {name: 'date',      type: 'date', defaultValue: new Date(2012, 0, 1)},
                    {name: 'value',     type: 'float'},
                    {
                        name: 'year',
                        convert: function(v, record) {
                            return record.get('date').getFullYear();
                        }
                    },{
                        name: 'month',
                        convert: function(v, record) {
                            return record.get('date').getMonth();
                        }
                    }]
            });

        function fireClick(target) {
            jasmine.fireMouseEvent(target, 'click');
        }

        function fireDblClick(target) {
            jasmine.fireMouseEvent(target, 'dblclick');
        }

        function getEventHandler(type){
            return function(){
                pivotEvents[type] = true;
            };
        }

        function checkRowCells(index, values) {
            var cells = grid.getItemAt(index).cells,
                len = values.length,
                html, i, cell;

            for(i = 0; i < len; i++){
                cell = cells[i].element.down('.x-pivot-grid-group-title', true) ||
                    cells[i].element.down('.x-body-el', true);

                html = cell.innerHTML;

                if (isBlank(values[i])) {
                    expectBlank(html);
                }
                else {
                    expect(html).toBe(values[i]);
                }
            }
        }

        function makeGrid(gridConfig, storeData) {
            storeData = storeData || makeData();

            store = new Ext.data.Store({
                model: Sale,
                proxy: {
                    type: 'memory',
                    limitParam: null,
                    data: storeData,
                    reader: {
                        type: 'json'
                    }
                },
                autoLoad: true
            });

            // Reset flag that is set when the pivot grid has processed the data and rendered
            pivotEvents = {};

            grid = new Ext.pivot.Grid(Ext.merge({
                title: 'Test pivot',
                collapsible: true,
                multiSelect: true,
                height: 350,
                width: 350,

                plugins: 'pivotdrilldown',

                listeners: {
                    pivotDone: getEventHandler('done'),
                    pivotGroupExpand: function(matrix, type){
                        if(type === 'row') {
                            pivotEvents.groupRowExpand = true;
                        }else{
                            pivotEvents.groupColExpand = true;
                        }
                    },
                    pivotGroupCollapse: function(matrix, type){
                        if(type === 'row') {
                            pivotEvents.groupRowCollapse = true;
                        }else{
                            pivotEvents.groupColCollapse = true;
                        }
                    },

                    showdrilldownpanel: getEventHandler('showdrilldownpanel'),
                    hidedrilldownpanel: getEventHandler('hidedrilldownpanel'),
                    pivotGroupCellDoubleTap: getEventHandler('groupCellDoubleTap')
                },

                matrix: {
                    type: 'local',
                    calculateAsExcel: false,
                    store: store,

                    // Set layout type to "outline". If this config is missing then the default layout is "outline"
                    viewLayoutType: 'outline',

                    // Configure the aggregate dimensions. Multiple dimensions are supported.
                    aggregate: [{
                        id: 'agg',
                        dataIndex: 'value',
                        header: 'Count of value',
                        aggregator: 'count',
                        width: 90
                    }],

                    // Configure the left axis dimensions that will be used to generate the grid rows
                    leftAxis: [{
                        id: 'person',
                        dataIndex: 'person',
                        header: 'Person',
                        width: 80
                    }, {
                        id: 'company',
                        dataIndex: 'company',
                        header: 'Company',
                        sortable: false,
                        width: 80
                    }]

                    /**
                     * Configure the top axis dimensions that will be used to generate the columns.
                     * When columns are generated the aggregate dimensions are also used. If multiple aggregation dimensions
                     * are defined then each top axis result will have in the end a column header with children
                     * columns for each aggregate dimension defined.
                     */
                    // topAxis: [{
                    //     id: 'year',
                    //     dataIndex: 'year',
                    //     header: 'Year'
                    // }, {
                    //     id: 'month',
                    //     dataIndex: 'month',
                    //     header: 'Month'
                    // }]
                },

                renderTo: document.body
            }, gridConfig));

            matrix = grid.getMatrix();
            plugin = grid.findPlugin('pivotdrilldown');
        }

        function destroyGrid(){
            Ext.destroy(grid, store);
            store = grid = matrix = plugin = null;
            pivotEvents = {};
        }

        function getCenter(el) {
            return Ext.fly(el).getXY();
        }

        function doTouch(method, idx, cellIdx, cfg) {
            runs(function() {
                cfg = cfg || {};

                var el = grid.getItemAt(idx).cells[cellIdx].element,
                    center = getCenter(el),
                    x = cfg.hasOwnProperty('x') ? cfg.x : center[0],
                    y = cfg.hasOwnProperty('y') ? cfg.y : center[1],
                    offsetX = cfg.hasOwnProperty('offsetX') ? cfg.offsetX : 0,
                    offsetY = cfg.hasOwnProperty('offsetY') ? cfg.offsetY : 0;

                Ext.testHelper[method](el, {
                    x: x + offsetX,
                    y: y + offsetY
                });
            });
        }

        function touchStart(idx, cellIdx, cfg) {
            doTouch('touchStart', idx, cellIdx, cfg);
        }

        function touchMove(idx, cellIdx, cfg) {
            doTouch('touchMove', idx, cellIdx, cfg);
        }

        function touchEnd(idx, cellIdx, cfg) {
            doTouch('touchEnd', idx, cellIdx, cfg);
        }

        function touchCancel(idx, cellIdx, cfg) {
            doTouch('touchCancel', idx, cellIdx, cfg);
        }

        function tap(idx, cellIdx, cfg) {
            doTouch('tap', idx, cellIdx, cfg);
        }

        afterEach(destroyGrid);

        describe('Events', function(){

            it('should fire DrillDown events', function(){
                makeGrid();

                waitsFor(function(){
                    // Also wait for data to appear in case it comes from a binding
                    return pivotEvents.done && store.getCount();
                }, 'pivot to be ready');

                runs(function(){
                    var col = grid.getHeaderContainer().getColumns().length - 1,
                        row = grid.getStore().getCount() - 1;

                    tap(row, col);
                    tap(row, col);
                });

                waitsFor(function(){
                    return pivotEvents.showdrilldownpanel;
                }, 'showdrilldownpanel event to be fired');

                runs(function() {
                    // no of pages should be 20
                    var pagingGrid = plugin.getPanel().down('grid'),
                        pagingPlugin = pagingGrid.findPlugin('pagingtoolbar');

                    // expect drilldown grid to be paginated
                    expect(pagingPlugin.getTotalCount()).toBe(500);
                    expect(pagingPlugin.getTotalPages()).toBe(20);
                    expect(pagingPlugin.getPageSize()).toBe(25);
                    expect(pagingGrid.getStore().getCount()).toBe(25);

                    // touchCancel(0, 3);
                    fireClick(plugin.getPanel().floatParentNode.getData().modalMask);
                });

                waitsFor(function(){
                    return pivotEvents.hidedrilldownpanel;
                }, 'hidedrilldownpanel event to be fired');

                runs(function () {
                    expect(pivotEvents.hidedrilldownpanel).toBe(true);
                });

            });

        });



    });
