/**
 * This class implements the configurator panel.
 */
Ext.define('Ext.pivot.plugin.configurator.Panel', {
    extend: 'Ext.Panel',

    requires: [
        'Ext.pivot.plugin.configurator.Container',
        'Ext.pivot.plugin.configurator.DragZone',
        'Ext.pivot.plugin.configurator.DropZone',
        'Ext.pivot.plugin.configurator.PanelController',
        'Ext.pivot.plugin.configurator.Form',
        'Ext.pivot.plugin.configurator.Settings',
        'Ext.layout.HBox',
        'Ext.layout.VBox',
        'Ext.layout.Card',
        'Ext.TitleBar',
        'Ext.Promise'
    ],

    alias: 'widget.pivotconfigpanel',
    controller: 'pivotconfigpanel',

    isPivotConfigPanel: true,

    cls: Ext.baseCSSPrefix + 'pivot-grid-config-panel',

    showAnimation: {
        type: 'slideIn',
        duration: 250,
        easing: 'ease-out',
        direction: 'left'
    },

    hideAnimation: {
        type: 'slideOut',
        duration: 250,
        easing: 'ease-in',
        direction: 'right'
    },

    panelTitle:             'Configuration',
    /**
     * @cfg {String} panelAllFieldsText Text displayed in the container reserved for all available fields
     * when docked to top or bottom.
     */
    panelAllFieldsText:     'Drop Unused Fields Here',
    /**
     * @cfg {String} panelAllFieldsTitle Text displayed in the container reserved for all available fields
     * when docked to left or right.
     */
    panelAllFieldsTitle:    'All fields',

    /**
     * @cfg {String} panelTopFieldsText Text displayed in the container reserved for all top axis fields
     * when docked to top or bottom.
     */
    panelTopFieldsText:     'Drop Column Fields Here',
    /**
     * @cfg {String} panelTopFieldsTitle Text displayed in the container reserved for all top axis fields
     * when docked to left or right.
     */
    panelTopFieldsTitle:    'Column labels',

    /**
     * @cfg {String} panelLeftFieldsText Text displayed in the container reserved for all left axis fields
     * when docked to top or bottom.
     */
    panelLeftFieldsText:    'Drop Row Fields Here',
    /**
     * @cfg {String} panelLeftFieldsTitle Text displayed in the container reserved for all left axis fields
     * when docked to left or right.
     */
    panelLeftFieldsTitle:   'Row labels',

    /**
     * @cfg {String} panelAggFieldsText Text displayed in the container reserved for all aggregate fields
     * when docked to top or bottom.
     */
    panelAggFieldsText:     'Drop Agg Fields Here',
    /**
     * @cfg {String} panelAggFieldsTitle Text displayed in the container reserved for all aggregate fields
     * when docked to left or right.
     */
    panelAggFieldsTitle:    'Values',
    cancelText:             'Cancel',
    okText:                 'Done',

    eventedConfig: {
        pivot:          null,
        fields:         null
    },

    listeners: {
        pivotchange: 'onPivotChanged',
        fieldschange: 'onFieldsChanged'
    },

    layout: 'card',

    initialize: function(){
        this.setup();
        return this.callParent();
    },

    /**
     * This function either moves or copies the dragged field from one container to another.
     *
     * @param {Ext.pivot.plugin.configurator.Container} fromContainer
     * @param {Ext.pivot.plugin.configurator.Container} toContainer
     * @param {Ext.data.Model} record
     * @param {String} newPos New index position
     *
     * @private
     */
    dragDropField: function(fromContainer, toContainer, record, newPos){
        var me = this,
            pivot = me.getPivot(),
            field = record.get('field'),
            fromFieldType = fromContainer.getFieldType(),
            toFieldType = toContainer.getFieldType(),
            controller = me.getController(),
            topAxisCt = controller.getTopAxisContainer(),
            leftAxisCt = controller.getLeftAxisContainer(),
            item;

        if(pivot.fireEvent('beforemoveconfigfield', this, {
                fromContainer:  fromContainer,
                toContainer:    toContainer,
                field:          field
            }) !== false){

            if(fromContainer != toContainer){

                if (toFieldType === 'all') {
                    // source is "Row labels"/"Column labels"/"Values"
                    // destination is "All fields"
                    // we just remove the field from the source
                    fromContainer.removeField(record);
                } else if (toFieldType === 'aggregate') {
                    // source is "Row labels"/"Column labels"/"All fields"
                    // destination is "Values"
                    // we copy the field to destination
                    toContainer.addField(field, newPos);
                    if (fromFieldType !== 'all'){
                        // remove the field from the left/top axis
                        fromContainer.removeField(record);
                    }
                } else {
                    // source is "Row labels"/"Column labels"/"Values"/"All fields"
                    // destination is "Row labels"/"Column labels"
                    // first let's check if the field is already in the destination container
                    item = me.findFieldInContainer(field, toContainer);

                    if (item) {
                        // the destination has the field already
                        return;
                    }

                    // See if it was on another axis.
                    if (toFieldType === 'leftAxis') {
                        item = me.findFieldInContainer(field, topAxisCt);
                        fromContainer = item ? topAxisCt : fromContainer;
                    } else {
                        item = me.findFieldInContainer(field, leftAxisCt);
                        fromContainer = item ? leftAxisCt : fromContainer;
                    }

                    // If so, move it here.
                    if (item) {
                        fromContainer.removeField(item);
                        toContainer.addField(field);
                    } else {
                        if(fromFieldType === 'aggregate'){
                            // we need to remove the dragged field because it was found on one of the axis
                            fromContainer.removeField(record);
                        }
                        toContainer.addField(field, newPos);
                    }
                }
            }else{
                toContainer.moveField(record, newPos);
            }
        }

    },

    isAllowed: function (fromContainer, toContainer, record) {
        var allowed = true,
            field = record.get('field'),
            fromFieldType = fromContainer && fromContainer.getFieldType(),
            toFieldType = toContainer && toContainer.getFieldType();

        if (fromFieldType === 'aggregate' && (toFieldType === 'leftAxis' || toFieldType === 'topAxis')) {
            allowed = !this.findFieldInContainer(field, toContainer);
        }
        return allowed;
    },

    /**
     *
     * @param {Ext.pivot.plugin.configurator.Field} field
     * @param {Ext.pivot.plugin.configurator.Container} container
     * @return {Ext.data.Model}
     *
     * @private
     */
    findFieldInContainer: function(field, container){
        var store = container.getStore(),
            length = store.getCount(),
            i, item;

        for(i = 0; i < length; i++){
            item = store.getAt(i);
            if(item.get('field').getDataIndex() == field.getDataIndex()){
                return item;
            }
        }
    },

    setup: function(){
        var me = this,
            listeners = {
                configchange:       'onConfigChanged',
                toolsbtnpressed:    'showCard',
                removefield:        'onRemoveField'
            };

        me.add([{
            itemId: 'main',
            xtype: 'container',
            layout: {
                type: 'hbox',
                align: 'stretch'
            },

            defaults: {
                flex: 1
            },

            items: [{
                xtype:      'titlebar',
                docked:     'top',
                title:      me.panelTitle,
                titleAlign: 'left',
                items: [{
                    xtype: 'tool',
                    type: 'gear',
                    align: 'right',
                    handler: 'showSettings'
                },{
                    text:   me.cancelText,
                    align:  'right',
                    ui:     'alt',
                    handler:'cancelConfiguration'
                },{
                    text:   me.okText,
                    align:  'right',
                    ui:     'alt',
                    handler:'applyConfiguration',
                    margin: '0 0 0 5'
                }]
            },{
                reference:  'fieldsCt',
                xtype:      'pivotconfigcontainer',
                title:      me.panelAllFieldsTitle,
                emptyText:  me.panelAllFieldsText,
                fieldType:  'all',
                listeners:  listeners
            },{
                xtype: 'container',
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                defaults: {
                    xtype:      'pivotconfigcontainer',
                    flex: 1
                },
                items: [{
                    reference:  'fieldsAggCt',
                    title:      me.panelAggFieldsTitle,
                    emptyText:  me.panelAggFieldsText,
                    fieldType:  'aggregate',
                    listeners:  listeners
                },{
                    reference:  'fieldsLeftCt',
                    title:      me.panelLeftFieldsTitle,
                    emptyText:  me.panelLeftFieldsText,
                    fieldType:  'leftAxis',
                    listeners:  listeners
                },{
                    reference:  'fieldsTopCt',
                    title:      me.panelTopFieldsTitle,
                    emptyText:  me.panelTopFieldsText,
                    fieldType:  'topAxis',
                    listeners:  listeners
                }]
            }]

        },{
            itemId: 'field',
            xtype: 'pivotconfigform',
            listeners: {
                close: 'backToMainView',
                beforeapplyconfigfieldsettings: 'onBeforeApplyConfigFieldSettings',
                applyconfigfieldsettings: 'onApplyConfigFieldSettings'
            }
        },{
            itemId: 'settings',
            xtype: 'pivotsettings',
            listeners: {
                close: 'backToMainView',
                beforeapplypivotsettings: 'onBeforeApplyPivotSettings',
                applypivotsettings: 'onApplyPivotSettings'
            }
        }]);
    },

    /**
     * Returns the container that stores all unused fields.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getAllFieldsContainer: function(){
        return this.lookup('fieldsCt');
    },

    /**
     * Returns the header of the container that stores all unused fields.
     *
     * @return {Ext.panel.Header}
     * @since 6.5.0
     */
    getAllFieldsHeader: function(){
        return this.getAllFieldsContainer().getHeader();
    },

    /**
     * Set visibility of the "All fields" header and container
     * @param {Boolean} visible
     * @since 6.5.0
     */
    setAllFieldsContainerVisible: function(visible){
        this.getAllFieldsContainer().setHidden(!visible);
    },

    /**
     * Returns the container that stores all fields configured on the left axis.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getLeftAxisContainer: function(){
        return this.lookup('fieldsLeftCt');
    },

    /**
     * Returns the header of the container that stores all fields configured on the left axis.
     *
     * @return {Ext.panel.Header}
     * @since 6.5.0
     */
    getLeftAxisHeader: function(){
        return this.getLeftAxisContainer().getHeader();
    },

    /**
     * Set visibility of the "Row labels" header and container
     * @param {Boolean} visible
     * @since 6.5.0
     */
    setLeftAxisContainerVisible: function(visible){
        this.getLeftAxisContainer().setHidden(!visible);
    },

    /**
     * Returns the container that stores all fields configured on the top axis.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getTopAxisContainer: function(){
        return this.lookup('fieldsTopCt');
    },

    /**
     * Returns the header of the container that stores all fields configured on the top axis.
     *
     * @return {Ext.panel.Header}
     * @since 6.5.0
     */
    getTopAxisHeader: function(){
        return this.getTopAxisContainer().getHeader();
    },

    /**
     * Set visibility of the "Column labels" header and container
     * @param {Boolean} visible
     * @since 6.5.0
     */
    setTopAxisContainerVisible: function(visible){
        this.getTopAxisContainer().setHidden(!visible);
    },

    /**
     * Returns the container that stores all fields configured on the aggregate.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getAggregateContainer: function(){
        return this.lookup('fieldsAggCt');
    },

    /**
     * Returns the header of the container that stores all fields configured on the aggregate.
     *
     * @return {Ext.panel.Header}
     * @since 6.5.0
     */
    getAggregateHeader: function(){
        return this.getAggregateContainer().getHeader();
    },

    /**
     * Set visibility of the "Values" header and container
     * @param {Boolean} visible
     * @since 6.5.0
     */
    setAggregateContainerVisible: function(visible){
        this.getAggregateContainer().setHidden(!visible);
    }

});
