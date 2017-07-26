topSuite("Ext.pivot.plugin.Exporter", ['Ext.pivot.Grid', 'Ext.exporter.*'], function() {
    var companies = ['Google', 'Apple', 'Dell', 'Microsoft', 'Adobe'],
        companiesLen = companies.length,
        persons = ['John', 'Michael', 'Mary', 'Anne', 'Robert'],
        personsLen = persons.length,
        years = 5,
        saveAs, saveBinaryAs, savePopup, ready, events, tableData;

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
                        date: new Date(2012 + (count % years), 0, 1),
                        value: count * 1000 + 30
                    });
                    ++count;
                }
            }
        }

        return data;
    }

    var store, grid, pivotDone, matrix,
        Sale = Ext.define(null, {
            extend: 'Ext.data.Model',

            fields: [
                {name: 'id',        type: 'int'},
                {name: 'company',   type: 'string'},
                {name: 'country',   type: 'string'},
                {name: 'person',    type: 'string'},
                {name: 'date',      type: 'date', defaultValue: new Date(2012, 0, 1)},
                {name: 'value',     type: 'float'},
                {name: 'quantity',  type: 'float'},
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
                }
            ]
        });

    function onEventFired(event){
        return function(){
            return new Ext.Promise(function(resolve, reject){
                events[event] = true;
                resolve();
            });
        }
    }

    function makeCmp(docCfg, gridCfg) {

        store = new Ext.data.Store({
            model: Sale,
            proxy: {
                type: 'memory',
                limitParam: null,
                data: makeData(),
                reader: {
                    type: 'json'
                }
            },
            autoLoad: true
        });

        // Reset flag that is set when the pivot grid has processed the data and rendered
        pivotDone = false;
        events = {};

        grid = new Ext.pivot.Grid(Ext.merge({
            title: 'Outline layout',
            collapsible: true,
            multiSelect: true,
            height: 350,
            width: 750,
            selModel: {
                type: 'rowmodel'
            },

            plugins: 'pivotexporter',

            // Set this to false if multiple dimensions are configured on leftAxis and
            // you want to automatically expand the row groups when calculations are ready.
            startRowGroupsCollapsed: false,

            listeners: {
                exportfinished: function() {
                    ready = true;
                }
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
                    header: 'Sum of value',
                    aggregator: 'sum',
                    width: 90,
                    exportStyle: [{
                        font: {
                            italic: true
                        }
                    }, {
                        type: 'html',
                        alignment: {
                            horizontal: 'Right'
                        }
                    }]
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
                }],

                //topAxis: [{
                //    id: 'country',
                //    dataIndex: 'country',
                //    header: 'Country'
                //}],

                listeners: {
                    done: function(){
                        pivotDone = true;
                        grid.saveDocumentAs(Ext.apply({
                            type: 'excel'
                        }, docCfg));
                    }
                }

            },
            renderTo: document.body
        }, gridCfg));

        // temporarily disable saveAs and saveBinaryAs
        savePopup = Ext.exporter.File.initializePopup;
        Ext.exporter.File.initializePopup = Ext.emptyFn;
        saveAs = Ext.exporter.File.saveAs;
        Ext.exporter.File.saveAs = onEventFired('saveAs');
        saveBinaryAs = Ext.exporter.File.saveBinaryAs;
        Ext.exporter.File.saveBinaryAs = onEventFired('saveBinaryAs');

    }

    function destroyCmp(){
        store = grid = matrix = events = tableData = Ext.destroy(grid, store);
        pivotDone = ready = false;
        Ext.exporter.File.saveAs = saveAs;
        Ext.exporter.File.saveBinaryAs = saveBinaryAs;
        Ext.exporter.File.initializePopup = savePopup;
    }


    describe('exportStyle', function() {
        afterEach(destroyCmp);

        it('should match config for csv exporter', function(){
            makeCmp({
                type: 'csv'
            },{
                listeners: {
                    dataready: function(cmp, params){
                        var table = params.exporter.getData(),
                            cols = table.getColumns();
                        tableData = table;
                        expect(cols.length).toBe(3);
                        expect(cols.getAt(2).getStyle()).toEqual({
                            font: {
                                italic: true
                            }
                        });
                    }
                }
            });

            waitsFor(function(){
                return ready;
            });

            runs(function(){
                expect(tableData.destroyed).toBe(true);
            });
        });

        it('should match config for tsv exporter', function(){
            makeCmp({
                type: 'tsv'
            },{
                listeners: {
                    dataready: function(cmp, params){
                        var table = params.exporter.getData(),
                            cols = table.getColumns();
                        tableData = table;
                        expect(cols.length).toBe(3);
                        expect(cols.getAt(2).getStyle()).toEqual({
                            font: {
                                italic: true
                            }
                        });
                    }
                }
            });

            waitsFor(function(){
                return ready;
            });

            runs(function(){
                expect(tableData.destroyed).toBe(true);
            });
        });

        it('should match config for html exporter', function(){
            makeCmp({
                type: 'html'
            },{
                listeners: {
                    dataready: function(cmp, params){
                        var table = params.exporter.getData(),
                            cols = table.getColumns();
                        tableData = table;
                        expect(cols.length).toBe(3);
                        expect(cols.getAt(2).getStyle()).toEqual({
                            type: 'html',
                            alignment:{
                                horizontal: 'Right'
                            }
                        });
                    }
                }
            });

            waitsFor(function(){
                return ready;
            });

            runs(function(){
                expect(tableData.destroyed).toBe(true);
            });
        });

        it('should match config for excel03 exporter', function(){
            makeCmp({
                type: 'excel03'
            },{
                listeners: {
                    dataready: function(cmp, params){
                        var table = params.exporter.getData(),
                            cols = table.getColumns();
                        tableData = table;
                        expect(cols.length).toBe(3);
                        expect(cols.getAt(2).getStyle()).toEqual({
                            font: {
                                italic: true
                            }
                        });
                    }
                }
            });

            waitsFor(function(){
                return ready;
            });

            runs(function(){
                expect(tableData.destroyed).toBe(true);
            });
        });

        it('should match config for excel07 exporter', function(){
            makeCmp({
                type: 'excel07'
            },{
                listeners: {
                    dataready: function(cmp, params){
                        var table = params.exporter.getData(),
                            cols = table.getColumns();
                        tableData = table;
                        expect(cols.length).toBe(3);
                        expect(cols.getAt(2).getStyle()).toEqual({
                            font: {
                                italic: true
                            }
                        });
                    }
                }
            });

            waitsFor(function(){
                return ready;
            });

            runs(function(){
                expect(tableData.destroyed).toBe(true);
            });
        });


    });

});