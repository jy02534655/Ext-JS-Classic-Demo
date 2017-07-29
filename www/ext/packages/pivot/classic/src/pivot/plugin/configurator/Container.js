/**
 * This is a container that holds configurator fields.
 */
Ext.define('Ext.pivot.plugin.configurator.Container', {
    extend: 'Ext.panel.Panel',

    requires: [
        'Ext.pivot.plugin.configurator.Column'
    ],

    mixins: [
        'Ext.mixin.FocusableContainer'
    ],

    alias: 'widget.pivotconfigcontainer',
    
    childEls:                   ['innerCt'],
    handleSorting:              false,
    handleFiltering:            false,
    position:                   'top',
    border:                     false,
    enableFocusableContainer:   true,
    isConfiguratorContainer:    true,

    cls:                        Ext.baseCSSPrefix + 'pivot-grid-config-container-body',
    dockedTopRightCls:          Ext.baseCSSPrefix + 'pivot-grid-config-container-body-tr',
    dockedBottomLeftCls:        Ext.baseCSSPrefix + 'pivot-grid-config-container-body-bl',
    hintTextCls:                Ext.baseCSSPrefix + 'pivot-grid-config-container-hint',

    config: {
        /**
         * @cfg {String} fieldType
         * Possible values:
         *
         * - `all` = the container is the "all fields" area;
         * - `aggregate` = the container is the "values" area;
         * - `leftAxis` = the container is the "row values" area;
         * - `topAxis` = the container is the "column values" area;
         *
         */
        fieldType:      'all',
        dragDropText:   '&nbsp;'
    },

    initComponent: function(){
        var me = this;

        if(me.position == 'top' || me.position == 'bottom'){
            Ext.apply(me, {
                style:          'overflow:hidden',
                layout:         'column',
                height:         'auto'
            });
        }else{
            Ext.apply(me, {
                layout: {
                    type: 'vbox',
                    align:  'stretch'
                }
            });
        }

        if(me.position == 'top' || me.position == 'right') {
            me.cls += ' ' + me.dockedTopRightCls;
        }else{
            me.cls += ' ' + me.dockedBottomLeftCls;
        }

        me.callParent(arguments);
    },

    destroy: function(){
        this.infoEl = Ext.destroy(this.infoEl);
        this.callParent();
    },

    afterRender: function(){
        var me = this;

        me.callParent();

        me.infoEl = me.innerCt.createChild({
            cls: me.hintTextCls,
            html: me.getDragDropText()
        });
        me.setInfoElVisibility();
    },
    
    /**
     * This is used for firing the 'configchange' event
     *
     */
    applyChanges: function(field, force){
        if(this.getFieldType() != 'all' || force === true) {
            this.fireEvent('configchange', field || this);
        }
    },

    /**
     * This is used for adding a new config field to this container.
     * @return {Ext.pivot.plugin.configurator.Column} The new configurator field.
     *
     * @private
     */
    addField: function(config, pos, notify) {
        var me = this,
            cfg = {
                xtype: 'pivotconfigfield',
                field: config,
                header: config.getHeader(),
                
                // These are drag/droppable, so need
                // panning disabled.
                touchAction: {
                    panX: false,
                    panY: false
                }
            },
            newCol;

        config.isAggregate = (me.getFieldType() === 'aggregate');

        if (pos !== -1) {
            newCol = me.insert(pos, cfg);
        } else {
            newCol = me.add(cfg);
        }

        if (notify === true){
            me.applyChanges(newCol);
        }
        return newCol;
    },

    onAdd: function(column){
        this.setInfoElVisibility();

        column.setFieldType(this.getFieldType());
        this.callParent(arguments);
    },

    onRemove: function(){
        this.setInfoElVisibility();
    },

    /**
     * This is used for moving a field inside this container.
     *
     * @private
     */
    moveField: function(from, to, position){
        var me = this;

        if(Ext.isString(from)){
            from = me.items.getByKey(from);
        }
        if(Ext.isString(to)){
            to = me.items.getByKey(to);
        }

        if(from != to) {
            me['move' + Ext.String.capitalize(position)](from, to);
            me.applyChanges(from);
        }
    },

    /**
     * This is used to remove a field inside this container and apply changes
     *
     * @param {Ext.pivot.plugin.configurator.Column} field
     *
     * @private
     */
    removeField: function(field){
        this.remove(field);
        this.applyChanges();
    },

    /**
     * The container has an info text displayed inside. This function makes it visible or hidden.
     *
     * @private
     */
    setInfoElVisibility: function(){
        var el = this.infoEl;

        if(!el) {
            return;
        }

        if(this.items.getCount() == 0) {
            el.show();
        }else{
            el.hide();
        }
    }

    
});
