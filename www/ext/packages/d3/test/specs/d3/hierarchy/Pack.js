/* global Ext, expect */

(Ext.isIE10m ? xtopSuite : topSuite)("Ext.d3.hierarchy.Pack",
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

    function createPack(data, config) {
        return component = new Ext.d3.hierarchy.Pack(Ext.apply({
            renderTo: document.body,
            width: 200,
            height: 200,
            transitions: {
                layout: false,
                select: false
            },
            store: new Ext.data.TreeStore({
                rootVisible: true,
                root: Ext.clone(data)
            })
        }, config));
    }

    afterEach(function() {
        component = Ext.destroy(component);
    });

    describe('nodeChildren', function () {
        it('should return children of only expanded nodes by default', function () {
            var sceneRendered;

            runs(function () {
                component = createPack(data2, {
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
                expect(component.nodes.length).toEqual(3);
                expect(component.nodes[0].data.get('text')).toBe('R');
                expect(component.nodes[1].data.get('text')).toBe('R-C1');
                expect(component.nodes[2].data.get('text')).toBe('R-C2');
            });
        });
    });

    describe('nodeText', function () {
        it('should return correct text', function () {
            var sceneRendered,
                notFoundText = 'empty';

            var nodeText = function (component, node) {
                var text = node && node.data && node.data.get('altText');
                return text || notFoundText;
            };

            runs(function () {
                component = createPack(data3, {
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

                color = 'rgb(' + [r, g, b].join(', ') + ')';
            }
            return color;
        }

        it('should set correct color, should update element colors when changed', function () {
            var red = 'rgb(255, 0, 0)',
                yellow = 'rgb(255, 255, 0)',
                sceneRendered;

            runs(function () {
                component = createPack(data3, {
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
                // The 'fill', 'r' and other attributes are set by a transition
                // that inherits its timing from the 'component.layoutTransition'.
                // Even if that transition's duration is 0, the attributes are
                // set on the next tick, so we still have to wait for the layout
                // transition to end (the 'component.layoutTransition' will be set
                // to 'null' when that happens) before checking the values of
                // those attributes.
                return sceneRendered && !component.layoutTransition;
            });
            runs(function () {
                var record = component.getStore().getAt(2);
                var el = component.selectionFromRecord(record);

                expect(normalize(el.select('circle').style('fill'))).toBe(yellow);
                component.setColorAxis({
                    processor: function () {
                        return red;
                    }
                });
                expect(normalize(el.select('circle').style('fill'))).toBe(red);
            });
        });
    });

    describe('nodeValue', function () {
        it('should default to equal area/radius for all siblings', function () {
            var haveFirstRender;

            runs(function () {
                component = createPack(data3, {
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

                expect(sib1.r).toEqual(sib2.r);
            });
        });

        it("should set radius according to a property of a node, if a string value is given", function () {
            var haveFirstRender;

            runs(function () {
                component = createPack(data3, {
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
                var sib1 = component.nodes[3],
                    sib2 = component.nodes[4];

                // area (not radius) relationship should be the same
                expect(sib1.data.get('size') / sib2.data.get('size'))
                    .toBeCloseTo((sib1.r * sib1.r) / (sib2.r * sib2.r), precision);
            });
        });

        it('should set circle areas properly when a custom function is used', function () {
            var haveFirstRender;

            runs(function () {
                component = createPack(data3, {
                    nodeValue: function (node) {
                        return node.data.customSize;
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
                var sib1 = component.nodes[3],
                    sib2 = component.nodes[4];

                // area (not radius) relationship should be the same
                expect(sib1.data.get('size') / sib2.data.get('size'))
                    .toBeCloseTo((sib1.r * sib1.r) / (sib2.r * sib2.r), precision);
            });
        });
    });

    describe('nodeClass', function () {
        it('should use proper classes on elements by default', function () {
            // "x-d3-parent", "x-d3-expanded" and "x-d3-root"
            var haveFirstRender;

            runs(function () {
                component = createPack(data2, {
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
            });
        });
    });

    describe('selection', function () {
        it('should fire "select" event and select correct node on first render', function () {
            var haveFirstSelection;

            runs(function () {
                component = createPack(data1, {
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
            var haveFirstRender;

            runs(function () {
                component = createPack(data3, {
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
            });
        });

        it('should only select rendered nodes from the bound store', function () {
            // and deselect selection, if something else was provided.
            var sceneRendered;

            runs(function () {
                component = createPack(data2, {
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
            });
        });

    });

});
