/**
 * The axis has items that are generated when the records are processed.
 *
 * This class stores info about such an item.
 */
Ext.define('Ext.pivot.axis.Item', {
    alternateClassName: [
        'Mz.aggregate.axis.Item'
    ],

    /**
     * @property {Number} level The tree level this item belongs to
     * @readonly
     *
     */
    level:          0,
    
    /**
     * @cfg {String} key
     *
     * The key that uniquely identifies this item in the tree. The key is a string compound of
     * all parent items keys separated by the matrix keysSeparator
     *
     */
    key:            '',
    
    /**
     * @cfg {String/Number} value The item value as it appears in the store
     *
     */
    value:          '',
    
    /**
     * @cfg {String/Number} sortValue The item sort value as it appears in the store. This value will be used when sorting results.
     *
     */
    sortValue:      '',
    
    /**
     * @cfg {String} name The item name after the grouperFn was applied to the {@link #value}
     *
     */
    name:           '',
    
    /**
     * @cfg {String} id Id of the dimension this item refers to.
     *
     */
    dimensionId:    '',
    
    /**
     * @property {Ext.pivot.dimension.Item} dimension The dimension instance
     * @readonly
     *
     */
    dimension:      null,
    
    /**
     * @property {Ext.pivot.axis.Item[]} children Array of children items this item has
     *
     */
    children:       null,
    
    /**
     * @property {Ext.data.Model} record
     * @readonly
     *
     * When the {@link Ext.pivot.matrix.Local Local} matrix is used this is the pivot store record generated for this axis item.
     * Only bottom level items belonging to the leftAxis have this property.
     *
     */
    record:         null,

    records:        null,
    
    /**
     * @property {Ext.pivot.axis.Base} axis Parent axis instance
     * @readonly
     *
     */
    axis:           null,
    
    /**
     * Object that stores all values from all axis items parents
     *
     * @private
     */
    data:           null,
    
    /**
     * @property {Boolean} expanded Is this item expanded or collapsed?
     *
     */
    expanded:       false,
    
    constructor: function(config){
        var me = this,
            axis;
        
        Ext.apply(me, config || {});
        
        if(Ext.isEmpty(me.sortValue)){
            me.sortValue = me.value;
        }
        axis = me.axis;

        me.expanded = (axis && ((axis.isLeftAxis && !axis.matrix.collapsibleRows) || (!axis.isLeftAxis && !axis.matrix.collapsibleColumns)));
        me.callParent(arguments);
    },
    
    destroy: function(){
        var me = this;

        Ext.destroy(me.children);

        me.axis = me.data = me.dimension = me.record = me.children = me.records = null;
        
        me.callParent(arguments);
    },
    
    /**
     * Returns the group total text formatted according to the template defined in the matrix
     *
     */
    getTextTotal: function(){
        var me = this,
            groupHeaderTpl = Ext.XTemplate.getTpl(me.axis.matrix, 'textTotalTpl');
        
        return groupHeaderTpl.apply({
            groupField: me.dimension.dataIndex,
            columnName: me.dimension.dataIndex,
            name:       me.name,
            rows:       me.children || []
        });
    },
    
    /**
     * Expand this item and fire the groupexpand event on the matrix
     *
     * @param {Boolean} includeChildren Expand the children tree too?
     */
    expand: function(includeChildren){
        var me = this;
        
        me.expanded = true;
        
        if(includeChildren === true){
            me.expandCollapseChildrenTree(true);
        }
        
        me.axis.matrix.fireEvent('groupexpand', me.axis.matrix, (me.axis.isLeftAxis ? 'row' : 'col'), me);
    },
    
    /**
     * Collapse this item and fire the groupcollapse event on the matrix
     *
     * @param {Boolean} includeChildren Collapse the children tree too?
     */
    collapse: function(includeChildren){
        var me = this;
        
        me.expanded = false;
        
        if(includeChildren === true){
            me.expandCollapseChildrenTree(false);
        }

        me.axis.matrix.fireEvent('groupcollapse', me.axis.matrix, (me.axis.isLeftAxis ? 'row' : 'col'), me);
    },
    
    /**
     * Expand or collapse all children tree of the specified item
     *
     * @private
     */
    expandCollapseChildrenTree: function(state){
        var me = this,
            i;
        
        me.expanded = state;
        if(Ext.isArray(me.children)){
            for(i = 0; i < me.children.length; i++){
                me.children[i].expandCollapseChildrenTree(state);
            }
        }
    }
});