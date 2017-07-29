/**
 *
 * This class enhances the {@link Ext.util.MixedCollection} class by allowing the
 * children objects to be destroyed on remove.
 *
 * @private
 *
 */
Ext.define('Ext.pivot.MixedCollection', {
    extend: 'Ext.util.MixedCollection',

    alternateClassName: [
        'Mz.aggregate.MixedCollection'
    ],

    removeAt: function(index){
        Ext.destroy(this.callParent(arguments));
    },

    clear: function(){
        this.destroyItems();
        this.callParent(arguments);
    },

    removeAll: function(){
        this.destroyItems();
        this.callParent(arguments);
    },
    
    destroy: function(){
        // destroy all objects in the items array
        this.clear();
    },

    destroyItems: function(){
        var items = this.items,
            len, i, item;

        // when having hundreds of thousand of items Ext.destroy fails because
        // the "apply" function cannot accept so many arguments
        if(items) {
            len = items.length;
            for(i = 0; i < len; i++){
                item = items[i];
                if(item.destroy){
                    item.destroy();
                }
            }
        }
    }
});