(Ext.isIE10m ? xtopSuite : topSuite)("Ext.d3.hierarchy.tree.HorizontalTree",
    ['Ext.d3.*', 'Ext.data.TreeStore'],
function() {
    var component,
        precision = 12; // first 12 decimal points should match

    var data1 = { // no expanded
        text: 'R',
        children: [
            {
                text: 'R-C1',
                children: [
                    {
                        text: 'R-C1-C1'
                    },
                    {
                        text: 'R-C1-C2'
                    }
                ]
            },
            {
                text: 'R-C2'
            }
        ]
    };

    var data2 = { // some expanded
        text: 'R',
        expanded: true,
        children: [
            {
                text: 'R-C1',
                expanded: false,
                children: [
                    {
                        text: 'R-C1-C1'
                    },
                    {
                        text: 'R-C1-C2'
                    }
                ]
            },
            {
                text: 'R-C2'
            }
        ]
    };

    var data3 = { // all expanded, with size and alternative text
        text: 'R',
        //altText: '_R' // altText is missing on purpose here
        size: 500,
        customSize: 50,
        expanded: true,
        children: [
            {
                text: 'R-C1',
                altText: '_R-C1',
                size: 400,
                customSize: 40,
                expanded: true,
                children: [
                    {
                        text: 'R-C1-C1',
                        altText: '_R-C1-C1',
                        size: 100,
                        customSize: 10
                    },
                    {
                        text: 'R-C1-C2',
                        altText: '_R-C1-C2',
                        size: 300,
                        customSize: 30
                    }
                ]
            },
            {
                text: 'R-C2',
                altText: '_R-C2',
                size: 100,
                customSize: 10
            }
        ]
    };

    function createTree(data, config) {
        return new Ext.d3.hierarchy.tree.HorizontalTree(Ext.apply({
            renderTo: document.body,
            width: 200,
            height: 200,
            store: new Ext.data.TreeStore({
                rootVisible: true,
                root: Ext.clone(data)
            }),
            transitions: {
                layout: false,
                select: false
            }
        }, config));
    }
    
    afterEach(function() {
        Ext.destroy(component);
    });

    describe('nodeText', function () {
        it('should return correct text', function () {
            var layoutDone,
                notFoundText = 'empty';

            var nodeText = function (component, node) {
                var data = node && node.data && node.data.data;
                return (data && data.altText) || notFoundText;
            };

            runs(function () {
                component = createTree(data3, {
                    nodeText: nodeText,
                    listeners: {
                        layout: function () {
                            layoutDone = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return layoutDone;
            });
            runs(function () {
                var node = component.getStore().getAt(0);
                var nodeEl = component.selectionFromRecord(node);
                expect(nodeEl.select('.' + component.defaultCls.label).text()).toBe(notFoundText);
                node = component.getStore().getAt(2);
                nodeEl = component.selectionFromRecord(node);
                expect(nodeEl.select('.' + component.defaultCls.label).text().charAt(0)).toBe('_');
            });
        });
    });

    describe('colorAxis', function () {
        it('should set correct color, should update element colors when changed', function () {
            var red = 'rgb(255, 0, 0)',
                yellow = 'rgb(255, 255, 0)',
                layoutDone, fillStyle;

            runs(function () {
                component = createTree(data3, {
                    colorAxis: {
                        processor: function () {
                            return yellow;
                        }
                    },
                    listeners: {
                        layout: function () {
                            layoutDone = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return layoutDone;
            });
            runs(function () {
                var record = component.getStore().getAt(2);
                var el = component.selectionFromRecord(record);
                fillStyle = el.select('circle').style('fill');
                expect( fillStyle === yellow || fillStyle === '#ffff00' ).toBe(true);
                component.setColorAxis({
                    processor: function () {
                        return red;
                    }
                });
                fillStyle = el.select('circle').style('fill');
                expect( fillStyle === red || fillStyle === '#ff0000' ).toBe(true);
            });
        });
    });

    // describe('valueFn', ... )
    // From D3 docs:
    // This value has no effect on the tree layout,
    // but is generic functionality provided by hierarchy layouts.

    describe('nodeRadius', function () {
        it('should be 5 by default', function () {
            var layoutDone;

            runs(function () {
                component = createTree(data2, {
                    listeners: {
                        layout: function () {
                            layoutDone = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return layoutDone;
            });
            runs(function () {
                var store = component.getStore(),
                    record = store.getAt(1),
                    el;

                el = component.selectionFromRecord(record);
                expect(parseFloat(el.select('circle').attr('r'))).toBeCloseTo(5, precision);
            });
        });
    });

    describe('nodeClass', function () {
        it('should use proper classes on elements by default', function () {
            // "x-d3-parent", "x-d3-expanded" and "x-d3-root"
            var layoutDone;

            runs(function () {
                component = createTree(data2, {
                    listeners: {
                        layout: function () {
                            layoutDone = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return layoutDone;
            });
            runs(function () {
                var store = component.getStore(),
                    record1 = store.getRoot(),
                    record2 = store.getAt(1),
                    record3 = store.getAt(2),
                    el;

                el = component.selectionFromRecord(record1);
                expect(el.classed(component.defaultCls.root)).toBe(true);
                expect(el.classed(component.defaultCls.parent)).toBe(!record1.isLeaf());
                expect(el.classed(component.defaultCls.expanded)).toBe(true);

                el = component.selectionFromRecord(record2);
                expect(el.classed(component.defaultCls.root)).toBe(false);
                expect(el.classed(component.defaultCls.parent)).toBe(!record2.isLeaf());
                expect(el.classed(component.defaultCls.expanded)).toBe(false);

                el = component.selectionFromRecord(record3);
                expect(el.classed(component.defaultCls.root)).toBe(false);
                expect(el.classed(component.defaultCls.parent)).toBe(!record3.isLeaf());
                expect(el.classed(component.defaultCls.expanded)).toBe(false);
            });
        });
    });

    describe('selection', function () {
        it('should fire "select" event and select correct node on first render', function () {
            var haveFirstSelection;

            runs(function () {
                component = createTree(data1, {
                    nodeChildren: function (node) {
                        return node.childNodes;
                    },
                    listeners: {
                        select: function () {
                            haveFirstSelection = true;
                        }
                    }
                });
                component.setSelection(component.getStore().getRoot());
            });
            waitsFor(function () {
                return component.sceneRect && haveFirstSelection;
            });
            runs(function () {
                expect(component.nodesGroup.select('.' + component.defaultCls.root).classed(component.defaultCls.selected)).toBe(true);
            });
        });

        it('should have no selection by default', function () {
            var layoutDone;

            runs(function () {
                component = createTree(data3, {
                    listeners: {
                        layout: function () {
                            layoutDone = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return layoutDone;
            });
            runs(function () {
                expect(component.getRenderedNodes().selectAll('.' + component.defaultCls.selected).size()).toBe(0);
            });
        });

        it('should only select rendered nodes from the bound store', function () {
            // and deselect selection, if something else was provided.
            var layoutDone;

            runs(function () {
                component = createTree(data2, {
                    listeners: {
                        layout: function () {
                            layoutDone = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return layoutDone;
            });
            runs(function () {
                var record = component.getStore().getAt(2);
                var el = component.selectionFromRecord(record);
                component.setSelection(record);
                expect(el.classed(component.defaultCls.selected)).toBe(true);
                component.setSelection(null);
                expect(el.classed(component.defaultCls.selected)).toBe(false);
                component.setSelection(record);
                expect(el.classed(component.defaultCls.selected)).toBe(true);
                var store = new Ext.data.TreeStore({
                    rootVisible: true,
                    root: Ext.clone(data2)
                });
                component.setSelection(store.getAt(1));
                expect(el.classed(component.defaultCls.selected)).toBe(false);
                expect(component.getSelection()).toBe(null);
                component.setSelection(record);
                expect(el.classed(component.defaultCls.selected)).toBe(true);
                record = component.getStore().getAt(1);
                expect(record.isExpanded()).toBe(false);
                // only children of expanded nodes are rendered by default
                component.setSelection(component.getStore().getAt(1).childNodes[0]); // not rendered = cannot be selected
                expect(el.classed(component.defaultCls.selected)).toBe(false);
                expect(component.getSelection()).toBe(null);
            });
        });
    });

    describe('nodeSize', function () {
        it('should affect the spacing between nodes', function () {
            var layoutDone;

            runs(function () {
                component = createTree(data3, {
                    nodeSize: [100, 50],
                    width: 400,
                    height: 400,
                    listeners: {
                        layout: function () {
                            layoutDone = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return layoutDone;
            });
            runs(function () {
                var nodes = component.getRenderedNodes().nodes();
                var transform;

                transform = Ext.d3.Helpers.parseTransform(nodes[0].getAttribute('transform'));
                expect(transform.translate[0]).toBe(0);
                expect(transform.translate[1]).toBe(0);

                transform = Ext.d3.Helpers.parseTransform(nodes[1].getAttribute('transform'));
                expect(transform.translate[0]).toBe(100);
                expect(transform.translate[1]).toBe(-25);

                transform = Ext.d3.Helpers.parseTransform(nodes[2].getAttribute('transform'));
                expect(transform.translate[0]).toBe(100);
                expect(transform.translate[1]).toBe(25);

                transform = Ext.d3.Helpers.parseTransform(nodes[3].getAttribute('transform'));
                expect(transform.translate[0]).toBe(200);
                expect(transform.translate[1]).toBe(-50);

                transform = Ext.d3.Helpers.parseTransform(nodes[4].getAttribute('transform'));
                expect(transform.translate[0]).toBe(200);
                expect(transform.translate[1]).toBe(0);
            });
        });

        it('should support dynamic configuration', function () {
            var layoutDone;

            runs(function () {
                component = createTree(data3, {
                    width: 400,
                    height: 300,
                    listeners: {
                        layout: function () {
                            layoutDone = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return layoutDone;
            });
            runs(function () {
                layoutDone = false;

                component.setNodeSize([100, 50]);
            });
            waitsFor(function () {
                return layoutDone;
            });
            runs(function () {
                layoutDone = false;

                var nodes = component.getRenderedNodes().nodes();
                var transform;

                transform = Ext.d3.Helpers.parseTransform(nodes[0].getAttribute('transform'));
                expect(transform.translate[0]).toBe(0);
                expect(transform.translate[1]).toBe(0);

                transform = Ext.d3.Helpers.parseTransform(nodes[1].getAttribute('transform'));
                expect(transform.translate[0]).toBe(100);
                expect(transform.translate[1]).toBe(-25);

                transform = Ext.d3.Helpers.parseTransform(nodes[2].getAttribute('transform'));
                expect(transform.translate[0]).toBe(100);
                expect(transform.translate[1]).toBe(25);

                transform = Ext.d3.Helpers.parseTransform(nodes[3].getAttribute('transform'));
                expect(transform.translate[0]).toBe(200);
                expect(transform.translate[1]).toBe(-50);

                transform = Ext.d3.Helpers.parseTransform(nodes[4].getAttribute('transform'));
                expect(transform.translate[0]).toBe(200);
                expect(transform.translate[1]).toBe(0);

                component.setNodeSize(null);
            });
            waitsFor(function () {
                return layoutDone;
            });
            runs(function () {
                layoutDone = false;

                var nodes = component.getRenderedNodes().nodes();
                var transform;

                // If the `nodeSize` config is not set, the layout size will be set to the size
                // of the scene, but the resulting tree node layout is not guaranteed to stretch
                // to fill the whole scene. In this case, the layout won't fill the whole scene
                // vertically, so we only check the horizontal component of the translation.

                transform = Ext.d3.Helpers.parseTransform(nodes[0].getAttribute('transform'));
                expect(transform.translate[0]).toBe(0);

                transform = Ext.d3.Helpers.parseTransform(nodes[1].getAttribute('transform'));
                expect(transform.translate[0]).toBe(200);

                transform = Ext.d3.Helpers.parseTransform(nodes[2].getAttribute('transform'));
                expect(transform.translate[0]).toBe(200);

                transform = Ext.d3.Helpers.parseTransform(nodes[3].getAttribute('transform'));
                expect(transform.translate[0]).toBe(400);

                transform = Ext.d3.Helpers.parseTransform(nodes[4].getAttribute('transform'));
                expect(transform.translate[0]).toBe(400);
            });
        });
    });

});