/**
 * The 'd3-pack' component uses D3's
 * [Pack Layout](https://github.com/d3/d3-hierarchy/#pack)
 * to visualize hierarchical data as a enclosure diagram.
 * The size of each leaf node’s circle reveals a quantitative dimension
 * of each data point. The enclosing circles show the approximate cumulative size
 * of each subtree.
 *
 * The pack additionally layout populates the following attributes on each node:
 * - `r` - the computed node radius.
 *
 *     @example
 *     Ext.create('Ext.panel.Panel', {
 *         renderTo: Ext.getBody(),
 *         title: 'Pack Chart',
 *         height: 750,
 *         width: 750,
 *         layout: 'fit',
 *         items: [
 *             {
 *                 xtype: 'd3-pack',
 *                 tooltip: {
 *                     renderer: function (component, tooltip, node) {
 *                         var record = node.data;
 *                         tooltip.setHtml(record.get('text'));
 *                     }
 *                 },
 *                 store: {
 *                     type: 'tree',
 *                     data: [
 *                         {
 *                             "text": "DC",
 *                             "children": [
 *                                 {
 *                                     "text": "Flash",
 *                                     "children": [
 *                                         { "text": "Flashpoint" }
 *                                     ]
 *                                 },
 *                                 {
 *                                     "text": "Green Lantern",
 *                                     "children": [
 *                                         { "text": "Rebirth" },
 *                                         { "text": "Sinestro Corps War" }
 *                                     ]
 *                                 },
 *                                 {
 *                                     "text": "Batman",
 *                                     "children": [
 *                                         { "text": "Hush" },
 *                                         { "text": "The Long Halloween" },
 *                                         { "text": "Batman and Robin" },
 *                                         { "text": "The Killing Joke" }
 *                                     ]
 *                                 }
 *                             ]
 *                         },
 *                         {
 *                             "text": "Marvel",
 *                             "children": [
 *                                 {
 *                                     "text": "All",
 *                                     "children": [
 *                                         { "text": "Infinity War" },
 *                                         { "text": "Infinity Gauntlet" },
 *                                         { "text": "Avengers Disassembled" }
 *                                     ]
 *                                 },
 *                                 {
 *                                     "text": "Spiderman",
 *                                     "children": [
 *                                         { "text": "Ultimate Spiderman" }
 *                                     ]
 *                                 },
 *                                 {
 *                                     "text": "Vision",
 *                                     "children": [
 *                                         { "text": "The Vision" }
 *                                     ]
 *                                 },
 *                                 {
 *                                     "text": "X-Men",
 *                                     "children": [
 *                                         { "text": "Gifted" },
 *                                         { "text": "Dark Phoenix Saga" },
 *                                         { "text": "Unstoppable" }
 *                                     ]
 *                                 }
 *                             ]
 *                         }
 *                     ]
 *                 }
 *             }
 *         ]
 *     });
 *
 */
Ext.define('Ext.d3.hierarchy.Pack', {
    extend: 'Ext.d3.hierarchy.Hierarchy',
    xtype: 'd3-pack',

    requires: [
        'Ext.d3.Helpers'
    ],

    config: {
        componentCls: 'pack',

        /**
         * The padding of a node's text inside its container.
         * If the length of the text is such that it can't have the specified padding
         * and still fit into a container, the text will hidden, unless the
         * {@link #clipText} config is set to `false`.
         * It's possible to use negative values for the padding to allow the text to
         * go outside its container by the specified amount.
         * @cfg {Array} textPadding Array of two values: horizontal and vertical padding.
         */
        textPadding: [3, 3],

        /**
         * @cfg {Function/Number} nodeValue
         * By default, the area occupied by the node depends on the number
         * of children the node has, but cannot be zero, so that leaf
         * nodes are still visible.
         */
        nodeValue: function (record) {
            return record.childNodes.length + 1;
        },

        /**
         * If `false`, the text will always be visible, whether it fits inside its
         * container or not.
         * @cfg {Boolean} [clipText=true]
         */
        clipText: true,

        /**
         * @cfg {Boolean} noSizeLayout
         * @private
         */
        noSizeLayout: false
    },

    applyLayout: function () {
        return d3.pack();
    },

    onNodeSelect: function (node, el) {
        this.callParent(arguments);

        // Remove the fill given by the `colorAxis`, so that
        // the CSS style can be used to specify the color
        // of the selection.
        el.select('circle').style('fill', null);
    },

    onNodeDeselect: function (node, el) {
        var me = this,
            colorAxis = me.getColorAxis();

        me.callParent(arguments);

        // Restore the original color.
        // (see 'onNodeSelect' comments).
        el
            .select('circle')
            .style('fill', function (node) {
                return colorAxis.getColor(node);
            });
    },

    updateColorAxis: function (colorAxis) {
        var me = this;

        if (!me.isConfiguring) {
            me.getRenderedNodes()
                .select('circle')
                .style('fill', function (node) {
                    return colorAxis.getColor(node);
                });
        }
    },

    /**
     * @private
     */
    textVisibilityFn: function (selection) {
        // Text padding value is treated as pixels, even if it isn't.
        var me = this,
            textPadding = this.getTextPadding(),
            dx = parseFloat(textPadding[0]) * 2,
            dy = parseFloat(textPadding[1]) * 2;

        selection
            .classed(me.defaultCls.invisible, function (node) {
                // The 'text' attribute must be hidden via the 'visibility' attribute,
                // in addition to setting its 'fill-opacity' to 0, as otherwise
                // it will protrude outside from its 'circle', and may interfere with
                // click and other events on adjacent node elements.
                var bbox = this.getBBox(), // 'this' is SVG 'text' element
                    width = node.r - dx,
                    height = node.r - dy;

                return (bbox.width > width || bbox.height > height);
            });
    },

    addNodes: function (selection) {
        var me = this,
            nodeTransform = me.getNodeTransform(),
            clipText = me.getClipText(),
            labels;

        selection
            .call(me.onNodesAdd.bind(me))
            .call(nodeTransform)
            .append('circle');

        labels = selection
            .append('text')
            .attr('class', me.defaultCls.label);

        if (clipText) {
            labels.call(me.textVisibilityFn.bind(me));
        }

        if (Ext.d3.Helpers.noDominantBaseline()) {
            labels.each(function () {
                Ext.d3.Helpers.fakeDominantBaseline(this, 'central', true);
            });
        }

        labels.attr('opacity', 0);
    },

    updateNodes: function (update, enter) {
        var me = this,
            colorAxis = me.getColorAxis(),
            nodeTransform = me.getNodeTransform(),
            selectionCfg = me.getSelection(),
            nodeText = me.getNodeText(),
            clipText = me.getClipText(),
            selection = update.merge(enter),
            transition = me.layoutTransition,
            text;

        selection
            .transition(transition)
            .call(nodeTransform);

        selection
            .select('circle')
            .transition(transition)
            .attr('r', function (node) {
                return node.r;
            })
            .style('fill', function (node) {
                // Don't set the color of selected element to allow for CSS styling.
                return node.data === selectionCfg ? null : colorAxis.getColor(node);
            });

        text = selection.select('text')
            .text(function (node) {
                return nodeText(me, node);
            });

        if (clipText) {
            text.call(me.textVisibilityFn.bind(me));
        }

        text.transition(transition).attr('opacity', 1)

    },

    removeNodes: function (selection) {
        selection
            .attr('opacity', 1)
            .transition(this.layoutTransition)
            .attr('opacity', 0)
            .remove();
    }

});
