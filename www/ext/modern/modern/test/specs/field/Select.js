topSuite("Ext.field.Select", ['Ext.data.ArrayStore', 'Ext.viewport.Default', 'Ext.app.ViewModel'], function() {
    var field, 
        viewport,
        store,
        createField = function(config) {
            if (field) {
                field.destroy();
            }

            field = Ext.create('Ext.field.Select', Ext.apply({
                // Tests use the floated version
                picker: 'floated'
            }, config));
        },
        synchronousLoad = true,
        proxyStoreLoad = Ext.data.ProxyStore.prototype.load,
        loadStore;

    beforeEach(function() {
        // Override so that we can control asynchronous loading
        loadStore = Ext.data.ProxyStore.prototype.load = function() {
            proxyStoreLoad.apply(this, arguments);
            if (synchronousLoad) {
                this.flushLoad.apply(this, arguments);
            }
            return this;
        };
    });

    afterEach(function() {
        var toDestroy = [ Ext.Viewport ];

        // Undo the overrides.
        Ext.data.ProxyStore.prototype.load = proxyStoreLoad;

        if (field) {
            toDestroy.push(field);
        }
        if (store) {
            toDestroy.push(store);
        }
        if (viewport && viewport !== Ext.Viewport) {
            toDestroy.push(viewport);
        }
        viewport = Ext.Viewport = Ext.destroy(toDestroy);
    });

    describe("configurations", function() {
        describe('clearable', function () {
            it('should respond properly to the clear trigger', function () {
                createField({
                    clearable: true,
                    options: [
                        { text: 'One', value: 1 },
                        { text: 'Two', value: 2 },
                        { text: 'Three', value: 3 }
                    ]
                });
                field.render(Ext.getBody());

                var trigger = field.getTriggers().clear;

                field.setValue(2);

                var v = field.getInputValue();
                var vc = field.getValueCollection();

                expect(v).toBe('Two');
                expect(trigger.isVisible()).toBe(true);
                expect(vc.length).toBe(1);

                field.onClearIconTap();

                v = field.getValue();

                expect(v).toBe(null);
                expect(trigger.isVisible()).toBe(false);

                expect(vc.length).toBe(0);
            });
        });

        describe('Checking required field value', function() {
            it('should be valid when it has a value selected', function() {
                createField({
                    required: false,
                    renderTo: document.body,
                    autoSelect: false,
                    options: [
                        { text: 'One', value: 1 },
                        { text: 'Two', value: 2 },
                        { text: 'Three', value: 3 }
                    ]
                });
                expect(field.isValid()).toBe(true);

                field.setRequired(true);

                expect(field.isValid()).toBe(false);

                field.setValue(1);

                expect(field.isValid()).toBe(true);
            });
        });

        describe("options", function() {
            beforeEach(function() {
                createField({
                    options: [
                        {text: 'One', value: 1},
                        {text: 'Two', value: 2},
                        {text: 'Three', value: 3}
                    ]
                });
            });

            it("should create a store with 3 items", function() {
                expect(field.getStore().getCount()).toEqual(3);
            });

            it("should set the value configuration to the first item", function() {
                expect(field.getSelection()).toEqual(field.getStore().getAt(0));
            });

            describe("with value", function() {
                beforeEach(function() {
                    createField({
                        value: 3,
                        options: [
                            {text: 'One', value: 1},
                            {text: 'Two', value: 2},
                            {text: 'Three', value: 3}
                        ]
                    });
                });

                it("should create a store with 3 items", function() {
                    expect(field.getStore().getCount()).toEqual(3);
                });

                it("should set the value configuration to the third item", function() {
                    expect(field.getSelection()).toEqual(field.getStore().getAt(2));
                    expect(field.getSelection().get('value')).toEqual(3);
                    expect(field.getSelection().get('text')).toEqual('Three');
                    expect(field.getValue()).toEqual(3);
                });
            });
        });

        describe("store", function() {
            beforeEach(function() {
                createField({
                    store: {
                        fields: ['text', 'value'],
                        data: [
                            {text: 'One', value: 1},
                            {text: 'Two', value: 2},
                            {text: 'Three', value: 3}
                        ]
                    }
                });
            });

            it("should create a store with 3 items", function() {
                expect(field.getStore().getCount()).toEqual(3);
            });

            describe("with value", function() {
                beforeEach(function() {
                    createField({
                        value: 3,
                        store: {
                            fields: ['text', 'value'],
                            data: [
                                {text: 'One', value: 1},
                                {text: 'Two', value: 2},
                                {text: 'Three', value: 3}
                            ]
                        }
                    });
                });

                it("should create a store with 3 items", function() {
                    expect(field.getStore().getCount()).toEqual(3);
                });

                it("should set the value configuration to the third item", function() {
                    expect(field.getSelection()).toEqual(field.getStore().getAt(2));
                    expect(field.getSelection().get('value')).toEqual(3);
                    expect(field.getSelection().get('text')).toEqual('Three');
                    expect(field.getValue()).toEqual(3);
                });
            });
        });

        describe("value", function() {
            describe("0", function() {
                beforeEach(function() {
                    createField({
                        value: 0,
                        options: [
                            {text: 'One', value: 0},
                            {text: 'Two', value: 1},
                            {text: 'Three', value: 2}
                        ]
                    });
                });

                it("should set the value after adding options", function() {
                    expect(field.getValue()).toEqual(0);
                });
            });

            describe("1", function() {
                beforeEach(function() {
                    createField({
                        value: 1,
                        options: [
                            {text: 'One', value: 0},
                            {text: 'Two', value: 1},
                            {text: 'Three', value: 2}
                        ]
                    });
                });

                it("should set the value after adding options", function() {
                    expect(field.getValue()).toEqual(1);
                });
            });

            describe("false", function() {
                beforeEach(function() {
                    createField({
                        value: false,
                        options: [
                            {text: 'One', value: false},
                            {text: 'Two', value: 1},
                            {text: 'Three', value: 2}
                        ]
                    });
                });

                it("should set the value after adding options", function() {
                    expect(field.getValue()).toEqual(false);
                });
            });

            describe("default value", function() {
                describe("none", function() {
                    beforeEach(function() {
                        createField();
                    });

                    it("should set the value after adding options", function() {
                        expect(field.getValue()).toEqual(null);

                        field.setStore({
                            fields: ['text', 'value'],
                            data: [
                                {text: 'One', value: 1},
                                {text: 'Two', value: 2},
                                {text: 'Three', value: 3}
                            ]
                        });

                        //autoSelect
                        expect(field.getValue()).toEqual(1);
                    });
                });

                describe("value", function() {
                    beforeEach(function() {
                        createField({
                            value: 3
                        });
                    });

                    it("should set the value after adding options", function() {
                        expect(field.getValue()).toEqual(null);

                        field.setStore({
                            fields: ['text', 'value'],
                            data: [
                                {text: 'One', value: 1},
                                {text: 'Two', value: 2},
                                {text: 'Three', value: 3}
                            ]
                        });

                        expect(field.getValue()).toEqual(3);
                    });
                });

                describe("setValue", function() {
                    describe("with value and store", function() {
                        beforeEach(function() {
                            createField({
                                value: 3,
                                store: {
                                    fields: ['text', 'value'],
                                    data: [
                                        {text: 'One', value: 1},
                                        {text: 'Two', value: 2},
                                        {text: 'Three', value: 3}
                                    ]
                                }
                            });
                        });

                        it("should set to null", function() {
                            expect(field.getValue()).toEqual(3);
                            field.setValue(null);
                            expect(field.getValue()).toEqual(null);
                        });
                    });

                    describe("with no value", function() {
                        beforeEach(function() {
                            createField();
                        });

                        it("should set to null", function() {
                            expect(field.getValue()).toEqual(null);
                            field.setStore({
                                fields: ['text', 'value'],
                                data: [
                                    {text: 'One', value: 1},
                                    {text: 'Two', value: 2},
                                    {text: 'Three', value: 3}
                                ]
                            });
                            expect(field.getValue()).toEqual(1);
                            field.setValue(null);
                            expect(field.getValue()).toEqual(null);
                        });
                    });

                    describe("with value and late store", function(){
                        beforeEach(function() {
                            createField();
                        });

                        it("should wait to set value until store is set", function() {
                            expect(field.getValue()).toEqual(null);
                            field.setValue(2);
                            expect(field.getValue()).toEqual(null);
                            field.setStore({
                                fields: ['text', 'value'],
                                data: [
                                    {text: 'One', value: 1},
                                    {text: 'Two', value: 2},
                                    {text: 'Three', value: 3}
                                ]
                            });
                            expect(field.getValue()).toEqual(2);
                            field.setValue(null);
                            expect(field.getValue()).toEqual(null);
                        });
                    });

                    describe("with 0 value and late store", function(){
                        beforeEach(function() {
                            createField();
                        });

                        it("should wait to set value until store is set", function() {
                            expect(field.getValue()).toEqual(null);
                            field.setValue(0);
                            expect(field.getValue()).toEqual(null);
                            field.setStore({
                                fields: ['text', 'value'],
                                data: [
                                    {text: 'One', value: 1},
                                    {text: 'Two', value: 0},
                                    {text: 'Three', value: 3}
                                ]
                            });
                            expect(field.getValue()).toEqual(0);
                            field.setValue(null);
                            expect(field.getValue()).toEqual(null);
                        });
                    });

                    describe("with false value and late store", function(){
                        beforeEach(function() {
                            createField();
                        });

                        it("should wait to set value until store is set", function() {
                            expect(field.getValue()).toEqual(null);
                            field.setValue(false);
                            expect(field.getValue()).toEqual(null);
                            field.setStore({
                                fields: ['text', 'value'],
                                data: [
                                    {text: 'One', value: 1},
                                    {text: 'Two', value: false},
                                    {text: 'Three', value: 3}
                                ]
                            });
                            expect(field.getValue()).toEqual(false);
                            field.setValue(null);
                            expect(field.getValue()).toEqual(null);
                        });
                    });
                });
            });
        });

        describe("autoSelect", function() {
            describe("when on", function() {
                beforeEach(function() {
                    createField({
                        store: {
                            fields: ['text', 'value'],
                            data: [
                                {text: 'One', value: 1},
                                {text: 'Two', value: 2},
                                {text: 'Three', value: 3}
                            ]
                        }
                    });
                });

                it("should set the value configuration to the first item", function() {
                    expect(field.getSelection()).toEqual(field.getStore().getAt(0));
                });
            });

            describe("when off", function() {
                beforeEach(function() {
                    createField({
                        autoSelect: false,
                        store: {
                            fields: ['text', 'value'],
                            data: [
                                {text: 'One', value: 1},
                                {text: 'Two', value: 2},
                                {text: 'Three', value: 3}
                            ]
                        }
                    });
                });

                it("should set the value to null", function() {
                    expect(field.getSelection()).toEqual(null);
                });
            });
        });
    });

    describe("TOUCH-2431", function() {
        it("should use store configuration", function() {
            Ext.define('Ext.MySelect', {
                extend: 'Ext.field.Select',

                config: {
                    store: {
                        fields: ['name', 'value'],
                        data: [
                            {
                                name: 'one',
                                value: 1
                            },
                            {
                                name: 'two',
                                value: 2
                            }
                        ]
                    }
                }
            });

            var select = Ext.create('Ext.MySelect');
            expect(select.getStore().getCount()).toEqual(2);
            
            select.destroy();
        });
    });

    describe("events", function() {
        describe("change", function() {
            describe("without options", function() {
                beforeEach(function() {
                    createField();
                });

                it("should only fire change once when adding options", function() {
                    var spy = jasmine.createSpy();

                    field.on('change', spy);

                    field.setOptions([
                        {text: 'One', value: 1},
                        {text: 'Two', value: 2},
                        {text: 'Three', value: 3}
                    ]);

                    expect(spy.callCount).toBe(1);
                });
            });

            describe("with options", function() {
                beforeEach(function() {
                    createField({
                        options: [
                            {text: 'One', value: 1},
                            {text: 'Two', value: 2},
                            {text: 'Three', value: 3}
                        ]
                    });
                });

                it("should fire when you change the value", function() {
                    var spy = jasmine.createSpy();

                    field.on('change', spy);

                    field.setValue(2);

                    expect(spy.callCount).toBe(1);
                });

                it("should not fire when you dont change the value", function() {
                    var spy = jasmine.createSpy();

                    field.on('change', spy);

                    field.setValue(1);

                    expect(spy).not.toHaveBeenCalled();
                });
            });
        });
    });

    describe("methods", function() {
        describe("reset", function() {
            describe("when autoSelect is on", function() {
                beforeEach(function() {
                    createField({
                        store : {
                            fields : ['text', 'value'],
                            data   : [
                                { text : 'One',   value : 1 },
                                { text : 'Two',   value : 2 },
                                { text : 'Three', value : 3 }
                            ]
                        }
                    });

                    field.setValue(3);
                });

                it("should set the value configuration to the first item", function() {
                    field.reset();

                    expect(field.getSelection()).toBe(field.getStore().getAt(0));
                });
            });

            describe("when autoSelect is off", function() {
                beforeEach(function() {
                    createField({
                        autoSelect : false,
                        store      : {
                            fields  : ['text', 'value'],
                            data    : [
                                { text : 'One',   value : 1 },
                                { text : 'Two',   value : 2 },
                                { text : 'Three', value : 3 }
                            ]
                        }
                    });

                    field.setValue(3);
                });

                it("should set the value to null", function() {
                    field.reset();

                    expect(field.getSelection()).toBe(null);
                });
            });
        });

        describe("showPicker", function() {
            beforeEach(function() {
                viewport = Ext.Viewport = new Ext.viewport.Default();

                createField({
                    picker: 'floated',
                    store: {
                        fields: ['text', 'value'],
                        data: (function() {
                            var data = [], i;
                            for(i=0; i<100; i++) {
                                data.push({text: i, value: i});
                            }
                            return data;
                        })()
                    }
                });

                viewport.add(field);
            });

            it("should scroll to initial value", function() {
                var scrollComplete = false,
                    resizeSpy = spyOn(field, 'realignFloatedPicker').andCallThrough(),
                    item, scroller, scrollHeight, scrollMin, scrollMax,
                    offset, picker, list;

                field.setValue(45);
                field.showPicker();
                
                picker = field.getPicker();
                list = picker;
                scroller = list.getScrollable();

                scroller.on('scrollend', function() {
                    scrollComplete = true;
                }); 

                waitsFor(function() {
                    return scrollComplete;
                }, 'slot to scroll selection into view', 800);
                
                waitsForSpy(resizeSpy);

                runs(function() {
                    item = list.getItemAt(45);
                    scrollHeight = picker.element.getHeight();
                    scrollMin = scroller.getPosition().y;                    
                    scrollMax = scrollMin+scrollHeight;
                    offset = item.renderElement.dom.offsetTop;
                });
            });

            it("should scroll to selected value", function() {
                var scrollEndSpy,
                    scrollSpy = spyOn(field, 'setPickerLocation').andCallThrough(),
                    item, scroller, scrollHeight, scrollMin, scrollMax,
                    offset, picker, list;

                field.showPicker();
                picker = field.getPicker();
                picker.refresh();
                list = picker;
                scroller = list.getScrollable();
                scrollEndSpy = spyOnEvent(scroller, 'scrollend');

                field.setValue(78);

                waitsForSpy(scrollSpy, 'slot to scroll selection into view', 800);
                runs(function() {
                    item = list.getItemAt(78);
                    scrollHeight = picker.element.getHeight();
                    scrollMin = scroller.getPosition().y;                    
                    scrollMax = scrollMin+scrollHeight;
                    offset = item.renderElement.dom.offsetTop;

                    expect(scrollSpy).toHaveBeenCalled();
                    // should be between the current scroll position and max height of scrollable area
                    expect(offset >= scrollMin && offset <= scrollMax).toBeTruthy();
                });
            });
        });

        describe('should edge picker', function () {
            beforeEach(function() {
                viewport = Ext.Viewport = new Ext.viewport.Default();

                createField({
                    picker: 'edge',
                    store: {
                        fields: ['text', 'value'],
                        data: (function() {
                            var data = [], i;
                            for(i=0; i<100; i++) {
                                data.push({text: i, value: i});
                            }
                            return data;
                        })()
                    }
                });
            });

            it('should open edge picker', function () {
                field.showPicker();

                var picker = field.getPicker();

                expect(picker.rendered).toBeTruthy();
                expect(field.pickerType).toBe('edge');
            });
        });
    });

    describe('With valueField: null', function() {
        it('should be able to have a value set though binding the selection', function() {
            store = Ext.create('Ext.data.Store');
            for (var i = 0; i < 10; ++i) {
                store.add({ title: 'item-' + i });
            }

            viewport = Ext.Viewport = new Ext.viewport.Default();
            var container = Ext.Viewport.add({
                xtype: 'container',
                viewModel: {
                    data: {
                        the_store: null,
                        the_selection: null
                    }
                },

                items: [{
                    // NO store + initial selection -> exception
                    itemId: 'selectfield-1',
                    xtype: 'selectfield',
                    displayField: 'title',
                    valueField: null,
                    selection: store.first()
                }, {
                    // store + initial selection -> fail
                    // selected item should be first one
                    itemId: 'selectfield-2',
                    xtype: 'selectfield',
                    displayField: 'title',
                    valueField: null,
                    selection: store.getAt(1),
                    store: store
                }, {
                    // Bindings doesn't work
                    itemId: 'selectfield-3',
                    xtype: 'selectfield',
                    displayField: 'title',
                    valueField: null,
                    bind: {
                        selection: '{the_selection}',
                        store: '{the_store}'
                    }
                }]
            }),
            s1 = container.down('#selectfield-1'),
            s2 = container.down('#selectfield-2'),
            s3 = container.down('#selectfield-3');

            // Value comes from selection, so first two have values
            // the valueField defaults to the displayField so that a field value
            // is always published.
            expect(s1.getValue()).toBe('item-0');
            expect(s2.getValue()).toBe('item-1');
            expect(s3.getValue()).toBe(null);

            // The selection of the first two are set
            // The last one will only arrive when the bound data
            // arrives later.
            expect(s1.getSelection()).toBe(store.first());
            expect(s2.getSelection()).toBe(store.getAt(1));
            expect(s3.getSelection()).toBe(null);

            // Set the store which will propagate into the select fields
            // and the selection which will propagate into s3
            container.getViewModel().set({
                the_selection: store.getAt(2),
                the_store: store
            });

            // The arrival of the store on the next bind tick should
            // set the values of the fields and the selection of s3.
            waitsFor(function() {
                return s1.inputElement.dom.value === 'item-0'
                    && s2.inputElement.dom.value === 'item-1'
                    && s3.inputElement.dom.value === 'item-2'
                    && s3.getSelection() === store.getAt(2);
            });
        });
    });
    
    describe("pointer interaction", function() {
        var picker, item;
        
        beforeEach(function() {
            createField({
                renderTo: Ext.getBody(),
                options: [
                    { text: 'One', value: 1 },
                    { text: 'Two', value: 2 },
                    { text: 'Three', value: 3 }
                ]
            });
        });
        
        afterEach(function() {
            picker = item = null;
        });
        
        it("should select value when item is clicked", function() {
            field.expand();
            
            picker = field.getPicker();
            picker.refresh();
            item = picker.getViewItems()[1];
            
            jasmine.fireMouseEvent(item.el, 'click');
            
            expect(field.getValue()).toBe(2);
        });
    });

    describe("binding", function() {
        var CBTestModel = Ext.define(null, {
                extend: 'Ext.data.Model',
                fields: [
                    {type: 'string', name: 'text'},
                    {type: 'string', name: 'value'}
                ]
            }),
            preventStore, viewModel, spy;

        beforeEach(function() {
            spy = jasmine.createSpy();
            viewModel = new Ext.app.ViewModel();

            Ext.define('spec.MyStore',{
                extend : 'Ext.data.Store',
                alias : 'store.foo',
                proxy: {
                    type: 'memory'
                },
                model: CBTestModel,
                data: [
                    {id: 1, text: 'text 1', value: 'value 1'},
                    {id: 2, text: 'text 2', value: 'value 2'},
                    {id: 3, text: 'text 3', value: 'value 3'},
                    {id: 4, text: 'text 31', value: 'value 31'},
                    {id: 5, text: 'text 32', value: 'value 32'},
                    {id: 6, text: 'text 33', value: 'value 33'},
                    {id: 7, text: 'text 34', value: 'value 34'},
                    {id: 8, text: 'Foo', value: 'foo1'},
                    {id: 9, text: 'Foo', value: 'foo2'}
                ]
            });
            store = new spec.MyStore();
        });

        afterEach(function() {
            Ext.undefine('spec.MyStore');
            spy = viewModel = null;
        });

        function makeViewModelSelectField(cfg) {
            var config = Ext.apply({
                width: 200,
                name: 'test',
                store: preventStore ? null : store,
                picker: 'floated',
                displayField: 'text',
                valueField: 'value',
                viewModel: viewModel,
                renderTo: Ext.getBody()
            }, cfg);
            field = new Ext.field.Select(config);
        }

        describe("view model selection", function() {
            function getByVal(val) {
                var index = store.findExact('value', val);
                return store.getAt(index);
            }

            function selectNotify(rec) {
                field.expand();
                field.getPicker().select(rec);
                viewModel.notify();
                field.collapse();
            }

            describe("reference", function() {
                describe("no initial value", function() {
                    beforeEach(function() {
                        viewModel.bind('{userList.selection}', spy);
                        makeViewModelSelectField({
                            autoSelect: false,
                            reference: 'userList'
                        });
                        viewModel.notify();
                    });

                    it("should publish null by default", function() {
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBeNull();
                        expect(args[1]).toBeUndefined();
                    });

                    it("should publish the value when selected", function() {
                        var rec = getByVal('value 1');
                        selectNotify(rec);
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(rec);
                        expect(args[1]).toBeNull();
                        expect(field.getValue()).toBe('value 1');
                    });

                    it("should publish when the selection is changed", function() {
                        var rec1 = getByVal('value 1'),
                            rec2 = getByVal('value 2');

                        selectNotify(rec1);
                        spy.reset();
                        selectNotify(rec2);
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(rec2);
                        expect(args[1]).toBe(rec1);
                        expect(field.getValue()).toBe('value 2');
                    });

                    it("should publish the record when setting the value", function() {
                        field.setValue('value 1');
                        viewModel.notify();
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(getByVal('value 1'));
                        expect(args[1]).toBeNull();
                    });

                    it("should publish the record when the value is changed", function() {
                        field.setValue('value 1');
                        viewModel.notify();
                        spy.reset();
                        field.setValue('value 2');
                        viewModel.notify();
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(getByVal('value 2'));
                        expect(args[1]).toBe(getByVal('value 1'));
                    });

                    it("should publish the record when the value is cleared", function() {
                        field.setValue('value 1');
                        viewModel.notify();
                        spy.reset();
                        field.setValue(null);
                        viewModel.notify();
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBeNull();
                        expect(args[1]).toBe(getByVal('value 1'));
                    });
                });

                describe("with initial value", function() {
                    beforeEach(function() {
                        viewModel.bind('{userList.selection}', spy);
                        makeViewModelSelectField({
                            reference: 'userList',
                            value: 'value 2'
                        });
                        viewModel.notify();
                    });

                    it("should publish the record", function() {
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(getByVal('value 2'));
                        expect(args[1]).toBeUndefined();
                    });
                });
            });

            describe("two way binding", function() {
                describe("no initial value", function() {
                    beforeEach(function() {
                        viewModel.bind('{foo}', spy);
                        makeViewModelSelectField({
                            bind: {
                                selection: '{foo}'
                            }
                        });
                        viewModel.notify();
                    });

                    describe("changing the selection", function() {
                        it("should trigger the binding when adding a selection", function() {
                            var rec = getByVal('value 1');
                            selectNotify(rec);
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(rec);
                            expect(args[1]).toBeUndefined();
                        });

                        it("should trigger the binding when changing the selection", function() {
                            var rec1 = getByVal('value 1'),
                                rec2 = getByVal('value 2');

                            selectNotify(rec1);
                            spy.reset();
                            selectNotify(rec2);
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(rec2);
                            expect(args[1]).toBe(rec1);
                        });

                        it("should trigger the binding when setting the value", function() {
                            field.setValue('value 1');
                            viewModel.notify();
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(getByVal('value 1'));
                            expect(args[1]).toBeUndefined();
                        });

                        it("should trigger the binding when the value is changed", function() {
                            field.setValue('value 1');
                            viewModel.notify();
                            spy.reset();
                            field.setValue('value 2');
                            viewModel.notify();
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(getByVal('value 2'));
                            expect(args[1]).toBe(getByVal('value 1'));
                        });

                        it("should trigger the binding when the value is cleared", function() {
                            field.setValue('value 1');
                            viewModel.notify();
                            spy.reset();
                            field.setValue(null);
                            viewModel.notify();
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBeNull();
                            expect(args[1]).toBe(getByVal('value 1'));
                        });
                    });

                    describe("changing the view model value", function() {
                        it("should set the value when setting the record", function() {
                            var rec = getByVal('value 1');
                            viewModel.set('foo', rec);
                            viewModel.notify();
                            expect(field.getValue()).toBe('value 1');
                        });

                        it("should set the value when updating the record", function() {
                            viewModel.set('foo', getByVal('value 1'));
                            viewModel.notify();
                            viewModel.set('foo', getByVal('value 2'));
                            viewModel.notify();
                            expect(field.getValue()).toBe('value 2');
                        });

                        it("should deselect when clearing the value", function() {
                            viewModel.set('foo', getByVal('value 1'));
                            viewModel.notify();
                            viewModel.set('foo', null);
                            viewModel.notify();
                            expect(field.getValue()).toBeNull();
                        });
                    });
                });

                // Not sure if we want to support this, leave this out for now
                xdescribe("with initial value", function() {
                    it("should trigger the binding with an initial value in the select field", function() {
                        viewModel.bind('{foo}', spy);
                        makeViewModelSelectField({
                            value: 'value 2',
                            bind: {
                                selection: '{foo}'
                            }
                        });
                        viewModel.notify();
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(getByVal('value 2'));
                        expect(args[1]).toBeUndefined();
                    });
                });

                describe("reloading the store", function() {
                    beforeEach(function() {
                        MockAjaxManager.addMethods();
                        viewModel.bind('{foo}', spy);
                        makeViewModelSelectField({
                            bind: {
                                selection: '{foo}'
                            }
                        });
                        viewModel.notify();

                        selectNotify(getByVal('value 1'));
                        spy.reset();

                        store.setProxy({
                            type: 'ajax',
                            url: 'fake'
                        });
                        store.load();
                    });

                    afterEach(function() {
                        MockAjaxManager.removeMethods();
                    });

                    describe("when the selected record is in the result set", function() {
                        it("should trigger the selection binding", function() {
                            field.expand();

                            Ext.Ajax.mockComplete({
                                status: 200,
                                responseText: Ext.encode([
                                    {id: 1, text: 'text 1', value: 'value 1'},
                                    {id: 2, text: 'text 2', value: 'value 2'}
                                ])
                            });

                            viewModel.notify();
                            field.expand();

                            // After the new record with the same ID arrives the selection must be
                            // synched to contain the new record by that ID.
                            expect(field.getPicker().getSelectable().getSelections()[0]).toBe(store.byValue.get('value 1'));
                            expect(spy.callCount).toBe(1);
                            expect(spy.mostRecentCall.args[0]).toBe(store.getAt(0));
                        });
                    });

                    describe("when the selected record is not in the result set", function() {
                        it("should trigger the selection binding", function() {
                            Ext.Ajax.mockComplete({
                                status: 200,
                                responseText: '[]'
                            });

                            viewModel.notify();
                            expect(spy.callCount).toBe(1);
                            expect(spy.mostRecentCall.args[0]).toBeNull();
                        });
                    });
                });
            });
        });
    });
});
