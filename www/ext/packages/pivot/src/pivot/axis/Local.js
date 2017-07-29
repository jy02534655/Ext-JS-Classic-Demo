/**
 * Axis implementation specific to {@link Ext.pivot.matrix.Local} matrix.
 */
Ext.define('Ext.pivot.axis.Local', {
    alternateClassName: [
        'Mz.aggregate.axis.Local'
    ],

    extend: 'Ext.pivot.axis.Base',
    
    alias: 'pivotaxis.local',

    /**
     * This method processes the record and creates items for the configured dimensions.
     * If there's at least one label filter set on this axis dimensions and there's no
     * match then the function returns null.
     *
     * @param record
     * @returns {Array/null}
     * @private
     *
     */
    processRecord: function(record){
        var me = this,
            items = [],
            parentKey = '',
            filterOk = true,
            dimCount = me.dimensions.items.length,
            groupValue, groupKey, dimension, i;
        
        for(i = 0; i < dimCount; i++){
            dimension = me.dimensions.items[i];
            groupValue = Ext.callback(dimension.groupFn, dimension.scope || 'self.controller', [record], 0, me.matrix.cmp);
            groupKey = parentKey ? parentKey + me.matrix.keysSeparator : '';
                
            groupValue = Ext.isEmpty(groupValue) ? dimension.blankText : groupValue;
            groupKey += me.matrix.getKey(groupValue);
            
            if(dimension.filter instanceof Ext.pivot.filter.Label){
                // can't use the groupName to filter. That one could have html code in it because of the renderer
                filterOk = dimension.filter.isMatch(groupValue);
            }
            
            // if at least one filter has no match then don't add this record
            if(!filterOk){
                break;
            }
            
            items.push({
                value:          groupValue,
                sortValue:      record.get(dimension.sortIndex),
                key:            groupKey,
                dimensionId:    dimension.getId()
            });
            parentKey = groupKey;
        }
        
        if(filterOk){
            return items;
        }else{
            return null;
        }
    },
    
    /**
     * Build the tree and apply value filters.
     *
     */
    buildTree: function(){
        this.callParent(arguments);
        this.filterTree();
    },
    
    /**
     * Apply all value filters to the tree.
     *
     * @private
     */
    filterTree: function(){
        var me = this,
            length = me.dimensions.items.length,
            hasFilters = false,
            i;
        
        // if at least one dimension has a value filter then parse the tree
        for(i = 0; i < length; i++){
            hasFilters = hasFilters || (me.dimensions.items[i].filter instanceof Ext.pivot.filter.Value);
        }
        
        if(!hasFilters){
            return;
        }

        me.matrix.filterApplied = true;
        me.filterTreeItems(me.tree);
    },
    
    filterTreeItems: function(items){
        var me = this,
            filter, i, filteredItems;
        
        if(!items || !Ext.isArray(items) || items.length <= 0){
            return;
        }
        
        filter = items[0].dimension.filter;
        if(filter && (filter instanceof Ext.pivot.filter.Value)){
            if(filter.isTopFilter){
                filteredItems = filter.applyFilter(me, items) || [];
            }else{
                filteredItems = Ext.Array.filter(items, me.canRemoveItem, me);
            }
            me.removeRecordsFromResults(filteredItems);
            me.removeItemsFromArray(items, filteredItems);

            for(i = 0; i < filteredItems.length; i++){
                me.removeTreeChildren(filteredItems[i]);
            }
        }
        
        for(i = 0; i < items.length; i++){
            if(items[i].children){
                me.filterTreeItems(items[i].children);
                if(items[i].children.length === 0){
                    // destroy removed item?
                    me.items.remove(items[i]);
                    // if all children were removed then remove the parent too
                    Ext.Array.erase(items, i, 1);
                    i--;
                }
            }
        }
    },

    removeTreeChildren: function(item){
        var i, len;

        if(item.children) {
            len = item.children.length;
            for (i = 0; i < len; i++) {
                this.removeTreeChildren(item.children[i]);
            }
        }
        this.items.remove(item);
    },
    
    canRemoveItem: function(item){
        var me = this,
            leftKey = (me.isLeftAxis ? item.key : me.matrix.grandTotalKey),
            topKey = (me.isLeftAxis ? me.matrix.grandTotalKey : item.key),
            result = me.matrix.results.get(leftKey, topKey),
            filter = item.dimension.filter;
            
        return (result ? !filter.isMatch(result.getValue(filter.dimensionId)) : false);
    },
    
    removeItemsFromArray: function(source, toDelete){
        for(var i = 0; i < source.length; i++){
            if(Ext.Array.indexOf(toDelete, source[i]) >= 0){
                Ext.Array.erase(source, i, 1);
                i--;
            }
        }
    },
    
    removeRecordsFromResults: function(items){
        for(var i = 0; i < items.length; i++){
            this.removeRecordsByItem(items[i]);
        }
    },
    
    removeRecordsByItem: function(item){
        var me = this,
            keys, i, results, result, toRemove;

        if(item.children){
            me.removeRecordsFromResults(item.children);
        }
        if(me.isLeftAxis){
            toRemove  = me.matrix.results.get(item.key, me.matrix.grandTotalKey);
            results = me.matrix.results.getByLeftKey(me.matrix.grandTotalKey);
        }else{
            toRemove = me.matrix.results.get(me.matrix.grandTotalKey, item.key);
            results = me.matrix.results.getByTopKey(me.matrix.grandTotalKey);
        }
        if(!toRemove){
            return;
        }
        
        // remove records from grand totals
        for(i = 0; i < results.length; i++){
            me.removeItemsFromArray(results[i].records, toRemove.records);
        }

        keys = item.key.split(me.matrix.keysSeparator);
        keys.length = keys.length - 1;

        while(keys.length > 0){

            // remove records from parent groups
            if(me.isLeftAxis){
                results  = me.matrix.results.getByLeftKey(keys.join(me.matrix.keysSeparator));
            }else{
                results = me.matrix.results.getByTopKey(keys.join(me.matrix.keysSeparator));
            }
            
            for(i = 0; i < results.length; i++){
                me.removeItemsFromArray(results[i].records, toRemove.records);
            }

            keys.length = keys.length - 1;
        }
    }

});