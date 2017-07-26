/**
 * Base implementation of a pivot axis. You may customize multiple dimensions
 * on an axis. Basically this class stores all labels that were generated
 * for the configured dimensions.
 *
 * Example:
 *
 *      leftAxis: [{
 *          dataIndex:  'person',
 *          header:     'Person',
 *          sortable:   false
 *      },{
 *          dataIndex:  'country',
 *          header:     'Country',
 *          direction:  'DESC'
 *      }]
 *
 */
Ext.define('Ext.pivot.axis.Base', {
    alternateClassName: [
        'Mz.aggregate.axis.Abstract'
    ],

    alias: 'pivotaxis.base',

    mixins: [
        'Ext.mixin.Factoryable'
    ],

    requires: [
        'Ext.pivot.MixedCollection',
        'Ext.pivot.dimension.Item',
        'Ext.pivot.axis.Item'
    ],

    /**
     * @cfg {Ext.pivot.dimension.Item[]} dimensions All dimensions configured for this axis.
     *
     */
    dimensions: null,

    /**
     * @property {Ext.pivot.matrix.Base} matrix Matrix instance this axis belongs to.
     *
     */
    matrix:     null,

    /**
     * @property {Ext.pivot.MixedCollection} items All items generated for this axis are stored in this collection.
     *
     */
    items:      null,

    /**
     * When the tree is built for this axis it is stored in this property.
     *
     * @private
     */
    tree:       null,

    /**
     * @property {Number} levels No of levels this axis tree has
     * @readonly
     *
     */
    levels:     0,

    /**
     * @property {Boolean} isLeftAxis Internal flag to know which axis is this one
     * @readonly
     */
    isLeftAxis:   false,

    constructor: function(config){
        var me = this,
            i, sorter;

        if(!config || !config.matrix){
            //<debug>
            Ext.log('Wrong initialization of the axis!');
            //</debug>
            return;
        }

        me.isLeftAxis = config.isLeftAxis || me.isLeftAxis;
        me.matrix = config.matrix;
        me.tree = [];

        // init dimensions
        me.dimensions = new Ext.pivot.MixedCollection();
        me.dimensions.getKey = function(item){
            return item.getId();
        };

        me.items = new Ext.pivot.MixedCollection();
        me.items.getKey = function(item){
            return item.key;
        };

        Ext.Array.each(Ext.Array.from(config.dimensions || []), me.addDimension, me);
    },

    destroy: function(){
        var me = this;

        Ext.destroyMembers(me, 'dimensions', 'items', 'tree');
        me.matrix = me.dimensions = me.items = me.tree = null;
    },

    /**
     * Create an {@link Ext.pivot.dimension.Item} object with the specified config and add it to the
     * internal collection of dimensions.
     *
     * @param {Object} config Config object for the {@link Ext.pivot.dimension.Item} that is created.
     */
    addDimension: function(config){
        var item = config;

        if(!config){
            return;
        }
        if(!config.isInstance){
            item = new Ext.pivot.dimension.Item(config);
        }
        item.matrix = this.matrix;
        this.dimensions.add(item);
    },

    /**
     * Add the specified item to the internal collection of items.
     *
     * @param {Object} item Config object for the {@link Ext.pivot.axis.Item} that is added
     */
    addItem: function(item){
        var me = this;

        if(!Ext.isObject(item) || Ext.isEmpty(item.key) || Ext.isEmpty(item.value) || Ext.isEmpty(item.dimensionId)){
            return false;
        }

        item.key = String(item.key);
        item.dimension = me.dimensions.getByKey(item.dimensionId);
        item.name = item.name || Ext.callback(item.dimension.labelRenderer, item.dimension.scope || 'self.controller', [item.value], 0, me.matrix.cmp) || item.value;

        item.dimension.addValue(item.value, item.name);
        item.axis = me;
        if(!me.items.map[item.key] && item.dimension){
            me.items.add(new Ext.pivot.axis.Item(item));
            return true;
        }

        return false;
    },

    /**
     * Clear all items and the tree.
     *
     */
    clear: function(){
        this.items.clear();
        this.tree = null;
    },

    /**
     * This function parses the internal collection of items and builds a tree.
     * This tree is used by the Matrix class to generate the pivot store and column headers.
     *
     */
    getTree: function(){
        if(!this.tree){
            this.buildTree();
        }
        return this.tree;
    },

    /**
     * Expand all groups
     */
    expandAll: function(){
        var me = this,
            items = me.getTree(),
            len = items.length,
            i;

        for(i = 0; i < len; i++){
            items[i].expandCollapseChildrenTree(true);
        }
        // we fire a single groupexpand event without any item
        if(len > 0) {
            me.matrix.fireEvent('groupexpand', me.matrix, (me.isLeftAxis ? 'row' : 'col'), null);
        }
    },

    /**
     * Collapse all groups
     */
    collapseAll: function(){
        var me = this,
            items = me.getTree(),
            len = items.length,
            i;

        for(i = 0; i < len; i++){
            items[i].expandCollapseChildrenTree(false);
        }
        // we fire a single groupcollapse event without any item
        if(len > 0) {
            me.matrix.fireEvent('groupcollapse', me.matrix, (me.isLeftAxis ? 'row' : 'col'), null);
        }
    },

    /**
     * Find the first element in the tree that matches the criteria (attribute = value).
     *
     * It returns an object with the tree element and depth level.
     *
     * @return {Object}
     */
    findTreeElement: function(attribute, value){
        var items = this.items,
            len = items.getCount(),
            found = false,
            i, item;

        for(i = 0; i < len; i++){
            item = items.items[i];
            if(Ext.isDate(value) ? Ext.Date.isEqual(item[attribute], value) : item[attribute] === value){
                found = true;
                break;
            }
        }

        return found ? { level: item.level, node: item } : null;
    },

    /**
     * This function builds the internal tree after all records were processed
     *
     * @private
     */
    buildTree: function(){
        var me = this,
            items = me.dimensions.items,
            len = items.length,
            i, item, keys, parentKey, el;

        for(i = 0; i < len; i++) {
            // sort unique values for each dimension on this axis
            items[i].sortValues();
        }

        me.tree = [];

        // transform the flat items collection into a tree
        items = me.items.items;
        len = items.length;
        for(i = 0; i < len; i++){
            item = items[i];
            keys = String(item.key).split(me.matrix.keysSeparator);
            keys = Ext.Array.slice(keys, 0, keys.length - 1);
            parentKey = keys.join(me.matrix.keysSeparator);

            el = me.items.map[parentKey];
            if(el){
                item.level = el.level + 1;
                item.data = Ext.clone(el.data || {});
                el.children = el.children || [];
                el.children.push(item);
            }else{
                item.level = 0;
                item.data = {};
                me.tree.push(item);
            }
            item.data[item.dimension.getId()] = item.name;
            //item.data[item.dimension.getId()] = item.value;
            me.levels = Math.max(me.levels, item.level);
        }

        me.sortTree();
    },

    rebuildTree: function(){
        var items = this.items.items,
            len = items.length,
            i;

        this.tree = null;
        for(i = 0; i < len; i++){
            items[i].children = null;
        }
        this.buildTree();
    },
    
    /**
     * Sort the tree using the sorters defined on the axis dimensions
     *
     * @private
     */
    sortTree: function(){
        var tree = arguments[0] || this.tree,
            len = tree.length,
            dimension, i, item;

        if(tree.length > 0){
            dimension = tree[0].dimension;
        }

        if(dimension){
            // let's sort this array
            Ext.Array.sort(tree, dimension.sortFn);
        }

        for(i = 0; i < len; i++){
            item = tree[i];
            if(item.children){
                this.sortTree(item.children);
            }
        }
    },

    /**
     * Sort the tree by the specified field and direction.
     *
     * If the field is one of the axis dimension then sort by that otherwise go to the records and sort
     * them by that field.
     *
     * @param field
     * @param direction
     *
     * @returns {Boolean}
     * @private
     */
    sortTreeByField: function(field, direction){
        var me = this,
            sorted = false,
            dimension, len, i;

        if(field == me.matrix.compactViewKey){
            // in compact view we need to sort by all axis dimensions
            sorted = me.sortTreeByDimension(me.tree, me.dimensions.items, direction);
            len = me.dimensions.items.length;
            for(i = 0; i < len; i++){
                me.dimensions.items[i].direction = direction;
            }
        }else{
            direction = direction || 'ASC';
            dimension = me.dimensions.getByKey(field);

            if(dimension){
                // we need to sort the tree level where this dimension exists
                sorted = me.sortTreeByDimension(me.tree, dimension, direction);
                dimension.direction = direction;
            }else{
                // the field is not a dimension defined on the axis, so it's probably a generated field on the
                // pivot record which means we need to sort by calculated values
                sorted = me.sortTreeByRecords(me.tree, field, direction);
            }
        }

        return sorted;
    },

    /**
     * Sort tree by a specified dimension. The dimension's sorter function is used for sorting.
     *
     * @param tree
     * @param dimension
     * @param direction
     * @returns {Boolean}
     *
     * @private
     */
    sortTreeByDimension: function(tree, dimension, direction){
        var sorted = false,
            dimensions = Ext.Array.from(dimension),
            aDimension, len, i, temp;

        tree = tree || [];
        len = tree.length;

        if(len > 0){
            aDimension = tree[0].dimension;
        }

        if(Ext.Array.indexOf(dimensions, aDimension) >= 0) {
            if(aDimension.sortable) {
                // we have to sort this tree items by the dimension sortFn
                temp = aDimension.direction;
                aDimension.direction = direction;
                Ext.Array.sort(tree, aDimension.sortFn);
                aDimension.direction = temp;
                // we do not change the dimension direction now since we didn't finish yet
            }
            sorted = aDimension.sortable;
        }

        // the dimension we want to sort may be on leaves
        // in compact view mode we need to sort everything
        for(i = 0; i < len; i++){
            sorted = this.sortTreeByDimension(tree[i].children, dimension, direction) || sorted;
        }
        // ready now so exit
        return sorted;
    },

    /**
     * Sort tree by values on a generated field on the pivot model.
     *
     * @param tree
     * @param field
     * @param direction
     * @returns {boolean}
     *
     * @private
     */
    sortTreeByRecords: function(tree, field, direction){
        var i, len;

        tree = tree || [];
        len = tree.length;

        if(len <= 0){
            return false;
        }

        if(tree[0].record){
            this.sortTreeRecords(tree, field, direction);
        }else{
            this.sortTreeLeaves(tree, field, direction);
        }

        for(i = 0; i < len; i++){
            this.sortTreeByRecords(tree[i].children, field, direction);
        }

        return true;
    },

    /**
     * Sort the records array of each item in the tree
     *
     * @param tree
     * @param field
     * @param direction
     *
     * @private
     */
    sortTreeRecords: function(tree, field, direction){
        var sortFn = this.matrix.naturalSort;

        direction = direction || 'ASC';

        // let's sort the records of this item
        Ext.Array.sort(tree || [], function(a, b){
            var result,
                o1 = a.record, o2 = b.record;

            if(!(o1 && o1.isModel && o2 && o2.isModel)){
                return 0;
            }

            result = sortFn(o1.get(field) || '', o2.get(field) || '');

            if(result < 0 && direction === 'DESC'){
                return 1;
            }
            if(result > 0 && direction === 'DESC'){
                return -1;
            }
            return result;
        });
    },

    /**
     * Sort tree leaves by their group summary.
     *
     * @param tree
     * @param field
     * @param direction
     *
     * @returns {Boolean}
     *
     * @private
     */
    sortTreeLeaves: function(tree, field, direction){
        var sortFn = this.matrix.naturalSort,
            results = this.matrix.results,
            matrixModel = this.matrix.model,
            idx = Ext.Array.indexOf(Ext.Array.pluck(matrixModel, 'name'), field),
            col, agg;

        if(idx < 0){
            return false;
        }
        col = matrixModel[idx]['col'];
        agg = matrixModel[idx]['agg'];

        direction = direction || 'ASC';

        // let's sort the records of this item
        Ext.Array.sort(tree || [], function(a, b){
            var result,
                o1, o2;

            o1 = results.get(a.key, col);
            if(o1){
                o1 = o1.getValue(agg);
            }else{
                o1 = 0;
            }
            o2 = results.get(b.key, col);
            if(o2){
                o2 = o2.getValue(agg);
            }else{
                o2 = 0;
            }

            result = sortFn(o1, o2);

            if(result < 0 && direction === 'DESC'){
                return 1;
            }
            if(result > 0 && direction === 'DESC'){
                return -1;
            }
            return result;
        });
    }


});
