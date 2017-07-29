(Ext.isIE10m ? xtopSuite : topSuite)("Ext.d3.hierarchy.partition.Sunburst",
    ['Ext.d3.*', 'Ext.data.TreeStore'],
function() {
    var precision = 12; // first 12 decimal points should match

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

    var data4 = { // siblings (sort order)
        text: 'R',
        size: 100,
        expanded: true,
        children: [
            {text: 'R-C1', size: 100},
            {text: 'R-C2', size: 500},
            {text: 'R-C3', size: 300},
            {text: 'R-C4', size: 200},
            {text: 'R-C4', size: 400}
        ]
    };

    function createSunburst(data, config) {
        return new Ext.d3.hierarchy.partition.Sunburst(Ext.apply({
            renderTo: document.body,
            transitions: {
                layout: false,
                select: false,
                zoom: false
            },
            width: 200,
            height: 200,
            store: new Ext.data.TreeStore({
                rootVisible: true,
                root: Ext.clone(data)
            })
        }, config));
    }

    describe('store', function () {
        it('should be able to start with null store and set it later', function () {
            var component, sceneRendered;

            component = new Ext.d3.hierarchy.partition.Sunburst({
                renderTo: document.body,
                transitions: {
                    layout: false,
                    select: false,
                    zoom: false
                },
                width: 200,
                height: 200,
                store: null,
                listeners: {
                    scenerender: function () {
                        sceneRendered = true;
                    }
                }
            });
            waitsFor(function () {
                return sceneRendered && !component.layoutTransition;
            });
            runs(function () {
                var store = new Ext.data.TreeStore({
                    rootVisible: true,
                    root: Ext.clone(data3)
                });
                sceneRendered = false;
                component.setStore(store);
            });
            waitsFor(function () {
                return sceneRendered && !component.layoutTransition;
            });
            runs(function () {
                // If the setting the store doesn't work, there will be uncaught errors
                // or a timeout.
                Ext.destroy(component);
            });
        });
    });

    describe('nodeText', function () {
        it('should return correct text', function () {
            var component, sceneRendered,
                notFoundText = 'empty';

            var nodeText = function (component, node) {
                var record = node && node.data;
                return (record && record.get('altText')) || notFoundText;
            };

            runs(function () {
                component = createSunburst(data3, {
                    nodeText: nodeText,
                    listeners: {
                        scenerender: function () {
                            sceneRendered = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return sceneRendered && !component.layoutTransition;
            });
            runs(function () {
                var record = component.getStore().getAt(0);
                var el = component.selectionFromRecord(record);
                expect(el.select('.' + component.defaultCls.label).text()).toBe(notFoundText);
                record = component.getStore().getAt(2);
                el = component.selectionFromRecord(record);
                expect(el.select('.' + component.defaultCls.label).text().charAt(0)).toBe('_');
                Ext.destroy(component);
            });
        });
    });

    describe('colorAxis', function () {
        function normalize(color) {
            if (color.charAt(0) === '#') {
                var parts = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color),
                    r = parseInt(parts[1], 16),
                    g = parseInt(parts[2], 16),
                    b = parseInt(parts[3], 16);

                color = 'rgb(' + [r, g, b].join(', ') + ')'
            }
            return color;
        }

        it('should set correct color, should update element colors when changed', function () {
            var red = 'rgb(255, 0, 0)',
                yellow = 'rgb(255, 255, 0)',
                component, sceneRendered;

            runs(function () {
                component = createSunburst(data3, {
                    colorAxis: {
                        processor: function () {
                            return yellow;
                        }
                    },
                    listeners: {
                        scenerender: function () {
                            sceneRendered = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return sceneRendered && !component.layoutTransition;
            });
            runs(function () {
                var record = component.getStore().getAt(2);
                var el = component.selectionFromRecord(record);
                expect(normalize(el.select('path').style('fill'))).toBe(yellow);
                component.setColorAxis({
                    processor: function () {
                        return red;
                    }
                });
                expect(normalize(el.select('path').style('fill'))).toBe(red);
                Ext.destroy(component);
            });
        });
    });

    describe('nodeValue', function () {
        it('should default to equal area for all siblings', function () {
            var component, haveFirstRender;

            runs(function () {
                component = createSunburst(data3, {
                    listeners: {
                        scenerender: function () {
                            haveFirstRender = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return haveFirstRender;
            });
            runs(function () {
                var siblings = component.getStore().getAt(1).childNodes,
                    sib1 = siblings[0],
                    sib2 = siblings[1];

                expect(sib1.dx).toEqual(sib2.dx);
                expect(sib1.dy).toEqual(sib2.dy);
                Ext.destroy(component);
            });
        });

        it('should set angle and radius according to a property of a node, if a string value is given', function () {
            var component, haveFirstRender;

            runs(function () {
                component = createSunburst(data3, {
                    nodeValue: 'size',
                    listeners: {
                        scenerender: function () {
                            haveFirstRender = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return haveFirstRender;
            });
            runs(function () {
                var siblings = component.getStore().getAt(1).childNodes,
                    sib1 = component.nodeFromRecord(siblings[0]),
                    sib2 = component.nodeFromRecord(siblings[1]);

                var sizeRatio = sib1.data.get('size') / sib2.data.get('size');
                var dxRatio = (sib1.x1 - sib1.x0) / (sib2.x1 - sib2.x0);

                expect(sizeRatio).toBeCloseTo(dxRatio, precision);
                expect(sib1.y0).toBeCloseTo(sib2.y0, precision);
                expect(sib1.y1).toBeCloseTo(sib2.y1, precision);

                Ext.destroy(component);
            });
        });

        it('should set angle and raduis properly when custom nodeValue function is used', function () {
            var name = 'customSize',
                component, haveFirstRender;

            runs(function () {
                component = createSunburst(data3, {
                    nodeValue: function (record) {
                        return record.get(name);
                    },
                    listeners: {
                        scenerender: function () {
                            haveFirstRender = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return haveFirstRender;
            });
            runs(function () {
                var siblings = component.getStore().getAt(1).childNodes,
                    sib1 = component.nodeFromRecord(siblings[0]),
                    sib2 = component.nodeFromRecord(siblings[1]);

                var sizeRatio = sib1.data.get(name) / sib2.data.get(name);
                var dxRatio = (sib1.x1 - sib1.x0) / (sib2.x1 - sib2.x0);

                expect(sizeRatio).toBeCloseTo(dxRatio, precision);
                expect(sib1.y0).toBeCloseTo(sib2.y0, precision);
                expect(sib1.y1).toBeCloseTo(sib2.y1, precision);

                Ext.destroy(component);
            });
        });
    });

    describe('nodeClass', function () {
        it('should use proper classes on elements by default', function () {
            // "x-d3-parent", "x-d3-expanded" and "x-d3-root"
            var component, haveFirstRender;

            runs(function () {
                component = createSunburst(data2, {
                    listeners: {
                        scenerender: function () {
                            haveFirstRender = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return haveFirstRender;
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

                Ext.destroy(component);
            });
        });
    });

    describe('sorter', function () {
        var component;

        it('should short property and trigger layout', function () {
            var sceneRendered;

            runs(function () {
                component = createSunburst(data2, {
                    sorter: function (nodeA, nodeB) {
                        return nodeB.data.get('size') - nodeA.data.get('size');
                    },
                    store: new Ext.data.TreeStore({
                        rootVisible: true,
                        root: Ext.clone(data4)
                    }),
                    listeners: {
                        scenerender: function () {
                            sceneRendered = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return sceneRendered && !component.layoutTransition;
            });
            runs(function () {
                var nodes = component.nodes;
                var children = nodes[0].children;

                for (var i = 0; i < children.length - 1; i++) {
                    expect(children[i].data.get('size')).toBeGreaterThanOrEqual(children[i+1].data.get('size'));
                }
                sceneRendered = false;
                component.setSorter(function (nodeA, nodeB) {
                    return nodeA.data.get('size') - nodeB.data.get('size');
                });
            });
            waitsFor(function () {
                return sceneRendered && !component.layoutTransition;
            });
            runs(function () {
                var nodes = component.nodes;
                var children = nodes[0].children;

                for (var i = 0; i < children.length - 1; i++) {
                    expect(children[i].data.get('size')).toBeLessThanOrEqual(children[i+1].data.get('size'));
                }
            });
        });

        afterEach(function () {
            Ext.destroy(component);
        });
    });

    describe('selection', function () {
        it('should fire "select" event and select correct node on first render', function () {
            var component, haveFirstSelection;

            runs(function () {
                component = createSunburst(data1, {
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
                Ext.destroy(component);
            });
        });

        it('should have no selection by default', function () {
            var component, haveFirstRender;

            runs(function () {
                component = createSunburst(data3, {
                    listeners: {
                        scenerender: function () {
                            haveFirstRender = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return haveFirstRender;
            });
            runs(function () {
                expect(component.getRenderedNodes().selectAll('.' + component.defaultCls.selected).size()).toBe(0);
                Ext.destroy(component);
            });
        });

        it('should only select rendered nodes from the bound store', function () {
            // and deselect selection, if something else was provided.
            var component, sceneRendered;

            runs(function () {
                component = createSunburst(data2, {
                    listeners: {
                        scenerender: function () {
                            sceneRendered = true;
                        }
                    }
                });
            });
            waitsFor(function () {
                return sceneRendered && !component.layoutTransition;
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
                Ext.destroy(component);
            });
        });

    });

});
