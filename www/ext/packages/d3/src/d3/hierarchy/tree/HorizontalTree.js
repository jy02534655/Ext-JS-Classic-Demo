/**
 * The 'd3-horizontal-tree' component is a perfect way to visualize hierarchical
 * data as an actual tree in case where the relative size of nodes is of little
 * interest, and the focus is on the relative position of each node in the hierarchy.
 * A horizontal tree makes for a more consistent look and more efficient use of space
 * when text labels are shown next to each node.
 *
 *     @example
 *     Ext.create('Ext.panel.Panel', {
 *         renderTo: Ext.getBody(),
 *         title: 'Tree Chart',
 *         layout: 'fit',
 *         height: 500,
 *         width: 700,
 *         items: [
 *             {
 *                 xtype: 'd3-tree',
 *
 *                 store: {
 *                     type: 'tree',
 *                     root: {
 *                         text: 'Sencha',
 *                         expanded: true,
 *                         children: [
 *                             {
 *                                 text: 'IT',
 *                                 expanded: false,
 *                                 children: [
 *                                     {leaf: true, text: 'Norrin Radd'},
 *                                     {leaf: true, text: 'Adam Warlock'}
 *                                 ]
 *                             },
 *                             {
 *                                 text: 'Engineering',
 *                                 expanded: false,
 *                                 children: [
 *                                     {leaf: true, text: 'Mathew Murdoch'},
 *                                     {leaf: true, text: 'Lucas Cage'}
 *                                 ]
 *                             },
 *                             {
 *                                 text: 'Support',
 *                                 expanded: false,
 *                                 children: [
 *                                     {leaf: true, text: 'Peter Quill'}
 *                                 ]
 *                             }
 *                         ]
 *                     }
 *                 },
 *
 *                 interactions: {
 *                     type: 'panzoom',
 *                     zoom: {
 *                         extent: [0.3, 3],
 *                         doubleTap: false
 *                     }
 *                 },
 *
 *                 nodeSize: [200, 30]
 *             }
 *         ]
 *     });
 *
 */
