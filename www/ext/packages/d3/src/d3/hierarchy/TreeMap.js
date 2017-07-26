/**
 * The 'd3-treemap' component uses D3's
 * [TreeMap Layout](https://github.com/d3/d3-hierarchy/#treemap)
 * to recursively subdivide area into rectangles, where the area of any node in the tree
 * corresponds to its value.
 *
 *     @example
 *     Ext.create('Ext.panel.Panel', {
 *         renderTo: Ext.getBody(),
 *         title: 'TreeMap Chart',
 *         height: 750,
 *         width: 750,
 *         layout: 'fit',
 *         items: [
 *             {
 *                 xtype: 'd3-treemap',
 *                 tooltip: {
 *                     renderer: function (component, tooltip, node) {
 *                         tooltip.setHtml(node.data.get('text'));
 *                     }
 *                 },
 *                 nodeValue: function (record) {
 *                     // The value in your data to derive the size of the tile from.
 *                     return record.get('value');
 *                 },
 *                 store: {
 *                     type: 'tree',
 *                     data: [
 *                         {  text: 'Hulk',
 *                            value : 5,
 *                            children: [
 *                                 { text: 'The Leader', value: 3 },
 *                                 { text: 'Abomination', value: 2 },
 *                                 { text: 'Sandman', value: 1 }
 *                             ]
 *                         },
 *                         {   text: 'Vision',
 *                             value : 4,
 *                             children: [
 *                                 { text: 'Kang', value: 4 },
 *                                 { text: 'Magneto', value: 3 },
 *                                 { text: 'Norman Osborn', value: 2 },
 *                                 { text: 'Anti-Vision', value: 1 }
 *                             ]
 *                         },
 *                         {   text: 'Ghost Rider',
 *                             value : 3,
 *                             children: [
 *                                 { text: 'Mephisto', value: 1 }
 *                             ]
 *                         },
 *                         {   text: 'Loki',
 *                             value : 2,
 *                             children: [
 *                                 { text: 'Captain America', value: 3 },
 *                                 { text: 'Deadpool', value: 4 },
 *                                 { text: 'Odin', value: 5 },
 *                                 { text: 'Scarlet Witch', value: 2 },
 *                                 { text: 'Silver Surfer', value: 1 }
 *                             ]
 *                         },
 *                         {   text: 'Daredevil',
 *                             value : 1,
 *                             children: [
 *                                 { text: 'Purple Man', value: 4 },
 *                                 { text: 'Kingpin', value: 3 },
 *                                 { text: 'Namor', value: 2 },
 *                                 { text: 'Sabretooth', value: 1 }
 *                             ]
 *                         }
 *                     ]
 *                 }
 *             }
 *         ]
 *     });
 *
 */
