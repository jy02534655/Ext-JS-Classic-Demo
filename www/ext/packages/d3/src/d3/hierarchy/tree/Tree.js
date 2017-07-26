/**
 * Abstract class for D3 components
 * with the [Tree layout](https://github.com/d3/d3-hierarchy/#tree).
 */
Ext.define('Ext.d3.hierarchy.tree.Tree', {
    extend: 'Ext.d3.hierarchy.Hierarchy',

    config: {
        treeCls: 'tree',

        nodeTransform: null,

        /**
         * @private
         * Specifies a fixed distance between the parent and child nodes.
         * By default, the distance is `tree depth / (number of tree levels - 1)`.
         * @cfg {Number} [depth=0]
         */
        depth: 0,

        /**
         * The radius of the circle that represents a node.
         * @cfg {Number} [nodeRadius=5]
         */
        nodeRadius: 5,

        nodeTransition: true,

        /**
         * [Fixed size](https://github.com/mbostock/d3/wiki/Tree-Layout#nodeSize),
         * of each node as a two-element array of numbers representing x and y.
         * Note that if the `nodeSize` config is not set,
         * the [layout size](https://github.com/d3/d3-hierarchy/blob/master/README.md#tree_size)
         * will be set to the size of the component's {@link #getScene scene}, but the resulting
         * tree node layout is not guaranteed to stretch to fill the whole scene.
         * @cfg {Number[]} nodeSize
         */
        nodeSize: null,

        noSizeLayout: false,

        renderLinks: true,

        transitions: {
            select: {
                targetScale: 1.5
            }
        }
    },

    updateTreeCls: function (treeCls, oldTreeCls) {
        var baseCls = this.baseCls,
            el = this.element;

        if (treeCls && Ext.isString(treeCls)) {
            el.addCls(treeCls, baseCls);
            if (oldTreeCls) {
                el.removeCls(oldTreeCls, baseCls);
            }
        }
    },

    applyLayout: function () {
        return d3.tree();
    },

    updateNodeSize: function (nodeSize) {
        var layout = this.getLayout();

        layout.nodeSize(nodeSize);
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

    hideRoot: function () {
        // Overriding the parent method here.
        // With trees, we have to have the root hidden via
        // `display: none` instead of `visibility: hidden`,
        // so that the hidden nodes are not visible to
        // `svgElement.getBBox`. In all other cases, hiding
        // via `visibility: hidden` is the preferred way,
        // because we can still measure hidden things.
        var me = this,
            rootVisible = me.getRootVisible();

        me.nodesGroup
            .select('.' + me.defaultCls.root)
            .classed(me.defaultCls.hidden, !rootVisible);
    },

    onNodeSelect: function (node, el) {
        var me = this,
            transitionCfg = me.getTransitions().select,
            to = transitionCfg.targetScale,
            from = transitionCfg.sourceScale,
            transition = me.createTransition('select'),
            circle = el.select('circle');

        me.callParent(arguments);

        // Remove the fill given by the `colorAxis`, so that
        // the CSS style can be used to specify the color
        // of the selection.
        circle.style('fill', null);

        if (transition.duration()) {
            circle
                .transition(transition)
                .attr('transform', 'scale(' + to +  ',' + to + ')')
                .transition(transition)
                .attr('transform', 'scale(' + from +  ',' + from + ')');
        }
    },

    onNodeDeselect: function (node, el) {
        var me = this,
            colorAxis = me.getColorAxis();

        me.callParent(arguments);

        // Restore the original color.
        // (see 'onNodeSelect' comments).
        el.select('circle')
            .style('fill', function (node) {
                return colorAxis.getColor(node);
            });
    }

});
