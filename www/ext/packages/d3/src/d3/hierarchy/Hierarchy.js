/**
 * Abstract class for D3 components using
 * [Hierarchy Layout](https://github.com/d3/d3-hierarchy).
 * The Hierarchy component uses the root {@link Ext.data.TreeModel node} of a bound
 * {@link Ext.data.NodeStore node store} to compute positions of all nodes,
 * as well as objects representing the links from parent to child for each node.
 *
 * Each node is a `d3.hierarchy` instance. Several attributes are populated on each node:
 * - `data` - the Ext.data.TreeModel instance associated with the node.
 * - `parent` - the parent node, or null for the root.
 * - `children` - the array of child nodes, or null for leaf nodes.
 * - `value` - the node value, as returned by the value accessor.
 * - `depth` - the depth of the node, starting at 0 for the root.
 * - `x` - the minimum x-coordinate of the node position.
 * - `y` - the minimum y-coordinate of the node position.
 *
 * Each link is an object with two attributes:
 * - `source` - the parent node.
 * - `target` - the child node.
 *
 * The class also provides an ability to color code each node with the
 * {@link Ext.d3.axis.Color}.
 */
Ext.define('Ext.d3.hierarchy.Hierarchy', {
    extend: 'Ext.d3.svg.Svg',

    requires: [
        'Ext.d3.axis.Color',
        'Ext.plugin.MouseEnter'
    ],

    mixins: [
        'Ext.d3.mixin.ToolTip'
    ],

    config: {
        /**
         * @cfg {String} hierarchyCls
         * The class name added to all hieararchy components (subclasses).
         * See also {@link #componentCls}.
         */
        hierarchyCls: 'hierarchy',

        /**
         * @cfg {Ext.data.TreeModel} selection
         * The selected record. Typically used with {@link #bind binding}.
         */
        selection: null,

        /**
         * @cfg {Ext.d3.axis.Color} colorAxis
         * A {@link Ext.d3.axis.Color} config or an instance.
         * By default (if no 'colorAxis' config is given) all nodes
         * are assigned a unique color from the `d3.scale.category20c`
         * scale (until the colors run out, then we start to reuse them)
         * based on the value of the `name` field.
         */
        colorAxis: {
            scale: {
                type: 'ordinal',
                // The last 4 colors are shades of gray.
                range: 'd3.schemeCategory20c.slice(0, -4)'
            },
            field: 'name'
        },

        /**
         * @cfg {Function} nodeChildren
         * [Children](https://github.com/d3/d3-hierarchy/#hierarchy) accessor function.
         * Defaults to returning node's {@link Ext.data.NodeInterface#childNodes child nodes},
         * if the node is {@link Ext.data.NodeInterface#expanded expanded} or null otherwise
         * (meaning children of collapsed nodes are not rendered).
         * @param {Ext.data.TreeModel} record An instance of the TreeModel class.
         * @return {Ext.data.TreeModel[]}
         */
        nodeChildren: function (record) {
            return record.isExpanded() ? record.childNodes : null;
        },

        /**
         * @cfg {Function} nodeClass
         * A function that updates class attributes of a given selection.
         * By default adds the following classes to node elements:
         * - `x-d3-parent` - if a node is a parent node;
         * - `x-d3-leaf` - if a node is a leaf node;
         * - `x-d3-expanded` - if a node is expanded;
         * - `x-d3-root` - if a node is the root node (represents the root of the store);
         * - `x-d3-layout-root` - if a node is the root node of the current layout.
         * @param {d3.selection} selection
         */
        nodeClass: undefined,

        /**
         * @cfg {Function/String/String[]} nodeText
         * A function that returns a text string, given a component and  node (d3.hierarchy) instance.
         * Alternatively, can be a field name or an array of field names used to fetch the text.
         * If array of field names is given, the first non-empty string will be used.
         * A node holds a reference to the {@link Ext.data.TreeModel} instance
         * in its `data` field.
         * For example, to return the value of the record's field `name` as node's text
         * the following function can be used:
         *
         *     nodeText: function (component, node) {
         *         var record = node.data,
         *             text = record.get('name');
         *
         *         return text;
         *     }
         *
         * Or simply:
         *
         *     nodeText: 'name'
         *
         * To return the value of the `title` field, if the `name` field is empty:
         *
         *     nodeText: ['name', 'title']
         *
         * @param {Ext.d3.hierarchy.Hierarchy} component
         * @param {d3.hierarchy} node
         * @return {String}
         */
        nodeText: ['name', 'text'],

        /**
         * @cfg {Function} sorter
         * The [comparator](https://github.com/d3/d3-hierarchy#node_sort)
         * function that determines the sort order of sibling nodes.
         * Invoked for pairs of nodes.
         * Normally, one should use the store's `sorters` config instead of this one.
         * @param {d3.hierarchy} nodeA
         * @param {d3.hierarchy} nodeB
         * @return {Number}
         * @private
         */
        sorter: null,

        /**
         * @cfg {Function} nodeTransform
         * The function that transforms (typically, positions) every node
         * in the given selection.
         * @param {d3.selection} selection
         * @private
         */
        nodeTransform: function (selection) {
            selection.attr('transform', function (node) {
                return 'translate(' + node.x + ',' + node.y + ')';
            });
        },

        /**
         * @cfg {Function/String/Number} [nodeValue=1]
         * [The function](https://github.com/d3/d3-hierarchy#node_sum) that receives
         * the node's data (tree store record) and returns the numeric value of the node.
         * This config can also be a field name or a number, in which case it will be
         * converted to a function that returns the value of the specified field,
         * or a function that returns the given number for all nodes.
         * Note: {@link #nodeChildren} does not have effect on this config, even
         * though only expanded nodes will render by default, the `nodeValue`
         * function will be called for all nodes.
         * @param {Ext.data.TreeModel} record The data of the node (store record).
         * @return {Number} Numeric value of the node used to calculate its area.
         */
        nodeValue: 1,

        /**
         * @cfg {Boolean} [noParentValue=false]
         * If `true` the {@link #nodeValue} function will not be called for parent nodes,
         * instead they'll get a value of zero.
         * The {@link #nodeChildren} function is used to determine if a node is a parent.
         */
        noParentValue: false,

        /**
         * @cfg {Function} nodeKey
         * The [key](https://github.com/d3/d3-selection/#selection_data) function for nodes.
         * Returns the 'id' of the node's {@link Ext.data.TreeModel data} by default.
         * @param {d3.hierarchy} node
         * @param {Number} index
         * @return {String}
         */
        nodeKey: function (node, index) {
            return node.data.id;
        },

        /**
         * The [key](https://github.com/d3/d3-selection/#selection_data) function for links.
         * Returns the 'id' of the link's target {@link Ext.data.TreeModel data} by default.
         * @cfg {Function} linkKey
         * @param {Object} link
         * @param {d3.hierarchy} link.source
         * @param {d3.hierarchy} link.target
         * @param {Number} index
         * @return {*}
         */
        linkKey: function (link, index) {
            return link.target.data.id;
        },

        /**
         * @cfg {String/String[]} selectEventName
         * The select event(s) to listen for on each node.
         * The node in question will be selected,
         * selection will be removed from the previously selected node.
         * The select event won't be handled when Ctrl/Cmd is pressed.
         * For example, this allows to expand a node by double-clicking
         * without selecting it.
         * `null` can be used to prevent listening for the default event.
         */
        selectEventName: 'click',

        /**
         * @cfg {String/String[]} expandEventName
         * The expand event(s) to listen for on each node.
         * The node in question will be expanded, if collapsed,
         * or collapsed, if expanded.
         * `null` can be used to prevent listening for the default event.
         */
        expandEventName: 'dblclick',

        /**
         * @cfg {Boolean} rootVisible
         * False to hide the root node.
         */
        rootVisible: true,

        /**
         * @cfg {Function} layout
         * @protected
         * Subclasses are expected to create and return the layout inside `applyLayout`.
         */
        layout: undefined,

        /**
         * @cfg {Boolean} noSizeLayout
         * If `true`, layout will be performed on data change
         * even if component has no size yet.
         * @private
         */
        noSizeLayout: true,

        /**
         * @cfg {Boolean} renderLinks
         * @private
         */
        renderLinks: false, // TODO: have a method with the same name!,

        transitions: {
            layout: {
                duration: 500,
                ease: 'cubicInOut'
            },
            select: {
                duration: 150, // 300ms total (scale up + scale down)
                ease: 'cubicInOut',
                sourceScale: 1,
                targetScale: 1.07
            }
        }
    },

    /**
     * @cfg
     * @inheritdoc
     */
    publishes: 'selection',

    /**
     * @event layout
     * Fires after the layout and render have been completed.
     * If a layout transition is used (default), fires on transition end.
     * @param {Ext.d3.hierarchy.Hierarchy} component
     * @private
     */

    /**
     * @property {d3.hierarchy} root
     * The root node.
     * @private
     */
    root: null,
    /**
     * @private
     * Cached results of the most recent hierarchy layout.
     */
    nodes: null, // layout.nodes result

    links: null, // layout.links result

    defaultCls: {
        links: Ext.baseCSSPrefix + 'd3-links',
        nodes: Ext.baseCSSPrefix + 'd3-nodes',
        link: Ext.baseCSSPrefix + 'd3-link',
        node: Ext.baseCSSPrefix + 'd3-node',
        root: Ext.baseCSSPrefix + 'd3-root',
        label: Ext.baseCSSPrefix + 'd3-label',
        parent: Ext.baseCSSPrefix + 'd3-parent',
        leaf: Ext.baseCSSPrefix + 'd3-leaf',
        selected: Ext.baseCSSPrefix + 'd3-selected',
        expanded: Ext.baseCSSPrefix + 'd3-expanded'
    },

    /**
     * @private
     * Cached config used by {@link #defaultNodeClass}. For example:
     *
     *     {
     *         expanded: function (node) { return node.data.isExpanded(); },
     *         root: function (node) { return node.data.isRoot(); },
     *     }
     */
    nodeClassCfg: null,

    mouseEnterPlugin: null,

    constructor: function (config) {
        var me = this;

        me.callParent([config]);
        me.mixins.d3tooltip.constructor.call(me, config);
    },

    applyTooltip: function (tooltip, oldTooltip) {
        if (tooltip) {
            tooltip.delegate = 'g.' + this.defaultCls.node;
        }
        return this.mixins.d3tooltip.applyTooltip.call(this, tooltip, oldTooltip);
    },

    updateTooltip: null, // Override the updater in Modern component.

    defaultNodeClass: function (selection) {
        var me = this,
            cls = me.defaultCls,
            config = me.nodeClassCfg,
            name;

        if (!config) {
            me.nodeClassCfg = config = {};
            config[cls.parent] = function (node) {
                return !node.data.isLeaf();
            };
            config[cls.leaf] = function (node) {
                return node.data.isLeaf();
            };
            config[cls.expanded] = function (node) {
                return node.data.isExpanded();
            };
            config[cls.root] = function (node) {
                return node === me.root;
            };
        }

        for (name in config) {
            selection.classed(name, config[name]);
        }
    },

    applyColorAxis: function (colorAxis, oldColorAxis) {
        if (colorAxis && !colorAxis.isColorAxis) {
            colorAxis = new Ext.d3.axis.Color(colorAxis);
        }
        return colorAxis || oldColorAxis;
    },

    applyNodeText: function (nodeText) {
        var fn;

        if (typeof nodeText === 'function') {
            fn = nodeText;
        } else if (typeof nodeText === 'string') {
            fn = function (component, node) {
                var data = node && node.data && node.data.data;
                return data && data[nodeText] || '';
            };
        } else if (Array.isArray(nodeText)) {
            fn = function (component, node) {
                var data = node && node.data && node.data.data,
                    text, i;

                if (data) {
                    for (i = 0; i < nodeText.length && !text; i++) {
                        text = data[nodeText[i]];
                    }
                }

                return text || '';
            };
        }
        //<debug>
        else {
            Ext.raise('nodeText must be a string, array of strings, or a function that returns a string.');
        }
        //</debug>

        return fn;
    },

    applyNodeClass: function (nodeClass, oldNodeClass) {
        var result;

        if (Ext.isFunction(nodeClass)) {
            result = nodeClass;
        } else if (oldNodeClass) {
            result = oldNodeClass;
        } else {
            result = this.defaultNodeClass;
        }

        if (result) {
            result = result.bind(this);
        }

        return result;
    },

    applyNodeTransform: function (nodeTransform) {
        if (nodeTransform) {
            nodeTransform = nodeTransform.bind(this);
        }
        return nodeTransform;
    },

    updateHierarchyCls: function (hierarchyCls, oldHierarchyCls) {
        var baseCls = this.baseCls,
            el = this.element;

        if (hierarchyCls && Ext.isString(hierarchyCls)) {
            el.addCls(hierarchyCls, baseCls);
            if (oldHierarchyCls) {
                el.removeCls(oldHierarchyCls, baseCls);
            }
        }
    },

    applyStore: function (store, oldStore) {
        var result = store && Ext.StoreManager.lookup(store, 'tree');

        if (result && !result.isTreeStore) {
            Ext.raise('The store must be a Ext.data.TreeStore.');
        }

        return result;
    },

    applyNodeValue: function (nodeValue) {
        var noParentValue = this.getNoParentValue(),
            nodeChildren = this.getNodeChildren(),
            fn, result;

        if (typeof nodeValue === 'string') {
            fn = function (record) {
                return record.data[nodeValue];
            };
        } else if (Ext.isNumber(nodeValue)) {
            fn = function () {
                return nodeValue;
            };
        } else if (typeof nodeValue === 'function') {
            fn = nodeValue;
        }

        if (fn) {
            if (noParentValue) {
                result = function (record) {
                    return nodeChildren(record) ? 0 : fn.call(this, record);
                };
            } else {
                result = fn.bind(this);
            }
        }

        return result;
    },

    updateNodeValue: function () {
        if (!this.isConfiguring) {
            this.performLayout();
        }
    },

    updateNodeChildren: function () {
        if (!this.isConfiguring) {
            this.performLayout();
        }
    },

    updateSorter: function (sorter) {
        if (!this.isConfiguring) {
            this.performLayout();
        }
    },

    /**
     * @private
     * Looks up `node` in the given `selection` by node's ID and returns node's element,
     * as a D3 selection. Notes:
     * - `selection` should have DOM elements bound (should consist of rendered nodes);
     * - the returned selection can be empty, if the node wasn't found; `selection.empty()`
     *   can be used to check this;
     * - in most cases using the {@link #selectionFromRecord} method is preferable, as it is faster;
     *   however this method will find the node's element even if the enter selection
     *   was not passed to the `onNodesAdd` method.
     * @param {d3.hierarchy} node
     * @param {d3.selection} [selection] Defaults to all rendered nodes, if omitted.
     * @return {d3.selection} Node's element, as a D3 selection.
     */
    findNode: function (node, selection) {
        selection = selection || this.getRenderedNodes();

        return selection.filter(function (d) {
            return node && (d.data.id === node.data.id || d === node);
        });
    },

    /**
     * Returns the associated rendered node.
     * The returned value can be `null`, if the given record doesn't have a DOM representation.
     * @param {Ext.data.TreeModel} record
     * @return {d3.hierarchy} `d3.hierarchy` instance or null, if the node wasn't found.
     */
    nodeFromRecord: function (record) {
        var selection = record && this.selectionFromRecord(record);

        return selection && !selection.empty() ? selection.datum() : null;
    },

    /**
     * Selects the associated DOM element in the scene and returns it as a D3 selection.
     * The returned selection can be empty, if the given record doesn't have a DOM representation.
     * @param {Ext.data.TreeModel} record
     * @return {d3.selection}
     */
    selectionFromRecord: function (record) {
        //<debug>
        if (!record || !record.isModel) {
            Ext.raise('Passed parameter should be a model instance.');
        }
        //</debug>
        return this.scene.select('[data-id="' + record.id + '"]');
    },

    /**
     * @private
     * Checks if the record belongs to the component's store.
     * @param {Ext.data.TreeModel} record
     * @return {Boolean}
     */
    isRecordInStore: function (record) {
        var store = this.getStore();

        return !!(record && record.isModel && store && !store.isEmptyStore && (
            record.store === store || store.getNodeById(record.id) === record || store.getRoot() === record
        ));
    },

    applySelection: function (record) {
        //<debug>
        if (record && !record.isModel) {
            Ext.raise("The 'record' should be a Ext.data.TreeModel instance.");
        }
        //</debug>
        return this.isRecordInStore(record) ? record : null;
    },

    updateSelection: function (record, oldRecord) {
        var me = this,
            recordSelection, oldRecordSelection, hasElement;

        if (!me.hasFirstRender) {
            if (record) {
                me.on({
                    scenerender: me.updateSelection.bind(me, record, oldRecord),
                    single: true
                });
            }
            return;
        }

        if (record) {
            recordSelection = me.selectionFromRecord(record);
            hasElement = !recordSelection.empty();
            if (hasElement) {
                me.onNodeSelect(record, recordSelection);
            } else {
                // Set the value of the config to `null` here, as for the applier to return
                // `null` in this case, it should perform the element check as well.
                // If the check is performed in the applier, we still cannot remove it here,
                // because we need to call `selectionFromRecord` anyway to get the element.
                me[me.self.getConfigurator().configs.selection.names.internal] = null;
                Ext.log.warn('Selected record "' + record.id +
                    '" does not have an associated element. E.g.:\n' +
                    '- record was selected before it was rendered;\n' +
                    '- record was selected in some other view, but is not supposed ' +
                    'to be rendered by this D3 component (see "nodeChildren" config).');
            }
        }

        if (oldRecord) {
            oldRecordSelection = me.selectionFromRecord(oldRecord);
            if (!oldRecordSelection.empty()) {
                me.onNodeDeselect(oldRecord, oldRecordSelection);
            }
        }

        if (hasElement) {
            me.fireEvent('selectionchange', me, record, oldRecord);
        }
    },

    /**
     * @protected
     * @param {Ext.data.TreeModel} record
     * @param {d3.selection} selection
     */
    onNodeSelect: function (record, selection) {
        selection.classed(this.defaultCls.selected, true);
        this.fireEvent('select', this, record, selection);
    },

    /**
     * @protected
     * @param {Ext.data.TreeModel} record
     * @param {d3.selection} selection
     */
    onNodeDeselect: function (record, selection) {
        selection.classed(this.defaultCls.selected, false);
        this.fireEvent('deselect', this, record, selection);
    },

    /**
     * @protected
     * All nodes that are added to the scene by the {@link #addNodes} method
     * are expected to be passed to this method (as a D3 selection).
     * @param {d3.selection} selection
     */
    onNodesAdd: function (selection) {
        var me = this;

        selection
            .attr('class', me.defaultCls.node)
            .each(function (node) {
                // A node doesn't store a reference to the associated DOM element
                // (if any), unlike the element, which stores a reference
                // to the associated node in the `__data__` property.
                // To make finding corresponding DOM elements easier, `data-id` of the node's
                // group element will correspond to the ID of the node's record (Ext.data.TreeModel).
                // See the `selectionFromRecord` method for example.
                this.setAttribute('data-id', node.data.id);
            });
    },

    /**
     * @protected
     * Adds delegated listeners to handle pointer events for all child nodes
     */
    addNodeListeners: function () {
        var me = this,
            selectEventName = Ext.Array.from(me.getSelectEventName()),
            expandEventName = Ext.Array.from(me.getExpandEventName()),
            i, len;

        for (i = 0, len = selectEventName.length; i < len; i++) {
            me.addNodeListener(selectEventName[i], me.onSelectEvent);
        }
        for (i = 0, len = expandEventName.length; i < len; i++) {
            me.addNodeListener(expandEventName[i], me.onExpandEvent);
        }
    },

    /**
     * @private
     */
    updateEventName: function (name, oldName, handler) {
        var me = this,
            names = Ext.Array.from(name),
            oldNames = Ext.Array.from(oldName),
            i, ln;

        for (i = 0, ln = oldNames.length; i < ln; i++) {
            me.removeNodeListener(oldNames[i], handler);
        }
        for (i = 0, ln = names.length; i < ln; i++) {
            me.addNodeListener(names[i], handler);
        }
    },

    updateSelectEventName: function (name, oldName) {
        this.updateEventName(name, oldName, this.onSelectEvent);
    },

    updateExpandEventName: function (name, oldName) {
        this.updateEventName(name, oldName, this.onExpandEvent);
    },

    /**
     * @private
     * Adds a delegated node listener.
     * @param {String} eventName
     * @param {Function} handler
     */
    addNodeListener: function(eventName, handler) {
        var me = this,
            targetEl = me.el;

        if (eventName === 'mouseenter') {
            me.mouseEnterPlugin = me.addPlugin({
                type: 'mouseenter',
                element: targetEl,
                delegate: 'g.' + me.defaultCls.node,
                handler: handler
            });
        } else if (eventName) {
            targetEl.on(eventName, handler, me, {
                delegate: 'g.' + me.defaultCls.node
            });
        }
    },

    /**
     * @private
     * Removes a delegated node listener.
     * @param {String} eventName
     * @param {Function} handler
     */
    removeNodeListener: function(eventName, handler) {
        var me = this,
            targetEl = me.el;

        if (eventName === 'mouseenter') {
            Ext.destroy(me.mouseEnterPlugin);
        } else if (eventName) {
            targetEl.un(eventName, handler, me, {
                delegate: 'g.' + me.defaultCls.node
            });
        }
    },

    onSelectEvent: function (event, target) {
        // Fetching the 'node' and 'element' this way is not exactly pretty,
        // but arguably better than capturing 'addNodeListeners' arguments
        // in a closure for every element listener.
        var selection = d3.select(target),
            element = selection.node(),
            node = selection.datum();

        this.handleSelectEvent(event, node, element);
    },

    handleSelectEvent: function (event, node, element) {
        this.setSelection(node.data);
    },

    onExpandEvent: function (event) {
        var selection = d3.select(event.currentTarget),
            element = selection.node(),
            node = selection.datum();

        this.handleExpandEvent(event, node, element);
    },

    handleExpandEvent: function (event, node, element) {
        var record = node.data;

        if (record.isExpanded()) {
            record.collapse();
        } else {
            record.expand();
        }
    },

    /**
     * @protected
     * Sets the size of a hierarchy layout via its 'size' method.
     * @param {Number[]} size The size of the scene.
     */
    setLayoutSize: function (size) {
        var layout = this.getLayout();

        layout.size(size);
    },

    getLayoutSize: function () {
        var layout = this.getLayout();

        return layout.size && layout.size();
    },

    onSceneResize: function (scene, rect) {
        this.callParent([scene, rect]);
        this.setLayoutSize([rect.width, rect.height]);
        this.performLayout();
    },

    hasFirstLayout: false,
    hasFirstRender: false,
    isLayoutTransitionSkipped: false,

    oldLayoutSaving: false, // whether the previous layout should be saved or not
    oldNodes: null, // nodes from the previous layout
    oldLinks: null, // links from the previous layout

    /**
     * @private
     */
    isLayoutBlocked: Ext.emptyFn,

    /**
     * @private
     * Marks the layout transition to be skipped once.
     */
    skipLayoutTransition: function () {
        this.isLayoutTransitionSkipped = true;
    },

    processDataChange: function (store) {
        if (this.getNoSizeLayout() || this.size) {
            this.performLayout();
        }
    },

    setupScene: function (scene) {
        var me = this;

        me.callParent([scene]);

        // Links should render before nodes.
        // A node is rendered at a certain coordinate, which is typically
        // the center of a node, and so a link is a connection between
        // the centers of a pair of nodes. Usually, we want it to appear
        // as if a link goes edge to edge, not center to center.

        // However, this alone is not enough, because if a node itself is not
        // updated, e.g. it's already visible and we simply show its children,
        // the links will still be painted on top. Because SVG has no z-index and
        // the elements are rendered in the order in which they appear in the document,
        // the nodes have to be either sorted or placed in pre-sorted groups. We do
        // the latter here.

        me.linksGroup = scene.append('g').classed(me.defaultCls.links, true);
        me.nodesGroup = scene.append('g').classed(me.defaultCls.nodes, true);
    },

    /**
     * Uses bound store records to calculate the layout of nodes and links
     * and re-renders the scene.
     */
    performLayout: function () {
        var me = this,
            store = me.getStore(),
            storeRoot = store && store.getRoot(),
            rootVisible = me.getRootVisible(),
            layout = me.getLayout(),
            root, nodes, links,
            layoutRoot;

        if (!storeRoot || me.isInitializing || me.isLayoutBlocked(layout)) {
            return;
        }

        if (!rootVisible && storeRoot.data.autoRoot && storeRoot.childNodes.length === 1) {
            layoutRoot = storeRoot.firstChild;
        } else {
            layoutRoot = storeRoot;
        }

        var sorter = me.getSorter(),
            renderLinks = me.getRenderLinks(),
            nodeChildren = me.getNodeChildren(),
            nodeValue = me.getNodeValue();

        // Make sure we have the scene created and set up.
        me.getScene();

        me.oldLayoutSaving && me.saveLayout(me.nodes, me.links);

        root = d3.hierarchy(layoutRoot, nodeChildren).sum(nodeValue);

        if (sorter) {
            root = root.sort(sorter);
        }

        me.storeRoot = storeRoot;
        me.root = root = layout(root);

        nodes = me.nodes = root.descendants();

        if (renderLinks) {
            links = me.links = root.links();
        }

        me.hasFirstLayout = true;

        me.renderScene(nodes, links);
    },

    saveLayout: function (nodes, links) {
        var me = this,
            map = {},
            i, ln, node;

        me.oldNodes = map;

        if (nodes) {
            for (i = 0, ln = nodes.length; i < ln; i++) {
                node = nodes[i];
                map[node.data.id] = node;
            }
        }

        me.oldLinks = links;
    },

    getOldNode: function (node) {
        return node && this.oldNodes && this.oldNodes[node.data.id];
    },

    /**
     * Renders arrays of nodes and links, returned by the
     * [rootNode.descendants()](https://github.com/d3/d3-hierarchy/#node_descendants)
     * and [rootNode.links()](https://github.com/d3/d3-hierarchy/#node_links)
     * methods, respectively.
     * Both `nodes` and `links` arguments are optional and, if not specified,
     * the method re-renders nodes/links produced by the most recent layout.
     * @param {Array} [nodes]
     * @param {Array} [links]
     */
    renderScene: function (nodes, links) {
        var me = this,
            nodeKey = me.getNodeKey(),
            linkKey = me.getLinkKey(),
            nodeSelection,
            linkSelection;

        if (!me.hasFirstLayout) {
            me.performLayout();
        }

        // If several D3 components are using the same store,
        // updates can be slow. If some of the components are not visible,
        // it may not be obvious why updates are slow.

        nodes = nodes || me.nodes;
        links = links || me.links;

        me.onBeforeRender(nodes, links);

        if (nodes) {
            nodeSelection = me.getRenderedNodes().data(nodes, nodeKey);
            me.renderNodes(nodeSelection);
            if (links) {
                linkSelection = me.getRenderedLinks().data(links, linkKey);
                me.renderLinks(linkSelection);
            }
        }

        me.hideRoot();

        me.hasFirstRender = true;

        me.onAfterRender(nodeSelection, linkSelection);
        me.fireEvent('scenerender', me, nodeSelection, linkSelection);
    },

    getRenderedNodes: function () {
        return this.nodesGroup.selectAll('.' + this.defaultCls.node);
    },

    getRenderedLinks: function () {
        return this.linksGroup.selectAll('.' + this.defaultCls.link);
    },

    /**
     * @private
     */
    hideRoot: function () {
        var me = this,
            rootVisible = me.getRootVisible();

        me.nodesGroup
            .select('.' + me.defaultCls.root)
            .classed(me.defaultCls.invisible, !rootVisible);
    },

    /**
     * @private
     * See `renderNodes` comments.
     * @param {d3.selection} update
     */
    renderLinks: function (update) {
        this.updateLinks(update, this.addLinks(update.enter()));
        this.removeLinks(update.exit());
    },

    /**
     * @private
     * The groups for the entering nodes will be created automatically
     * by this base class and passed to the `updateNodes` as the second
     * parameter, so the `addNodes` doesn't have to return anything.
     * The assumption is that a component will always render nodes, unlike links,
     * so the `addLinks` method should always return the links it created.
     * @param {d3.selection} update
     */
    renderNodes: function (update) {
        var me = this,
            nodeClass = me.getNodeClass(),
            enter = update.enter().append('g');

        enter.call(me.onNodesAdd.bind(me));
        me.addNodes(enter);

        enter.call(nodeClass);
        update.call(nodeClass);

        me.updateNodes(update, enter);
        me.removeNodes(update.exit());

    },

    /**
     * The current layout transition.
     * Only active for its duration from the time of the `renderScene` call.
     * @property
     */
    layoutTransition: null,

    onBeforeRender: function () {
        var me = this,
            useTransition = me.hasFirstRender && !me.isLayoutTransitionSkipped,
            transition = me.createTransition(useTransition ? 'layout' : 'none');

        me.isLayoutTransitionSkipped = false;

        // D3's `on` does not have the scope parameter (the third param is `capture`),
        // so we use a closure here.
        me.layoutTransition = transition.on('end', function () {
            me.layoutTransition = null;

            if (!(me.destroyed || me.destroying)) {
                me.onLayout();
            }
        });
    },

    /**
     * @private
     */
    onLayout: function () {
        var me = this;

        if (me.panZoom) {
            me.panZoom.updateIndicator();
        }

        me.fireEvent('layout', me);
    },

    /**
     * @private
     */
    onAfterRender: Ext.emptyFn,

    /**
     * @protected
     * @param {d3.selection} selection The `update` selection for links.
     */
    updateLinks: Ext.emptyFn,

    /**
     * @protected
     * @param {d3.selection} selection The `enter` selection to populate with links.
     * @return {d3.selection} The added links.
     */
    addLinks: Ext.emptyFn,

    /**
     * @protected
     * @param {d3.selection} selection The `update` selection for nodes.
     */
    updateNodes: Ext.emptyFn,

    /**
     * @protected
     * @param {d3.selection} selection The `enter` selection to populate with nodes.
     * @return {d3.selection} The added nodes.
     */
    addNodes: Ext.emptyFn,

    /**
     * @protected
     * @param {d3.selection} selection The `exit` selection for links.
     */
    removeLinks: function (selection) {
        selection.remove();
    },

    /**
     * @protected
     * @param {d3.selection} selection The `exit` selection for nodes.
     */
    removeNodes: function (selection) {
        selection.remove();
    }

});