Ext.define('Ext.d3.hierarchy.TreeMap', {
    extend: 'Ext.d3.hierarchy.Hierarchy',
    xtype: 'd3-treemap',

    requires: [
        'Ext.d3.Helpers'
    ],

    config: {
        componentCls: 'treemap',

        /**
         * @cfg {Function} tiling
         * The [tiling method](https://github.com/d3/d3-hierarchy#treemap_tile) to use
         * with the `treemap` layout. For example:
         *
         *     tiling: 'd3.treemapBinary'
         *
         */
        tiling: null,

        /**
         * @cfg {Object} parentTile
         * Parent tile options.
         *
         * @cfg {Number} [parentTile.padding=4]
         * Determines the amount of extra space to reserve between
         * the parent and its children. Uniform on all sides, except the top
         * padding is calculated by the component itself depending on the height
         * of the tile's title.
         *
         * @cfg {Object} parentTile.label Parent tile label options.
         *
         * @cfg {Number} [parentTile.label.offset=[5, 2]]
         * The offset of the label from the top-left corner of the tile's rect.
         *
         * @cfg {Number[]} parentTile.label.clipSize
         * If the size of a parent node is smaller than this size, its label will be hidden.
         */
        parentTile: {
            padding: 4,
            label: {
                offset: [5, 2],
                clipSize: [110, 40]
            }
        },

        /**
         * @cfg {Object} leafTile
         * Leaf tile options.
         *
         * @cfg {Number} [leafTile.padding=0]
         * The [padding](https://github.com/d3/d3-hierarchy#treemap_paddingInner)
         * used to separate a node’s adjacent children.
         *
         * @cfg {Object} leafTile.label Child tile label options.
         *
         * @cfg {Number[]} [leafTile.label.offset] The offset of the label from the
         * top-left corner of the tile's rect. Defaults to `[5, 1]`.
         */
        leafTile: {
            padding: 0
        },

        nodeTransform: function (selection) {
            selection.attr('transform', function (node) {
                return 'translate(' + node.x0 + ',' + node.y0 + ')';
            });
        },

        /**
         * @cfg {String} busyLayoutText The text to show when the layout is in progress.
         */
        busyLayoutText: 'Layout in progress...',

        noParentValue: true,

        noSizeLayout: false,

        /**
         * @cfg {Boolean} scaleLabels
         * @since 6.5.0
         * If `true` the bigger tiles will have (more or less) proportionally bigger labels.
         */
        scaleLabels: false
    },

    /**
     * @private
     * @property
     */
    labelQuantizer: null,

    constructor: function (config) {
        this.labelQuantizer = this.createLabelQuantizer();

        this.callParent([config]);
    },

    /**
     * @private
     */
    createLabelQuantizer: function () {
        return d3.scaleQuantize().domain([8, 27]).range(['8px', '12px', '18px', '27px']);
    },

    /**
     * @private
     */
    labelSizer: function (node, element) {
        return Math.min((node.x1 - node.x0) / 4, (node.y1 - node.y0) / 2);
    },

    applyTiling: function (tiling, oldTiling) {
        return Ext.d3.Helpers.eval(tiling || oldTiling);
    },

    updateTiling: function (tiling) {
        if (tiling) {
            this.getLayout().tile(tiling);
            if (!this.isConfiguring) {
                this.performLayout();
            }
        }
    },

    updateLeafTile: function (leafTile) {
        if (leafTile) {
            this.getLayout().paddingInner(leafTile.padding || 0);
        }
        if (!this.isConfiguring) {
            this.performLayout();
        }
    },

    applyParentTile: function (parentTile) {
        if (parentTile) {
            var me = this,
                padding = parentTile.padding;

            if (Ext.isNumber(padding)) {
                parentTile.padding = function (node) {
                    return !me.getRootVisible() && node === me.root ? 0 : padding;
                };
            }
        }

        return parentTile;
    },

    updateParentTile: function (parentTile) {
        if (parentTile) {
            var layout = this.getLayout(),
                padding = parentTile.padding;

            layout.paddingRight(padding);
            layout.paddingBottom(padding);
            layout.paddingLeft(padding);
        }
        if (!this.isConfiguring) {
            this.performLayout();
        }
    },

    applyLayout: function () {
        return d3.treemap().round(true);
    },

    setLayoutSize: function (size) {
        this.callParent([size]);
    },

    deferredLayoutId: null,

    isLayoutBlocked: function (layout) {
        var me = this,
            maskText = me.getBusyLayoutText(),
            blocked = false;

        if (!me.deferredLayoutId) {
            me.showMask(maskText);
            // Let the mask render...
            // Note: small timeouts are not always enough to render the mask's DOM,
            //       100 seems to work every time everywhere.
            me.deferredLayoutId = setTimeout(me.performLayout.bind(me), 100);
            blocked = true;
        } else {
            clearTimeout(me.deferredLayoutId);
            me.deferredLayoutId = null;
        }

        return blocked;
    },

    setupScene: function (scene) {
        this.callParent([scene]);
        this.getScaleLabels(); // interested in side effects
    },

    onAfterRender: function () {
        this.hideMask();
    },

    /**
     * @private
     * A map of the {nodeId: Boolean} format,
     * where the Boolean value controls visibility of the label.
     */
    hiddenParentLabels: null,

    /**
     * @private
     * A map of the {nodeId: SVGRect} format,
     * where the SVGRect value is the bounding box of the label.
     */
    labelSizes: null,

    /**
     * Override superclass method here, because getting bbox of the scene won't always
     * produce the intended result: hidden text that sticks out of its container will
     * still be measured.
     */
    getContentRect: function () {
        var sceneRect = this.getSceneRect(),
            contentRect = this.contentRect || (this.contentRect = {x: 0, y: 0});

        // The (x, y) in `contentRect` should be untranslated content position relative
        // to the scene's origin, which is expected to always be (0, 0) for TreeMap.
        // But the (x, y) in `sceneRect` are relative to component's origin:
        // (padding.left, padding.top).

        if (sceneRect) {
            contentRect.width = sceneRect.width;
            contentRect.height = sceneRect.height;
        }

        return sceneRect && contentRect;
    },


    onNodeSelect: function (node, el) {
        this.callParent(arguments);

        // Remove the fill given by the `colorAxis`, so that
        // the CSS style can be used to specify the color
        // of the selection.
        el.select('rect').style('fill', null);
    },

    onNodeDeselect: function (node, el) {
        var me = this,
            colorAxis = me.getColorAxis();

        me.callParent(arguments);

        // Restore the original color.
        // (see 'onNodeSelect' comments).
        el
            .select('rect')
            .style('fill', function (node) {
                return colorAxis.getColor(node);
            });
    },

    renderNodes: function (nodeElements) {
        var me = this,
            root = me.root,
            layout = me.getLayout(),
            parentTile = me.getParentTile(),
            parentLabel = parentTile.label,
            nodeTransform = me.getNodeTransform(),
            hiddenParentLabels = me.hiddenParentLabels = {},
            labelSizes = me.labelSizes = {},
            nodes;

        // To show parent node's label, we need to make space for it during layout by adding
        // extra top padding to the node. But during the layout, the size of the label
        // is not known. We can determine label visibility based on the size of the node,
        // but that alone is not enough, as long nodes can have even longer labels.
        // Clipping labels instead of hiding them is not possible, because overflow is not
        // supported in SVG 1.1, and lack of proper nested SVGs support in IE prevents us
        // from clipping via wrapping labels with 'svg' elements.

        // So knowing the size of the label is crucial.
        // Measuring can only be done after a node is rendered, so we do it this way:

        // 1) first layout pass (in performLayout) has no padding
        // 2) render nodes (callParent down below)
        // 3) measure labels
        // 4) second layout pass (down below) calculates padding for each parent node
        // 5) adjust postion and size of nodes, and label visibility

        me.callParent([nodeElements]);

        layout.paddingTop(function (node) {
            // This will be called for parent nodes only.
            // Leaf node label visibility is determined in `textVisibilityFn`.
            var record = node.data,
                id = record.data.id,
                size = labelSizes[id],
                clipSize = parentLabel.clipSize,
                padding, dx, dy;

            if (!me.getRootVisible() && node === me.root) {
                // Hide the root node by removing its padding, so its children obscure it.
                padding = 0;
                hiddenParentLabels[id] = true;
            } else {
                padding = parentLabel.offset[1] * 2;
                dx = node.x1 - node.x0;
                dy = node.y1 - node.y0;
                if (size.width < dx && size.height < dy && dx > clipSize[0] && dy > clipSize[1]) {
                    padding += size.height;
                    hiddenParentLabels[id] = false;
                } else {
                    hiddenParentLabels[id] = true;
                }
            }

            return padding;
        });

        me.root = root = layout(root);

        nodes = me.nodes = root.descendants();

        layout.paddingTop(0);

        // Reapplying the data to the nodes that were just created in the 'callParent' above.
        nodeElements = me.getRenderedNodes().data(nodes, me.getNodeKey());
        // 'enter' and 'exit' selections are empty at this point.

        nodeElements
            .transition(me.layoutTransition)
            .call(nodeTransform);

        nodeElements
            .select('rect')
            .call(me.nodeSizeFn.bind(me));

        nodeElements
            .select('text')
            .call(me.textVisibilityFn.bind(me))
            .each(function (node) {
                if (node.data.isLeaf()) {
                    this.setAttribute('x', (node.x1 - node.x0) / 2);
                    this.setAttribute('y', (node.y1 - node.y0) / 2);
                } else {
                    this.setAttribute('x', parentLabel.offset[0]);
                    this.setAttribute('y', parentLabel.offset[1]);
                }
            });
    },

    addNodes: function (selection) {
        var me = this,
            labelSizes = me.labelSizes,
            colorAxis = me.getColorAxis(),
            nodeText = me.getNodeText(),
            scaleLabels = me.getScaleLabels(),
            cls = me.defaultCls;

        selection.append('rect')
            .style('fill', function (node) {
                return colorAxis.getColor(node);
            });

        selection.append('text')
            .style('font-size', function (node) {
                return scaleLabels ? me.getLabelSize(node, this) : null;
            })
            .each(function (node) {
                var text = nodeText(me, node);

                this.textContent = text == null ? '' : text;
                this.setAttribute('class', cls.label);
                Ext.d3.Helpers.fakeDominantBaseline(this, node.data.isLeaf() ? 'central' : 'text-before-edge');
                labelSizes[node.data.id] = this.getBBox();
            });
    },

    updateNodes: function (selection) {
        var me = this,
            nodeText = me.getNodeText(),
            scaleLabels = me.getScaleLabels(),
            labelSizes = me.labelSizes;

        selection.select('rect')
            .call(me.nodeSizeFn.bind(me));

        selection.select('text')
            .style('font-size', function (node) {
                return scaleLabels ? me.getLabelSize(node, this) : null;
            })
            .each(function (node) {
                var text = nodeText(me, node);

                this.textContent = text == null ? '' : text;
                labelSizes[node.data.id] = this.getBBox();
            });
    },

    /**
     * @private
     */
    getLabelSize: function (node, element) {
        if (node.data.isLeaf()) {
            // If too many different font sizes are used, the SVG rendering may slow down significantly
            // when scene's content is scaled (e.g. when zooming in/out with the PanZoom interaction),
            // so we quantize calculated font sizes.
            return this.labelQuantizer(this.labelSizer(node, element));
        }
        return null; // Parent node font size is set via CSS.
    },

    updateScaleLabels: function () {
        if (!this.isConfiguring) {
            this.performLayout();
        }
    },

    updateNodeValue: function (nodeValue) {
        this.callParent(arguments);
        // The parent method doesn't perform layout automatically, nor should it,
        // as for some hiearchy components merely re-rendering the scene will be
        // sufficient. For treemaps however, a layout is necessary to determine
        // label size and visibility.
        if (!this.isConfiguring) {
            this.performLayout();
        }
    },

    /**
     * @private
     */
    nodeSizeFn: function (selection) {
        selection
            .attr('width', function (node) {
                return Math.max(0, node.x1 - node.x0);
            })
            .attr('height', function (node) {
                return Math.max(0, node.y1 - node.y0);
            });
    },

    isLabelVisible: function (element, node) {
        var me = this,
            bbox = element.getBBox(),
            width = node.x1 - node.x0,
            height = node.y1 - node.y0,
            isLeaf = node.data.isLeaf(),
            parentTile = me.getParentTile(),
            hiddenParentLabels = me.hiddenParentLabels,
            parentLabelOffset = parentTile.label.offset,
            result;

        if (isLeaf) {
            // At least one pixel gap between the 'text' and 'rect' edges.
            width -= 2;
            height -= 2;
        } else {
            width -= parentLabelOffset[0] * 2;
            height -= parentLabelOffset[1] * 2;
        }

        if (isLeaf || !node.data.isExpanded()) {
            result = bbox.width < width && bbox.height < height;
        } else {
            result = !hiddenParentLabels[node.data.id];
        }

        return result;
    },

    /**
     * @private
     */
    textVisibilityFn: function (selection) {
        var me = this;

        selection.classed(me.defaultCls.invisible, function (node) {
            return !me.isLabelVisible(this, node);
        });
    },

    destroy: function () {
        var me = this,
            colorAxis = me.getColorAxis();

        if (me.deferredLayoutId) {
            clearTimeout(me.deferredLayoutId);
        }
        colorAxis.destroy();

        me.callParent();
    }

});