Ext.define('Ext.d3.hierarchy.tree.HorizontalTree', {
    extend: 'Ext.d3.hierarchy.tree.Tree',

    xtype: [
        'd3-tree',
        'd3-horizontal-tree'
    ],

    requires: [
        'Ext.d3.Helpers'
    ],

    config: {
        componentCls: 'horizontal-tree',

        nodeTransform: function (selection) {
            selection.attr('transform', function (node) {
                return 'translate(' + node.y + ',' + node.x + ')';
            });
        }
    },

    pendingTreeAlign: false,

    oldLayoutSaving: true,

    /**
     * @private
     * Marks the tree for alignment after the end of layout (or layout transition).
     */
    alignAfterLayout: function () {
        this.pendingTreeAlign = true;
    },

    onSceneResize: function (scene, rect) {
        var me = this,
            layout = me.getLayout();

        me.alignAfterLayout();

        if (layout.nodeSize()) {

            // `layout.size` and `layout.nodeSize` are mutually exclusive.
            // No need to set layout `size` and perform layout on component resize
            // (as we do in the parent method), if the `nodeSize` is set (fixed),
            // only need to perform layout initially and when data changes.

            if (me.size) {
                this.alignTree();
            } else { // first resize, the scene is empty
                me.performLayout();
            }
        } else {
            me.callParent(arguments);
        }
    },

    onLayout: function () {
        var me = this;

        if (me.pendingTreeAlign) {
            me.pendingTreeAlign = false;
            me.alignTree();
            // Note that after aligning the tree, the changes likely won't be visible
            // until after the next frame (this appears to be a render process optimization
            // on the browser's part). The state of the DOM has changed, however,
            // so this won't prevent the scroll indicators from being updated properly.
        }

        // The parent method will update the scroll indicator and should be called
        // after aligning the tree.
        me.callParent();
    },

    /**
     * @private
     */
    alignTree: function () {
        // It makes no sense aligning the tree, as the tree fills up the whole component area
        // when the node size isn't set.
        if (this.getNodeSize()) {
            this.alignContent('l');
        }
    },

    updateNodeSize: function (nodeSize) {
        var me = this;

        if (nodeSize) {
            // The x and y in `nodeSize` are swapped because the layout is always calculated
            // for a vertical tree, we just interpret the layout differently to render
            // a horizontal tree.
            me.getLayout().nodeSize(nodeSize.slice().reverse());
        } else {
            // We can't just set the `nodeSize` back to null here.
            // The way D3 works, is you have to set the layout size using its `size`
            // method, which will set the `nodeSize` to null automatically because these
            // "configs" are mutually exclusive. If we simply set the `nodeSize` to null,
            // we'd end up with no node size, nor layout size.
            me.setLayoutSize([
                me.sceneRect.width,
                me.sceneRect.height
            ]);
            //<debug>
            if (me.panZoom) {
                Ext.log.warn('With no `nodeSize` set, the `panzoom` interaction is likely redundant. ' +
                    'You can remove it with `component.panZoom.destroy()`. This will also remove any ' +
                    'translation/scaling currently applied to the scene.');
            }
            //</debug>
        }

        if (!me.isConfiguring) {
            me.skipLayoutTransition();
            me.alignAfterLayout();
            me.performLayout();
        }
    },

    setLayoutSize: function (size) {
        // In the 'd3.tree' layout the first entry in the `size` array represents
        // the tree's breadth, and the second one - depth.
        var _ = size[0];
        size[0] = size[1];
        size[1] = _;

        this.callParent([size]);
    },

    onNodesAdd: function (selection) {
        var me = this;

        me.callParent([selection]);

        // `nodeFromRecord` must be called after calling the superclass method
        var node = me.getOldNode(me.nodeFromRecord(me.getSelection()));

        // Position entering nodes at the selected node's position in the previous layout.
        if (node) {
            selection.attr('transform', 'translate(' + node.y + ',' + node.x + ')');
        }
    },

    addNodes: function (selection) {
        var me = this,
            nodeRadius = me.getNodeRadius(),
            labels;

        // If we select a node, the highlight transition kicks off in 'onNodeSelect'.
        // But this can trigger a layout change, if selected node has children and
        // starts to expand, which triggers another transition that cancels the
        // highlight transition.
        //
        // So we need two groups:
        // 1) the outer one will have a translation transition applied to it
        //    on layout change;
        // 2) and the inner one will have a scale transition applied to it on
        //    selection highlight.

        selection.append('circle').attr('opacity', 0);

        labels = selection.append('text').attr('class', me.defaultCls.label)
            .each(function (node) {
                // Note that we can't use node.children here to determine
                // whether the node has children or not, because the
                // default accessor returns node.childNodes (that are saved
                // as node.children) only when the node is expanded.
                var isLeaf = node.data.isLeaf();

                this.setAttribute('x', isLeaf ? nodeRadius + 5 : -5 - nodeRadius);
            })
            .attr('opacity', 0);

        if (Ext.d3.Helpers.noDominantBaseline()) {
            labels.each(function () {
                Ext.d3.Helpers.fakeDominantBaseline(this, 'central', true);
            });
        }
    },

    updateNodes: function (update, enter) {
        var me = this,
            selectionCfg = me.getSelection(),
            nodeTransform = me.getNodeTransform(),
            colorAxis = me.getColorAxis(),
            nodeRadius = me.getNodeRadius(),
            nodeText = me.getNodeText(),
            selection = update.merge(enter),
            transition = me.layoutTransition;

        selection
            .transition(transition)
            .call(nodeTransform);

        selection.select('circle')
            .style('fill', function (node) {
                // Don't set the color of selected element to allow for CSS styling.
                return node.data === selectionCfg ? null : colorAxis.getColor(node);
            })
            .attr('r', nodeRadius)
            .transition(transition)
            .attr('opacity', 1);

        selection.select('text')
            .text(function (node) {
                return nodeText(me, node);
            })
            .transition(transition)
            .attr('opacity', 1);
    },

    removeNodes: function (selection) {
        var me = this,
            selectedNode = me.nodeFromRecord(me.getSelection());

        // We want to transition the exiting nodes from their current position to their
        // parent's position before removing them. Typically, this will be the selected
        // node, as the nodes will be exiting as a result of a mouse/pointer event that
        // selected the collapsing node.

        selection
            .attr('opacity', 1)
            .transition(me.layoutTransition)
            .attr('opacity', 0)
            .attr('transform', function (node) {
                var p = node.parent, // This is the node's parent from the old layout;
                    // we need to find it in the new layout for a proper looking transition.
                    d = selectedNode || p && me.nodeFromRecord(p.data),
                    x = d && d.x || 0,
                    y = d && d.y || 0;

                return 'translate(' + y + ',' + x + ')';
            })
            .remove();
    },

    getLinkPath: function (link) {
        var midY = (link.source.y + (link.target.y - link.source.y) / 2);

        return 'M' + link.source.y + ',' + link.source.x
             + 'C' + midY          + ',' + link.source.x
             + ' ' + midY          + ',' + link.target.x
             + ' ' + link.target.y + ',' + link.target.x;
    },

    addLinks: function (selection) {
        var me = this,
            selectedNode = me.nodeFromRecord(me.getSelection());

        return selection
            .append('path')
            .classed(me.defaultCls.link, true)
            .attr('d', function (link) {
                var source = selectedNode || link.source,
                    xy = me.getOldNode(source),
                    x = xy ? xy.x : source.x,
                    y = xy ? xy.y : source.y;

                return 'M' + y + ',' + x
                     + 'C' + y + ',' + x
                     + ' ' + y + ',' + x
                     + ' ' + y + ',' + x;
            })
            .attr('opacity', 0);
    },

    updateLinks: function (update, enter) {
        var me = this,
            selection = update.merge(enter),
            transition = me.layoutTransition,
            isRootHidden = !me.getRootVisible();

        selection
            .classed(me.defaultCls.hidden, function (link) {
                return isRootHidden && link.source.data === me.storeRoot;
            })
            .transition(transition)
            .attr('d', me.getLinkPath)
            .attr('opacity', 1);
    },

    removeLinks: function (selection) {
        var me = this,
            selectedNode = me.nodeFromRecord(me.getSelection());

        selection
            .attr('opacity', 1)
            .transition(me.layoutTransition)
            .attr('opacity', 0)
            .attr('d', function (link) {
                var s = link.source, // This is the source from the old layout;
                    // we need to find it in the new layout for a proper looking transition.
                    node = selectedNode || s && me.nodeFromRecord(s.data),
                    x = node && node.x || 0,
                    y = node && node.y || 0;

                return 'M' + y + ',' + x
                     + 'C' + y + ',' + x
                     + ' ' + y + ',' + x
                     + ' ' + y + ',' + x;
            })
            .remove();
    }

});