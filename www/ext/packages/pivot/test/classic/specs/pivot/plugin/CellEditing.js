/* global expect, Ext */

topSuite("Ext.pivot.plugin.CellEditing",
    ['Ext.pivot.Grid', 'Ext.pivot.plugin.*', 'Ext.form.field.Number'],
function() {
    var store, plugin, pluginC, grid, record, column, field,
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
                {name: 'value',     type: 'float', allowNull: true}
            ],
            data: [
                { person: 'Lisa', year: 2012, value: 10 },
                { person: 'John', year: 2012, value: 10 },
                { person: 'Mary', year: 2012, value: 10 },
                { person: 'Lisa', year: 2013, value: 10 },
                { person: 'John', year: 2013, value: 10 },
                { person: 'Mary', year: 2013, value: 10 },
                { person: 'Mary', year: 2014, value: 10 }
            ],
            autoDestroy: true
        });

        plugin = new Ext.pivot.plugin.CellEditing(pluginCfg);
        pluginC = new Ext.pivot.plugin.Configurator();

        grid = new Ext.pivot.Grid(Ext.merge({
            renderTo: Ext.getBody(),
            selModel: 'cellmodel',
            width: 500,
            height: 400,

            plugins: [plugin, pluginC],

            listeners: {
                pivotDone: eventFired('done'),
                pivotBeforeUpdate: eventFired('beforeupdate'),
                pivotUpdate: eventFired('update')
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

    function startEdit(recId, colId) {
        record = grid.store.getAt(recId || 0);
        column = grid.getColumns()[colId || 1];
        plugin.startEdit(record, column);
        field = column.field;
    }

    function triggerEditorKey(target, key) {
        // Ext.supports.SpecialKeyDownRepeat changes the event Ext.form.field.Base listens for!
        jasmine.fireKeyEvent(target, Ext.supports.SpecialKeyDownRepeat ? 'keydown' : 'keypress', key);
    }

    beforeEach(function() {
    });

    afterEach(function() {

        tearDown();
    });

    function tearDown() {
        store = plugin = pluginC = grid = record = column = field = Ext.destroy(grid);
        events = {};
    }

    describe('finding the cell editing plugin in a pivot grid', function() {
        beforeEach(function() {
            makeGrid({pluginId:'test-cell-editing'});
        });

        it('should find it by id', function() {
            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                expect(grid.getPlugin('test-cell-editing')).toBe(plugin);
            });
        });
        it('should find it by ptype', function() {
            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                expect(grid.findPlugin('pivotcellediting')).toBe(plugin);
            });
        });
    });

    describe('events', function () {
        var editorContext, ed;

        afterEach(function () {
            editorContext = ed = null;
        });

        describe('beforeedit', function () {

            it('should retain changes to the editing context in the event handler', function () {
                makeGrid({
                    listeners: {
                        beforeedit: function (editor, context) {
                            context.value = -10;
                            editorContext = context;
                        }
                    }
                });

                waitsFor(function() {
                    return events.done;
                });

                runs(function() {
                    startEdit();

                    expect(editorContext.value).toBe(-10);
                });
            });

            it('should have a default value in the editing context', function () {
                makeGrid({
                    defaultUpdater: 'overwrite',
                    defaultValue: 10,
                    listeners: {
                        beforeedit: function (editor, context) {
                            editorContext = context;
                        }
                    }
                });

                waitsFor(function() {
                    return events.done;
                });

                runs(function() {
                    startEdit(3);
                    expect(editorContext.value).toBe(10);
                });
            });

        });

        it('should fire "pivotbeforeupdate"', function () {
            makeGrid({
                defaultUpdater: 'overwrite',
                defaultValue: 1
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                startEdit(3);
                ed = plugin.activeEditor;
                triggerEditorKey(plugin.activeEditor.field.inputEl, 13);
            });
            waitsFor(function() {
                return events.beforeupdate;
            });
        });

        it('should fire "pivotupdate"', function () {
            makeGrid({
                defaultUpdater: 'overwrite',
                defaultValue: 1
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                startEdit(3);
                ed = plugin.activeEditor;
                triggerEditorKey(plugin.activeEditor.field.inputEl, 13);

                waitsFor(function() {
                    return events.update;
                });
            });
        });

    });

    describe('editor value', function(){
        var updated = false,
            ed;

        afterEach(function () {
            ed = null;
            updated = false;
        });

        it('should be applied correctly to store records when type is "overwrite"', function () {
            makeGrid({
                defaultUpdater: 'overwrite'
            },{
                matrix: {
                    listeners: {
                        afterupdate: function () {
                            updated = true;
                        }
                    }
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {

                startEdit(3);
                ed = plugin.activeEditor;
                ed.setValue(5);
                //press enter
                triggerEditorKey(ed.field.inputEl, 13);

                waitsFor(function() {
                    return updated;
                });

                runs(function(){
                    expect(grid.store.getAt(3).get('c1')).toBe(15);
                });
            });
        });

        it('should be applied correctly to store records when type is "overwrite" and empty value', function () {
            makeGrid({
                defaultUpdater: 'overwrite'
            },{
                matrix: {
                    listeners: {
                        afterupdate: function () {
                            updated = true;
                        }
                    }
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {

                startEdit(3);
                ed = plugin.activeEditor;
                ed.setValue('');
                //press enter
                triggerEditorKey(ed.field.inputEl, 13);

                waitsFor(function() {
                    return updated;
                });

                runs(function(){
                    expect(grid.store.getAt(3).get('c1')).toBe(0);
                });
            });
        });

        it('should be applied correctly to store records when type is "overwrite" and empty value and excel like', function () {
            makeGrid({
                defaultUpdater: 'overwrite'
            },{
                matrix: {
                    calculateAsExcel: true,
                    listeners: {
                        afterupdate: function () {
                            updated = true;
                        }
                    }
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {

                startEdit(3);
                ed = plugin.activeEditor;
                ed.setValue('');
                //press enter
                triggerEditorKey(ed.field.inputEl, 13);

                waitsFor(function() {
                    return updated;
                });

                runs(function(){
                    expect(grid.store.getAt(3).get('c1')).toBeNull();
                });
            });
        });

        it('should be applied correctly to store records when type is "increment"', function () {
            makeGrid({
                defaultUpdater: 'increment'
            },{
                matrix: {
                    listeners: {
                        afterupdate: function () {
                            updated = true;
                        }
                    }
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                startEdit(3);
                ed = plugin.activeEditor;
                ed.setValue(5);
                //press enter
                triggerEditorKey(ed.field.inputEl, 13);

                waitsFor(function() {
                    return updated;
                });

                runs(function(){
                    expect(grid.store.getAt(3).get('c1')).toBe(45);
                });
            });
        });

        it('should be applied correctly to store records when type is "percentage"', function () {
            makeGrid({
                defaultUpdater: 'percentage'
            },{
                matrix: {
                    listeners: {
                        afterupdate: function () {
                            updated = true;
                        }
                    }
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                startEdit(3);
                ed = plugin.activeEditor;
                ed.setValue(150);
                //press enter
                triggerEditorKey(ed.field.inputEl, 13);

                waitsFor(function() {
                    return updated;
                });

                runs(function(){
                    expect(grid.store.getAt(3).get('c1')).toBe(45);
                });
            });
        });

        it('should be applied correctly to store records when type is "uniform"', function () {
            makeGrid({
                defaultUpdater: 'uniform'
            },{
                matrix: {
                    listeners: {
                        afterupdate: function () {
                            updated = true;
                        }
                    }
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                startEdit(3);
                ed = plugin.activeEditor;
                ed.setValue(60);
                //press enter
                triggerEditorKey(ed.field.inputEl, 13);

                waitsFor(function() {
                    return updated;
                });

                runs(function(){
                    expect(grid.store.getAt(3).get('c1')).toBe(60);
                });
            });
        });

        it('should be applied correctly to store records when type is "uniform", empty value', function () {
            makeGrid({
                defaultUpdater: 'uniform'
            },{
                matrix: {
                    listeners: {
                        afterupdate: function () {
                            updated = true;
                        }
                    }
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                startEdit(3);
                ed = plugin.activeEditor;
                ed.setValue('');
                //press enter
                triggerEditorKey(ed.field.inputEl, 13);

                waitsFor(function() {
                    return updated;
                });

                runs(function(){
                    expect(grid.store.getAt(3).get('c1')).toBe(0);
                });
            });
        });

        it('should be applied correctly to store records when type is "uniform", empty value, excel like', function () {
            makeGrid({
                defaultUpdater: 'uniform'
            },{
                matrix: {
                    calculateAsExcel: true,
                    listeners: {
                        afterupdate: function () {
                            updated = true;
                        }
                    }
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                startEdit(3);
                ed = plugin.activeEditor;
                ed.setValue('');
                //press enter
                triggerEditorKey(ed.field.inputEl, 13);

                waitsFor(function() {
                    return updated;
                });

                runs(function(){
                    expect(grid.store.getAt(3).get('c1')).toBeNull();
                });
            });
        });

        it('should be able to edit after reconfiguring the grid with the Configurator plugin', function () {
            makeGrid({
                defaultUpdater: 'uniform'
            },{
                matrix: {
                    listeners: {
                        afterupdate: function () {
                            updated = true;
                        }
                    }
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                var panel = pluginC.getConfigPanel(),
                    fieldsAllCt = panel.getAllFieldsContainer(),
                    fieldsLeftCt = panel.getLeftAxisContainer(),
                    items;

                events.done = false;
                items = fieldsLeftCt.items.items;
                panel.dragDropField(fieldsAllCt, items[0], 'after');
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                startEdit(0);
                ed = plugin.activeEditor;
                ed.setValue(60);
                //press enter
                triggerEditorKey(ed.field.inputEl, 13);

                waitsFor(function() {
                    return updated;
                });

                runs(function(){
                    expect(grid.store.getAt(0).get('c2')).toBe(60);
                });
            });

        });

    });

    describe('navigation', function(){
        var updated = false,
            ed;

        afterEach(function () {
            ed = null;
            updated = false;
        });

        it('should navigate using tabs without errors', function () {
            makeGrid({
                defaultUpdater: 'overwrite'
            },{
                listeners: {
                    afterupdate: function () {
                        updated = true;
                    }
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                //debugger;
                startEdit(1);
                ed = plugin.activeEditor;
                ed.setValue(5);

                expect(function(){
                    //press tab
                    triggerEditorKey(plugin.activeEditor.field.inputEl, 9);
                    triggerEditorKey(plugin.activeEditor.field.inputEl, 9);
                    triggerEditorKey(plugin.activeEditor.field.inputEl, 9);
                    triggerEditorKey(plugin.activeEditor.field.inputEl, 9);
                    return 4;
                }()).toBe(4); // if error is thrown during tab navigation then this test fails

            });
        });

        it('should not open the editor when there\'s no value', function(){
            makeGrid({
                defaultUpdater: 'overwrite'
            },{
                listeners: {
                    afterupdate: function () {
                        updated = true;
                    }
                }
            });

            waitsFor(function() {
                return events.done;
            });

            runs(function() {
                startEdit(0, 2);
                expect(plugin.activeEditor).not.toBe(null);
                startEdit(0, 3);
                expect(plugin.activeEditor).toBe(null);
            });
        });


    });


});