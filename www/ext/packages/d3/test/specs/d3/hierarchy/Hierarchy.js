(Ext.isIE10m ? xtopSuite : topSuite)("Ext.d3.hierarchy.Hierarchy",
    ['Ext.d3.*', 'Ext.data.TreeStore'],
function() {
    var root1 = {
        a: 'a',
        b: 'b',
        x: 3,

        expanded: true,
        children: [
            {
                a: 'a',
                b: 'b',
                x: 3
            },
            {
                a: 'a',
                b: 'b',
                x: 3,

                expanded: false,
                children: [
                    {
                        a: 'a',
                        b: 'b',
                        x: 3
                    }
                ]
            }
        ]
    };

    var root2 = {
        x: 1,

        expanded: true,
        children: [
            {
                x: 3
            },
            {
                x: 2,

                expanded: true,
                children: [
                    {
                        x: 6
                    },
                    {
                        x: 4
                    },
                    {
                        x: 5
                    }
                ]
            }
        ]
    };

    describe('nodeChildren', function () {
        var component, nodeText = [];

        var Component = Ext.define(null, {
            extend: 'Ext.d3.hierarchy.Hierarchy',
            applyLayout: function () {
                return d3.pack();
            },
            addNodes: function (selection) {
                var me = this,
                    fn = me.getNodeText();

                selection.each(function (node) {
                    nodeText.push(fn(me, node));
                });
            }
        });

        it('should return only expanded records by default', function () {
            component = new Component({
                nodeText: 'a',
                store: new Ext.data.TreeStore({
                    data: root1
                })
            });
            component.performLayout();
            expect(nodeText.length).toBe(3);
        });

        afterEach(function () {
            nodeText.length = 0;
            Ext.destroy(component);
        });

        it('should take a custom function', function () {
            component = new Component({
                nodeText: 'a',
                nodeChildren: function (record) {
                    expect(record instanceof Ext.data.TreeModel).toBe(true);
                    return record.childNodes;
                },
                store: new Ext.data.TreeStore({
                    data: root1
                })
            });
            component.performLayout();
            expect(nodeText.length).toBe(4);
        });

        afterEach(function () {
            nodeText.length = 0;
            Ext.destroy(component);
        });
    });

    describe('nodeText', function () {
        var component, nodeText = [];

        var Component = Ext.define(null, {
            extend: 'Ext.d3.hierarchy.Hierarchy',
            applyLayout: function () {
                return d3.pack();
            },
            addNodes: function (selection) {
                var me = this,
                    fn = me.getNodeText();

                selection.each(function (node) {
                    nodeText.push(fn(me, node));
                });
            }
        });

        it('should take a function', function () {
            function f() {
                return 'c';
            }
            component = new Component({
                nodeText: f,
                store: new Ext.data.TreeStore({
                    data: root1
                })
            });
            expect(component.getNodeText()).toBe(f);

            component.performLayout();
            for (var i = 0; i < nodeText.length; i++) {
                expect(nodeText[i]).toBe('c');
            }
        });
        it('should take a string', function () {
            component = new Component({
                nodeText: 'a'
            });
            expect(typeof component.getNodeText()).toBe('function');

            component.performLayout();
            for (var i = 0; i < nodeText.length; i++) {
                expect(nodeText[i]).toBe('a');
            }
        });
        it('should take an array of strings', function () {
            component = new Component({
                nodeText: ['dummy', 'b']
            });
            expect(typeof component.getNodeText()).toBe('function');

            component.performLayout();
            for (var i = 0; i < nodeText.length; i++) {
                expect(nodeText[i]).toBe('b');
            }
        });

        afterEach(function () {
            nodeText.length = 0;
            Ext.destroy(component);
        });
    });

    describe('nodeValue', function () {
        var component;

        var Component = Ext.define(null, {
            extend: 'Ext.d3.hierarchy.Hierarchy',
            applyLayout: function () {
                return d3.pack();
            }
        });

        it('should return 1 by default for any node', function () {
            component = new Component;
            var nodeValue = component.getNodeValue();
            expect(nodeValue()).toBe(1);
            expect(nodeValue(root1)).toBe(1);
        });

        it("should be scoped to the component", function () {
            // The given function is called by D3 and is scoped to 'window',
            // so we can bind our own scope.
            component = new Component({
                nodeValue: function (record) {
                    expect(this instanceof Ext.d3.hierarchy.Hierarchy).toBe(true);
                    return 1;
                },
                store: new Ext.data.TreeStore({
                    data: [{
                        text: 'bla'
                    }]
                })
            });
            component.performLayout();
        });

        it('should be passed a tree store record', function () {
            component = new Component({
                nodeValue: function (record) {
                    expect(record instanceof Ext.data.TreeModel).toBe(true);
                    return 1;
                },
                store: new Ext.data.TreeStore({
                    data: [{
                        text: 'bla'
                    }]
                })
            });
            component.performLayout();
        });

        it('should take a function', function () {
            function f(record) {
                return record.get('x');
            }
            component = new Component({
                nodeValue: f,
                store: new Ext.data.TreeStore({
                    data: root1
                })
            });
            component.performLayout();

            expect(component.nodes.length).toBe(3);
            expect(component.nodes[0].value).toBe(6);
            expect(component.nodes[1].value).toBe(3);
            expect(component.nodes[2].value).toBe(3);
        });

        it('should take a string', function () {
            component = new Component({
                nodeValue: 'x',
                store: new Ext.data.TreeStore({
                    data: root1
                })
            });
            expect(typeof component.getNodeValue()).toBe('function');

            component.performLayout();
            expect(component.nodes.length).toBe(3);
            expect(component.nodes[0].value).toBe(6);
            expect(component.nodes[1].value).toBe(3);
            expect(component.nodes[2].value).toBe(3);
        });

        it('should take a number', function () {
            component = new Component({
                nodeValue: 3,
                store: new Ext.data.TreeStore({
                    data: root1
                })
            });
            expect(typeof component.getNodeValue()).toBe('function');
            var nodeValueSpy = spyOn(component, '_nodeValue').andCallThrough();

            component.performLayout();
            expect(nodeValueSpy.callCount).toBe(3);
            expect(component.nodes.length).toBe(3);
            expect(component.nodes[0].value).toBe(9); // TODO: why not 6?
            expect(component.nodes[1].value).toBe(3);
            expect(component.nodes[2].value).toBe(3);
        });

        it('should trigger a layout when set', function () {
            component = new Component({
                store: new Ext.data.TreeStore({
                    data: root1
                })
            });
            component.setNodeValue(function () { return 5; });

            expect(component.nodes.length).toBe(3);
            expect(component.nodes[0].value).toBe(15); // TODO: why not 10?
            expect(component.nodes[1].value).toBe(5);
            expect(component.nodes[2].value).toBe(5);
        });

        afterEach(function () {
            Ext.destroy(component);
        });
    });

    describe('nodeKey', function () {
        var component;

        var Component = Ext.define(null, {
            extend: 'Ext.d3.hierarchy.Hierarchy',
            applyLayout: function () {
                return d3.pack();
            }
        });

        it('should return store record ID by default', function () {
            component = new Component({
                store: new Ext.data.TreeStore({
                    data: root1
                })
            });
            var nodeKey = component.getNodeKey();
            var nodeKeySpy = spyOn(component, '_nodeKey').andCallThrough();
            component.performLayout();

            var nodes = component.nodes;

            expect(nodeKeySpy.callCount).toBe(3);
            expect(component.nodes.length).toBe(3);
            expect(nodeKey(nodes[0])).toBe(nodes[0].data.id);
            expect(nodeKey(nodes[1])).toBe(nodes[1].data.id);
            expect(nodeKey(nodes[2])).toBe(nodes[2].data.id);
        });

        afterEach(function () {
            Ext.destroy(component);
        });
    });

    describe('sorter', function () {
        var component;

        var Component = Ext.define(null, {
            extend: 'Ext.d3.hierarchy.Hierarchy',
            applyLayout: function () {
                return d3.pack();
            }
        });

        it('should sort sibling nodes', function () {
            function f(nodeA, nodeB) {
                return nodeA.data.get('x') - nodeB.data.get('x');
            }
            component = new Component({
                store: new Ext.data.TreeStore({
                    data: root2
                })
            });
            component.performLayout();
            // No need to check the root (nodes[0]), since it has no siblings
            // and has a dummy model anyway (nodes[0].data.get('x') is undefined).
            expect(component.nodes[1].data.get('x')).toBe(3);
            expect(component.nodes[2].data.get('x')).toBe(2);
            expect(component.nodes[3].data.get('x')).toBe(6);
            expect(component.nodes[4].data.get('x')).toBe(4);
            expect(component.nodes[5].data.get('x')).toBe(5);

            component.setSorter(f);
            expect(component.nodes[1].data.get('x')).toBe(2);
            expect(component.nodes[2].data.get('x')).toBe(3);
            expect(component.nodes[3].data.get('x')).toBe(4);
            expect(component.nodes[4].data.get('x')).toBe(5);
            expect(component.nodes[5].data.get('x')).toBe(6);
        });

        afterEach(function () {
            Ext.destroy(component);
        });
    });

});
