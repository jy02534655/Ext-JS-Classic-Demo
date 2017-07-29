/**
 * This class implements the configurator panel.
 */
Ext.define('Ext.pivot.plugin.configurator.Panel', {
    extend: 'Ext.panel.Panel',

    requires: [
        'Ext.pivot.plugin.configurator.Container',
        'Ext.pivot.plugin.configurator.DragZone',
        'Ext.pivot.plugin.configurator.DropZone',
        'Ext.layout.container.HBox',
        'Ext.layout.container.VBox',
        'Ext.pivot.plugin.configurator.window.Settings'
    ],

    mixins: [
        'Ext.mixin.FocusableContainer'
    ],

    alias: 'widget.pivotconfigpanel',
    
    weight:             50, // the column header container has a weight of 100 so we want to dock it before that.
    defaultMinHeight:   70,
    defaultMinWidth:    250,
    dock:               'right',
    header:             false,
    title:              'Configurator',
    collapsible:        true,
    collapseMode:       'placeholder',

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
    /**
     * @cfg {String} addToText Text displayed in the field menu
     */
    addToText:              'Add to {0}',
    /**
     * @cfg {String} moveToText Text displayed in the field menu
     */
    moveToText:             'Move to {0}',
    /**
     * @cfg {String} removeFieldText Text displayed in the field menu
     */
    removeFieldText:        'Remove field',
    /**
     * @cfg {String} moveUpText Text displayed in the field menu
     */
    moveUpText:             'Move up',
    /**
     * @cfg {String} moveDownText Text displayed in the field menu
     */
    moveDownText:           'Move down',
    /**
     * @cfg {String} moveBeginText Text displayed in the field menu
     */
    moveBeginText:          'Move to beginning',
    /**
     * @cfg {String} moveEndText Text displayed in the field menu
     */
    moveEndText:            'Move to end',
    /**
     * @cfg {String} fieldSettingsText Text displayed in the field menu
     */
    fieldSettingsText:      'Field settings',

    headerContainerCls: Ext.baseCSSPrefix + 'pivot-grid-config-container-header',

    keyEventRe: /^key/,

    config: {
        fields:         [],
        refreshDelay:   300,
        pivot:          null
    },

    initComponent: function(){
        var me = this,
            listeners = {
                configchange:   me.applyChanges,
                scope:          me
            };
        
        Ext.apply(me, Ext.Array.indexOf(['top', 'bottom'], me.dock) >= 0 ? me.getHorizontalConfig() : me.getVerticalConfig());
        
        me.callParent(arguments);

        me.getAllFieldsContainer().on(listeners);
        me.getLeftAxisContainer().on(listeners);
        me.getTopAxisContainer().on(listeners);
        me.getAggregateContainer().on(listeners);

        me.pivotListeners = me.getPivot().getMatrix().on({
            done:       me.onPivotDone,
            scope:      me,
            destroyable:true
        });

        me.task = new Ext.util.DelayedTask(me.reconfigurePivot, me);

    },
    
    destroy: function(){
        var me = this,
            toDestroy = [
                'relayers', 'pivotListeners', 'menu', 'dragZone', 'dropZone'
            ],
            length = toDestroy.length,
            i;

        for(i = 0; i < length; i++){
            Ext.destroy(me[toDestroy[i]]);
            me[toDestroy[i]] = null;
        }

        me.task.cancel();
        me.task = me.lastFocusedField = null;

        me.callParent();
    },
    
    enable: function(){
        var me = this;
        
        if(me.rendered){
            me.dragZone.enable();
            me.dropZone.enable();

            me.initPivotFields();
        }
        me.show();
    },
    
    disable: function(){
        var me = this;
        
        if(me.rendered){
            me.dragZone.disable();
            me.dropZone.disable();
        }
        me.hide();
    },

    afterRender: function(){
        var me = this,
            el = me.getEl();

        me.callParent(arguments);
        me.mon(el, {
            scope:  me,
            delegate: '.' + Ext.baseCSSPrefix + 'pivot-grid-config-column',
            click:  me.handleEvent,
            keypress: me.handleEvent
        });
        me.dragZone = new Ext.pivot.plugin.configurator.DragZone(me);
        me.dropZone = new Ext.pivot.plugin.configurator.DropZone(me);
        el.unselectable();
    },

    handleEvent: function(e){
        var me = this,
            isKeyEvent = me.keyEventRe.test(e.type),
            pivot = me.getPivot(),
            fly, cmp, menuCfg, options;

        if( (isKeyEvent && e.getKey() === e.SPACE) || (e.button === 0) ){
            fly = Ext.fly(e.target);

            if(fly && (cmp = fly.component)){
                e.stopEvent();
                cmp.focus();

                Ext.destroy(me.menu);

                menuCfg = me.getMenuConfig(cmp);

                if(menuCfg){
                    me.menu = new Ext.menu.Menu(menuCfg);
                    options = {
                        menu:       me.menu,
                        field:      cmp.getField(),
                        container:  cmp.getFieldType()
                    };
                    if(pivot.fireEvent('beforeshowconfigfieldmenu', me, options) !== false) {
                        me.menu.showBy(cmp);
                        me.menu.focus();
                        pivot.fireEvent('showconfigfieldmenu', me, options);
                    }else{
                        Ext.destroy(me.menu);
                    }
                }
            }
        }
    },

    getPanelConfigHeader: function(config){
        return Ext.apply({
            xtype:      'header',
            // make it look like a panel header but with a different padding
            baseCls:    Ext.baseCSSPrefix + 'panel-header',
            cls:        this.headerContainerCls,
            border:     1,
            width:      100
        }, config || {});
    },

    getHorizontalConfig: function(){
        var me = this,
            tools = [{
                type: 'gear',
                handler: me.showSettings,
                scope: me
            }];

        if(me.collapsible) {
            tools.push({
                type: me.dock == 'top' ? 'up' : 'down',
                handler: me.collapseMe,
                scope: me
            });
        }

        return {
            minHeight: me.defaultMinHeight,
            headerPosition: me.dock == 'top' ? 'bottom' : 'top',
            collapseDirection: me.dock,
            defaults: {
                xtype: 'container',
                layout: {
                    type: 'hbox',
                    align: 'stretchmax'
                },
                minHeight: me.defaultMinHeight / 3
            },
            items: [{
                items: [me.getPanelConfigHeader({
                    title: me.panelAllFieldsTitle,
                    tools: tools
                }), {
                    itemId: 'fieldsCt',
                    xtype: 'pivotconfigcontainer',
                    fieldType: 'all',
                    dragDropText: me.panelAllFieldsText,
                    position: me.dock,
                    flex: 1
                }]
            }, {
                items: [me.getPanelConfigHeader({
                    title: me.panelAggFieldsTitle
                }), {
                    itemId: 'fieldsAggCt',
                    xtype: 'pivotconfigcontainer',
                    fieldType: 'aggregate',
                    dragDropText: me.panelAggFieldsText,
                    position: me.dock,
                    flex: 1
                }]
            }, {
                defaults: {
                    xtype: 'pivotconfigcontainer',
                    minHeight: me.defaultMinHeight / 3,
                    position: me.dock
                },
                items: [me.getPanelConfigHeader({
                    title: me.panelLeftFieldsTitle
                }), {
                    itemId: 'fieldsLeftCt',
                    fieldType: 'leftAxis',
                    dragDropText: me.panelLeftFieldsText,
                    flex: 1
                }, me.getPanelConfigHeader({
                    title: me.panelTopFieldsTitle
                }), {
                    itemId: 'fieldsTopCt',
                    fieldType: 'topAxis',
                    dragDropText: me.panelTopFieldsText,
                    flex: 1
                }]
            }]
        };
    },

    getVerticalConfig: function(){
        var me = this,
            tools = [{
                type: 'gear',
                handler: me.showSettings,
                scope: me
            }];

        if(me.collapsible) {
            tools.push({
                type: me.dock,
                handler: me.collapseMe,
                scope: me
            });
        }

        return {
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            width: me.defaultMinWidth,
            minWidth: me.defaultMinWidth,
            headerPosition: me.dock == 'right' ? 'left' : 'right',
            collapseDirection: me.dock,
            defaults: {
                flex: 1
            },
            items: [{
                itemId: 'fieldsCt',
                xtype: 'pivotconfigcontainer',
                position: me.dock,
                title: me.panelAllFieldsTitle,
                fieldType: 'all',
                dragDropText: me.panelAllFieldsText,
                autoScroll: true,
                header: {
                    cls: me.headerContainerCls
                },
                tools: tools
            }, {
                xtype: 'container',
                defaults: {
                    xtype: 'pivotconfigcontainer',
                    flex: 1,
                    autoScroll: true,
                    position: me.dock,
                    header: {
                        cls: me.headerContainerCls
                    }
                },
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                items: [{
                    itemId: 'fieldsAggCt',
                    title: me.panelAggFieldsTitle,
                    fieldType: 'aggregate',
                    dragDropText: me.panelAggFieldsText
                }, {
                    itemId: 'fieldsLeftCt',
                    title: me.panelLeftFieldsTitle,
                    fieldType: 'leftAxis',
                    dragDropText: me.panelLeftFieldsText
                }, {
                    itemId: 'fieldsTopCt',
                    title: me.panelTopFieldsTitle,
                    fieldType: 'topAxis',
                    dragDropText: me.panelTopFieldsText
                }]
            }]
        };
    },

    /**
     * Returns the container that stores all unused fields.
     *
     * @return {Ext.pivot.plugin.configurator.Container}
     */
    getAllFieldsContainer: function(){
        return this.down('#fieldsCt');
    },

    /**
     * Returns the header of the container that stores all unused fields.
     *
     * @return {Ext.panel.Header}
     */
    getAllFieldsHeader: function(){
        var dock = this.dock,
            ct = this.getAllFieldsContainer();

        return (dock === 'top' || dock === 'bottom') ? ct.prev() : ct.getHeader();
    },

    /**
     * Set visibility of the "All fields" header and container
     * @param {Boolean} visible
     */
    setAllFieldsContainerVisible: function(visible){
        this.getAllFieldsContainer().setVisible(visible);
        this.getAllFieldsHeader().setVisible(visible);
    },

    /**
     * Returns the container that stores all fields configured on the left axis.
     *
     * @return {Ext.pivot.plugin.configurator.Container}
     */
    getLeftAxisContainer: function(){
        return this.down('#fieldsLeftCt');
    },

    /**
     * Returns the header of the container that stores all fields configured on the left axis.
     *
     * @return {Ext.panel.Header}
     */
    getLeftAxisHeader: function(){
        var dock = this.dock,
            ct = this.getLeftAxisContainer();

        return (dock === 'top' || dock === 'bottom') ? ct.prev() : ct.getHeader();
    },

    /**
     * Set visibility of the "Row labels" header and container
     * @param {Boolean} visible
     */
    setLeftAxisContainerVisible: function(visible){
        this.getLeftAxisContainer().setVisible(visible);
        this.getLeftAxisHeader().setVisible(visible);
    },

    /**
     * Returns the container that stores all fields configured on the top axis.
     *
     * @return {Ext.pivot.plugin.configurator.Container}
     */
    getTopAxisContainer: function(){
        return this.down('#fieldsTopCt');
    },

    /**
     * Returns the header of the container that stores all fields configured on the top axis.
     *
     * @return {Ext.panel.Header}
     */
    getTopAxisHeader: function(){
        var dock = this.dock,
            ct = this.getTopAxisContainer();

        return (dock === 'top' || dock === 'bottom') ? ct.prev() : ct.getHeader();
    },

    /**
     * Set visibility of the "Column labels" header and container
     * @param {Boolean} visible
     */
    setTopAxisContainerVisible: function(visible){
        this.getTopAxisContainer().setVisible(visible);
        this.getTopAxisHeader().setVisible(visible);
    },

    /**
     * Returns the container that stores all fields configured on the aggregate.
     *
     * @return {Ext.pivot.plugin.configurator.Container}
     */
    getAggregateContainer: function(){
        return this.down('#fieldsAggCt');
    },

    /**
     * Returns the header of the container that stores all fields configured on the aggregate.
     *
     * @return {Ext.panel.Header}
     */
    getAggregateHeader: function(){
        var dock = this.dock,
            ct = this.getAggregateContainer();

        return (dock === 'top' || dock === 'bottom') ? ct.prev() : ct.getHeader();
    },

    /**
     * Set visibility of the "Values" header and container
     * @param {Boolean} visible
     */
    setAggregateContainerVisible: function(visible){
        this.getAggregateContainer().setVisible(visible);
        this.getAggregateHeader().setVisible(visible);
    },

    /**
     * Apply configurator changes to the pivot component.
     *
     * This function will trigger the delayed task which is actually reconfiguring the pivot component
     * with the new configuration.
     *
     */
    applyChanges: function(field){
        var me = this;

        if(me.disabled) {
            // if the plugin is disabled don't do anything
            return;
        }

        if(field) {
            me.lastFocusedField = field;
        }
        me.task.delay(me.getRefreshDelay());
    },

    collapseMe: function (){
        this.collapse(this.dock);
    },

    showSettings: function () {
        var pivot = this.getPivot(),
            win = new Ext.pivot.plugin.configurator.window.Settings({
                listeners: {
                    applysettings: Ext.bind(this.applyPivotSettings, this)
                }
            }),
            settings = pivot.getMatrix().serialize();

        delete(settings.leftAxis);
        delete(settings.topAxis);
        delete(settings.aggregate);

        if(pivot.fireEvent('beforeshowpivotsettings', this, {
                container:  win,
                settings:   settings
            }) !== false){

            win.loadSettings(settings);
            win.show();

            pivot.fireEvent('showpivotsettings', this, {
                container:  win,
                settings:   settings
            });
        }else{
            Ext.destroy(win);
        }
    },

    applyPivotSettings: function(win, settings){
        var pivot = this.getPivot();

        if(pivot.fireEvent('beforeapplypivotsettings', this, {
                container:  win,
                settings:   settings
            }) !== false) {

            pivot.fireEvent('applypivotsettings', this, {
                container:  win,
                settings:   settings
            });
            pivot.getMatrix().reconfigure(settings);
        }else{
            return false;
        }
    },

    /**
     * This function is used to retrieve all configured fields in a fields container.
     *
     * @private
     */
    getFieldsFromContainer: function(ct, justConfigs){
        var fields = [],
            len = ct.items.getCount(),
            i, item;

        for(i = 0; i < len; i++){
            item = ct.items.getAt(i);
            fields.push(justConfigs === true ? item.getField().getConfiguration() : item.getField());
        }

        return fields;
    },
    
    /**
     * Initialize all container fields fetching the configuration from the pivot grid.
     *
     * @private
     */
    initPivotFields: function(){
        var me = this,
            matrix = me.getPivot().getMatrix(),
            fieldsAllCt = me.getAllFieldsContainer(),
            fieldsLeftCt = me.getLeftAxisContainer(),
            fieldsTopCt = me.getTopAxisContainer(),
            fieldsAggCt = me.getAggregateContainer(),
            fieldsTop, fieldsLeft, fieldsAgg, fields;
        
        fields = me.getFields().clone();

        Ext.suspendLayouts();

        // remove all previously created columns
        fieldsAllCt.removeAll();
        fieldsTopCt.removeAll();
        fieldsLeftCt.removeAll();
        fieldsAggCt.removeAll();
        
        fieldsTop = me.getConfigFields(matrix.topAxis.dimensions.getRange());
        fieldsLeft = me.getConfigFields(matrix.leftAxis.dimensions.getRange());
        fieldsAgg = me.getConfigFields(matrix.aggregate.getRange());

        // the "All fields" will always contain all available fields (both defined on the plugin and existing in the matrix configuration)
        me.addFieldsToConfigurator(fields.getRange(), fieldsAllCt);
        me.addFieldsToConfigurator(fieldsTop, fieldsTopCt);
        me.addFieldsToConfigurator(fieldsLeft, fieldsLeftCt);
        me.addFieldsToConfigurator(fieldsAgg, fieldsAggCt);
        
        Ext.resumeLayouts(true);
        
    },

    /**
     * Easy function for assigning fields to a container.
     *
     * @private
     */
    addFieldsToConfigurator: function(fields, fieldsCt){
        var len = fields.length,
            i;

        for(i = 0; i < len; i++){
            fieldsCt.addField(fields[i], -1);
        }
    },
    
    /**
     * Build the fields array for each container by parsing all given fields or from the pivot config.
     *
     * @private
     */
    getConfigFields: function(items){
        var len = items.length,
            fields = this.getFields(),
            list = [],
            i, field, item;

        for(i = 0; i < len; i++){
            item = items[i];
            field = fields.byDataIndex.get(item.dataIndex);
            if(field){
                // we need to clone the field that includes all constraints
                // and apply the configs from the original field
                field = field.clone();
                field.setConfig(item.getInitialConfig());
                list.push(field);
            }
        }

        return list;
    },

    getMenuConfig: function(field){
        var me = this,
            fieldType = field.getFieldType(),
            items = [],
            menu = field.getMenuConfig() || {},
            container = field.up('pivotconfigcontainer'),
            siblings = container.items.getCount(),
            fieldIdx = container.items.indexOf(field),
            dimension = field.getField(),
            settings = dimension.getSettings(),
            fieldsLeftCt = me.getLeftAxisContainer(),
            fieldsTopCt = me.getTopAxisContainer(),
            fieldsAggCt = me.getAggregateContainer(),
            titleLeft = me.getLeftAxisHeader().getTitle().getText(),
            titleTop = me.getTopAxisHeader().getTitle().getText(),
            titleAgg = me.getAggregateHeader().getTitle().getText();

        menu.items = menu.items || [];

        if(fieldType == 'all'){
            items.push({
                text:       Ext.String.format(me.addToText, titleLeft),
                disabled:   !settings.isAllowed(fieldsLeftCt),
                handler:    Ext.bind(me.dragDropField, me, [fieldsLeftCt, field, 'after']),
                hidden:     fieldsLeftCt.isHidden()
            },{
                text:       Ext.String.format(me.addToText, titleTop),
                disabled:   !settings.isAllowed(fieldsTopCt),
                handler:    Ext.bind(me.dragDropField, me, [fieldsTopCt, field, 'after']),
                hidden:     fieldsTopCt.isHidden()
            },{
                text:       Ext.String.format(me.addToText, titleAgg),
                disabled:   !settings.isAllowed(fieldsAggCt),
                handler:    Ext.bind(me.dragDropField, me, [fieldsAggCt, field, 'after']),
                hidden:     fieldsAggCt.isHidden()
            });
        }else{
            items.push({
                text:       me.moveUpText,
                disabled:   (siblings == 1 || fieldIdx == 0),
                handler:    Ext.bind(me.dragDropField, me, [field.previousSibling(), field, 'before'])
            },{
                text:       me.moveDownText,
                disabled:   (siblings == 1 || fieldIdx == siblings - 1),
                handler:    Ext.bind(me.dragDropField, me, [field.nextSibling(), field, 'after'])
            },{
                text:       me.moveBeginText,
                disabled:   (siblings == 1 || fieldIdx == 0),
                handler:    Ext.bind(me.dragDropField, me, [container.items.first(), field, 'before'])
            },{
                text:       me.moveEndText,
                disabled:   (siblings == 1 || fieldIdx == siblings - 1),
                handler:    Ext.bind(me.dragDropField, me, [container.items.last(), field, 'after'])
            },{
                xtype:  'menuseparator'
            },{
                text:       Ext.String.format(me.moveToText, me.panelLeftFieldsTitle),
                disabled:   (fieldType == 'leftAxis' || !settings.isAllowed(fieldsLeftCt) || settings.isFixed(container)),
                handler:    Ext.bind(me.dragDropField, me, [fieldsLeftCt, field, 'after'])
            },{
                text:       Ext.String.format(me.moveToText, me.panelTopFieldsTitle),
                disabled:   (fieldType == 'topAxis' || !settings.isAllowed(fieldsTopCt) || settings.isFixed(container)),
                handler:    Ext.bind(me.dragDropField, me, [fieldsTopCt, field, 'after'])
            },{
                text:       Ext.String.format(me.moveToText, me.panelAggFieldsTitle),
                disabled:   (fieldType == 'aggregate' || !settings.isAllowed(fieldsAggCt) || settings.isFixed(container)),
                handler:    Ext.bind(me.dragDropField, me, [fieldsAggCt, field, 'after'])
            },{
                xtype:  'menuseparator'
            },{
                text:       me.removeFieldText,
                disabled:   settings.isFixed(container),
                handler:    Ext.bind(me.dragDropField, me, [me.getAllFieldsContainer(), field, 'after'])
            });
        }

        if(fieldType == 'aggregate'){
            items.push({
                xtype: 'menuseparator'
            }, {
                text:       me.fieldSettingsText,
                handler:    Ext.bind(me.openFieldSettings, me, [field])
            });
        }

        if(menu.items.length) {
            items.push({
                xtype: 'menuseparator'
            });
        }

        Ext.Array.insert(menu.items, 0, items);

        return Ext.apply({
            ownerCmp: me,
            floating: true
        }, menu);
    },

    openFieldSettings: function(field){
        var pivot = this.getPivot(),
            win = new Ext.pivot.plugin.configurator.window.FieldSettings({
                field:  field.getField(),
                listeners: {
                    applysettings: Ext.bind(this.applyFieldSettings, this, [field], 0)
                }
            }),
            settings = field.getField().getConfig();

        if(pivot.fireEvent('beforeshowconfigfieldsettings', this, {
                container:  win,
                settings:   settings
            }) !== false){

            win.loadSettings(settings);
            win.show();

            pivot.fireEvent('showconfigfieldsettings', this, {
                container:  win,
                settings:   settings
            });
        }else{
            Ext.destroy(win);
        }
    },

    applyFieldSettings: function(field, win, settings){
        var pivot = this.getPivot(),
            fieldCfg = field.getField();

        if(pivot.fireEvent('beforeapplyconfigfieldsettings', this, {
                container:  win,
                settings:   settings
            }) !== false) {

            fieldCfg.setConfig(settings || {});
            if (field.rendered) {
                field.textCol.setHtml(fieldCfg.getFieldText());
                field.textCol.dom.setAttribute('data-qtip', fieldCfg.getFieldText());
            }
            pivot.fireEvent('applyconfigfieldsettings', this, {
                container:  win,
                settings:   settings
            });
            this.applyChanges(field);
        }else{
            return false;
        }
    },

    /**
     * This function either moves or copies the dragged field from one container to another.
     *
     * @param {Ext.pivot.plugin.configurator.Container/Ext.pivot.plugin.configurator.Column} toTarget
     * @param {Ext.pivot.plugin.configurator.Column} column
     * @param {String} pos Position: `after` or `before`
     *
     * @private
     */
    dragDropField: function(toTarget, column, pos){
        var me = this,
            pivot = me.getPivot(),
            field = column.getField(),
            fromContainer = column.ownerCt,
            toContainer = toTarget.isConfiguratorContainer ? toTarget : toTarget.ownerCt,
            toField = toTarget.isConfiguratorField ? toTarget : toTarget.items.last(),
            fromFieldType = fromContainer.getFieldType(),
            toFieldType = toContainer.getFieldType(),
            topAxisCt = me.getTopAxisContainer(),
            leftAxisCt = me.getLeftAxisContainer(),
            newPos, item, toFocus;

        if (pivot.fireEvent('beforemoveconfigfield', this, {
                fromContainer:  fromContainer,
                toContainer:    toContainer,
                field:          field
            }) !== false) {

            if (fromContainer !== toContainer){
                if (toField) {
                    newPos = toContainer.items.findIndex('id', toField.id);
                    newPos = (pos === 'before') ? newPos : newPos + 1;
                } else {
                    newPos = -1;
                }

                if (toFieldType === 'all') {
                    // source is "Row labels"/"Column labels"/"Values"
                    // destination is "All fields"
                    // we just remove the field from the source
                    toField.focus();
                    fromContainer.removeField(column);
                } else if (toFieldType === 'aggregate') {
                    // source is "Row labels"/"Column labels"/"All fields"
                    // destination is "Values"
                    // we copy the field to destination
                    toFocus = toContainer.addField(field.clone(), newPos, true);
                    if (fromFieldType !== 'all'){
                        // remove the field from the left/top axis
                        fromContainer.remove(column);
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
                    } else {
                        item = me.findFieldInContainer(field, leftAxisCt);
                    }

                    // If so, move it here.
                    if (item) {
                        toContainer.add(item);
                        return me.applyChanges(item);
                    } else {
                        if(fromFieldType === 'aggregate'){
                            // we need to remove the dragged field because it was found on one of the axis
                            fromContainer.remove(column);
                        }
                        toFocus = toContainer.addField(field.clone(), newPos, true);
                    }
                }
            } else {
                toContainer.moveField(column.id, toField.id, pos);
            }
            
            // Ensure that any removal does not allow focus to escape to the body
            if (toFocus) {
                toFocus.focus();
                toFocus.el.resumeFocusEvents();
            }
        }

    },

    isAllowed: function (toTarget, column) {
        var allowed = true,
            field = column.getField(),
            fromContainer = column.ownerCt,
            toContainer = toTarget.isConfiguratorContainer ? toTarget : toTarget.ownerCt,
            fromFieldType = fromContainer.getFieldType(),
            toFieldType = toContainer.getFieldType();

        if (fromFieldType === 'aggregate' && (toFieldType === 'leftAxis' || toFieldType === 'topAxis')) {
            allowed = !this.findFieldInContainer(field, toContainer);
        }
        return allowed;
    },

    /**
     *
     * @param {Ext.pivot.plugin.configurator.Field} field
     * @param {Ext.pivot.plugin.configurator.Container} container
     * @returns {Ext.pivot.plugin.configurator.Column}
     *
     * @private
     */
    findFieldInContainer: function(field, container){
        var length = container.items.getCount(),
            i, item;

        for(i = 0; i < length; i++){
            item = container.items.getAt(i);
            if(item.getField().getDataIndex() == field.getDataIndex()){
                return item;
            }
        }
    },

    /**
     * Listener for the 'pivotdone' event. Initialize configurator fields or restore last field focus.
     *
     * @private
     */
    onPivotDone: function(){
        var me = this,
            field = me.lastFocusedField;

        if(me.internalReconfiguration){
            me.internalReconfiguration = false;

            // restore focus
            if(field && field.isConfiguratorContainer){
                field = field.items.first();
            }

            if(!field){
                field = me.getAllFieldsContainer().items.first();
            }

            if(field) {
                field.focus();
            }else{
                me.getPivot().focus();
            }
        }else {
            me.initPivotFields();
        }
    },

    /**
     * Collect configurator changes and reconfigure the pivot component
     *
     * @private
     */
    reconfigurePivot: function(){
        var me = this,
            pivot = me.getPivot(),
            obj = {
                topAxis:    me.getFieldsFromContainer(me.getTopAxisContainer(), true),
                leftAxis:   me.getFieldsFromContainer(me.getLeftAxisContainer(), true),
                aggregate:  me.getFieldsFromContainer(me.getAggregateContainer(), true)
            };

        me.internalReconfiguration = true;
        if(pivot.fireEvent('beforeconfigchange', me, obj) !== false){
            pivot.getMatrix().reconfigure(obj);
            pivot.fireEvent('configchange', me, obj);
        }
    },





    /**
     * This function is temporarily added here until the placeholder expanding/collpasing
     * is fixed for docked panels.
     *
     * @param direction
     * @param animate
     * @returns {Ext.pivot.plugin.configurator.Panel}
     * @private
     */
    placeholderCollapse: function(direction, animate) {
        var me = this,
            ownerCt = me.ownerCt,
            collapseDir = direction || me.collapseDirection,
            floatCls = Ext.panel.Panel.floatCls,
            placeholder = me.getPlaceholder(collapseDir),
            slideInDirection;

        me.isCollapsingOrExpanding = 1;

        // Upcoming layout run will ignore this Component
        me.setHiddenState(true);
        me.collapsed = collapseDir;

        if (placeholder.rendered) {
            // We may have been added to another Container from that in which we rendered the placeholder
            if (placeholder.el.dom.parentNode !== me.el.dom.parentNode) {
                me.el.dom.parentNode.insertBefore(placeholder.el.dom, me.el.dom);
            }

            placeholder.hidden = false;
            placeholder.setHiddenState(false);
            placeholder.el.show();
            ownerCt.updateLayout();
        } else {
            //ATE - this is the fix
            if(me.dock){
                placeholder.dock = me.dock;
                ownerCt.addDocked(placeholder);
            }else{
                ownerCt.insert(ownerCt.items.indexOf(me), placeholder);
            }
        }

        if (me.rendered) {
            // We assume that if collapse was caused by keyboard action
            // on focused collapse tool, the logical focus transition
            // is to placeholder's expand tool. Note that it may not be
            // the case when the user *clicked* collapse tool while focus
            // was elsewhere; in that case we dare not touch focus
            // to avoid sudden jumps.
            if (Ext.ComponentManager.getActiveComponent() === me.collapseTool) {
                me.focusPlaceholderExpandTool = true;
            }

            // We MUST NOT hide using display because that resets all scroll information.
            me.el.setVisibilityMode(me.placeholderCollapseHideMode);
            if (animate) {
                me.el.addCls(floatCls);
                placeholder.el.hide();
                slideInDirection = me.convertCollapseDir(collapseDir);

                me.el.slideOut(slideInDirection, {
                    preserveScroll: true,
                    duration: Ext.Number.from(animate, Ext.fx.Anim.prototype.duration),
                    listeners: {
                        scope: me,
                        afteranimate: function() {
                            var me = this;

                            me.el.removeCls(floatCls);

                            /* We need to show the element so that slideIn will work correctly.
                             * However, if we leave it visible then it can be seen before
                             * the animation starts, causing a flicker. The solution,
                             * borrowed from date picker, is to hide it using display:none.
                             * The slideIn effect includes a call to fixDisplay() that will
                             * undo the display none at the appropriate time.
                             */
                            me.placeholder.el.show().setStyle('display', 'none').slideIn(slideInDirection, {
                                easing: 'linear',
                                duration: 100,
                                listeners: {
                                    afteranimate: me.doPlaceholderCollapse,
                                    scope: me
                                }
                            });
                        }
                    }
                });
            }
            else {
                me.el.hide();
                me.doPlaceholderCollapse();
            }
        }
        else {
            me.isCollapsingOrExpanding = 0;
            if (!me.preventCollapseFire) {
                me.fireEvent('collapse', me);
            }
        }

        return me;
    },

    /**
     * This function is temporarily added here until the placeholder expanding/collpasing
     * is fixed for docked panels.
     *
     * @param animate
     * @returns {Ext.pivot.plugin.configurator.Panel}
     * @private
     */
    placeholderExpand: function(animate) {
        var me = this,
            collapseDir = me.collapsed,
            expandTool = me.placeholder.expandTool,
            floatCls = Ext.panel.Panel.floatCls,
            center = me.ownerLayout ? me.ownerLayout.centerRegion: null,
            finalPos, floatedPos;

        // Layouts suspended - don't bother with animation shenanigans
        if (Ext.Component.layoutSuspendCount) {
            animate = false;
        }

        if (me.floatedFromCollapse) {
            floatedPos = me.getPosition(true);
            // these are the same cleanups performed by the normal slideOut mechanism:
            me.slideOutFloatedPanelBegin();
            me.slideOutFloatedPanelEnd();
            me.floated = false;
        }

        // We assume that if expand was caused by keyboard action on focused
        // placeholder expand tool, the logical focus transition is to the
        // panel header's collapse tool.
        // Note that it may not be the case when the user *clicked* expand tool
        // while focus was elsewhere; in that case we dare not touch focus to avoid
        // sudden jumps.
        if (Ext.ComponentManager.getActiveComponent() === expandTool) {
            me.focusHeaderCollapseTool = true;

            // There is an odd issue with JAWS screen reader: when expanding a panel,
            // it will announce Expand tool again before focus is forced to Collapse
            // tool. I'm not sure why that happens since focus does not move from
            // Expand tool during animation; this hack should work around
            // the problem until we come up with more understanding and a proper
            // solution. The attributes are restored below in doPlaceholderExpand.
            expandTool._ariaRole = expandTool.ariaEl.dom.getAttribute('role');
            expandTool._ariaLabel = expandTool.ariaEl.dom.getAttribute('aria-label');

            expandTool.ariaEl.dom.setAttribute('role', 'presentation');
            expandTool.ariaEl.dom.removeAttribute('aria-label');
        }

        if (animate) {
            // Expand me and hide the placeholder
            Ext.suspendLayouts();
            me.placeholder.hide();
            me.el.show();
            me.collapsed = false;
            me.setHiddenState(false);

            // Stop the center region from moving when laid out without the placeholder there.
            // Unless we are expanding from a floated out situation. In that case, it's laid out immediately.
            if (center && !floatedPos) {
                center.hidden = true;
            }

            Ext.resumeLayouts(true);
            //ATE - this is the fix
            if(center) {
                center.hidden = false;
            }
            me.el.addCls(floatCls);

            // At this point, this Panel is arranged in its correct, expanded layout.
            // The center region has not been affected because it has been flagged as hidden.
            //
            // If we are proceeding from floated, the center region has also been arranged
            // in its new layout to accommodate this expansion, so no further layout is needed, just
            // element animation.
            //
            // If we are proceeding from fully collapsed, the center region has *not* been relayed out because
            // the UI look and feel dictates that it stays stable until the expanding panel has slid in all the
            // way, and *then* it snaps into place.

            me.isCollapsingOrExpanding = 2;

            // Floated, move it back to the floated pos, and thence into the correct place
            if (floatedPos) {
                finalPos = me.getXY();
                me.setLocalXY(floatedPos[0], floatedPos[1]);
                me.setXY([finalPos[0], finalPos[1]], {
                    duration: Ext.Number.from(animate, Ext.fx.Anim.prototype.duration),
                    listeners: {
                        scope: me,
                        afteranimate: function() {
                            var me = this;

                            me.el.removeCls(floatCls);
                            me.isCollapsingOrExpanding = 0;
                            me.fireEvent('expand', me);
                        }
                    }
                });
            }
            // Not floated, slide it in to the correct place
            else {
                me.el.hide();
                me.placeholder.el.show();
                me.placeholder.hidden = false;

                // Slide this Component's el back into place, after which we lay out AGAIN
                me.setHiddenState(false);
                me.el.slideIn(me.convertCollapseDir(collapseDir), {
                    preserveScroll: true,
                    duration: Ext.Number.from(animate, Ext.fx.Anim.prototype.duration),
                    listeners: {
                        afteranimate: me.doPlaceholderExpand,
                        scope: me
                    }
                });
            }
        }
        else {
            me.floated = me.collapsed = false;
            me.doPlaceholderExpand(true);
        }

        return me;
    }

});