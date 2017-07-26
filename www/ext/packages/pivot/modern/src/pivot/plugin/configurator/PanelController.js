/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.PanelController', {
    extend: 'Ext.app.ViewController',

    alias: 'controller.pivotconfigpanel',

    destroy: function(){
        var me = this;

        me.pivotListeners = me.matrixProperties = Ext.destroy(me.pivotListeners);
        me.callParent();
    },

    closeMe: function(){
        var view = this.getView();
        view.fireEvent('close', view);
    },

    cancelConfiguration: function(){
        this.refreshDimensions();
        this.matrixProperties = null;
        this.closeMe();
    },

    applyConfiguration: function(){
        this.applyChanges().then(function(controller){
            controller.closeMe();
        });
    },

    showSettings: function () {
        var view = this.getView(),
            pivot = view.getPivot(),
            settings = pivot.getMatrix().serialize(),
            form = view.down('#settings');

        delete(settings.leftAxis);
        delete(settings.topAxis);
        delete(settings.aggregate);

        if(pivot.fireEvent('beforeshowpivotsettings', view, {
                container: form,
                settings: settings
            }) !== false) {

            view.setActiveItem(form);
            form.setMatrixProperties(settings);

            pivot.fireEvent('showpivotsettings', view, {
                container:  form,
                settings:   settings
            });
        }
    },

    backToMainView: function(){
        this.getView().setActiveItem('#main');
    },

    onPivotChanged: function(view, pivot){
        var me = this;

        Ext.destroy(me.pivotListeners);
        if(pivot){
            me.pivotListeners = pivot.getMatrix().on({
                done:       me.onPivotDone,
                scope:      me,
                destroyable:true
            });
        }
    },

    onFieldsChanged: function(view, fields){
        if(!fields){
            return;
        }

        this.refreshDimensions();
    },

    onBeforeApplyPivotSettings: function(form, settings){
        var view = this.getView();

        return view.getPivot().fireEvent('beforeapplypivotsettings', view, {
            container:  form,
            settings:   settings
        });
    },

    onApplyPivotSettings: function(form, settings){
        var view = this.getView();

        this.matrixProperties = settings;
        this.onConfigChanged();
        return view.getPivot().fireEvent('applypivotsettings', view, {
            container:  form,
            settings:   settings
        });
    },

    onBeforeApplyConfigFieldSettings: function(form, settings){
        var view = this.getView();

        return view.getPivot().fireEvent('beforeapplyconfigfieldsettings', view, {
            container:  form,
            settings:   settings
        });
    },

    onApplyConfigFieldSettings: function(form, settings){
        var view = this.getView();

        this.onConfigChanged();
        return view.getPivot().fireEvent('applyconfigfieldsettings', view, {
            container:  form,
            settings:   settings
        });
    },

    onConfigChanged: function(){
        this.configurationChanged = true;
    },

    showCard: function(container, item){
        var view = this.getView(),
            pivot = view.getPivot(),
            settings = item.getField().getSettings(),
            form = view.down('#field'),
            dataAgg = [],
            store, field, i, len;

        if(pivot.fireEvent('beforeshowconfigfieldsettings', view, {
                container:  form,
                settings:   settings
            }) !== false) {

            view.setActiveItem(form);
            form.setFieldItem(item);
            store = this.getAggregateContainer().getStore();
            len = store.getCount();
            for(i = 0; i < len; i++){
                field = store.getAt(i).get('field');
                dataAgg.push([field.getHeader(), field.getId()]);
            }
            form.getViewModel().getStore('sDimensions').loadData(dataAgg);

            pivot.fireEvent('showconfigfieldsettings', view, {
                container:  form,
                settings:   settings
            });
        }
    },

    onRemoveField: function(fromContainer, item, record){
        var view = this.getView();

        view.dragDropField(fromContainer, view.getAllFieldsContainer(), record);
    },

    refreshDimensions: function(){
        var me = this,
            view = me.getView(),
            pivot = view.getPivot(),
            matrix = pivot ? pivot.getMatrix() : null,
            fieldsTopCt, fieldsLeftCt, fieldsAggCt, fieldsAllCt,
            fieldsTop, fieldsLeft, fieldsAgg, fields;

        if(!matrix){
            return;
        }

        me.internalReconfiguration = true;

        fieldsAllCt = me.getAllFieldsContainer();
        fieldsTopCt = me.getTopAxisContainer();
        fieldsLeftCt = me.getLeftAxisContainer();
        fieldsAggCt = me.getAggregateContainer();

        fieldsAllCt.getStore().removeAll();
        fieldsTopCt.getStore().removeAll();
        fieldsLeftCt.getStore().removeAll();
        fieldsAggCt.getStore().removeAll();

        fields = view.getFields().clone();
        fieldsTop = me.getConfigFields(matrix.topAxis.dimensions.getRange());
        fieldsLeft = me.getConfigFields(matrix.leftAxis.dimensions.getRange());
        fieldsAgg = me.getConfigFields(matrix.aggregate.getRange());

        // the "All fields" will always contain all available fields (both defined on the plugin and existing in the matrix configuration)
        me.addFieldsToConfigurator(fields.getRange(), fieldsAllCt);
        me.addFieldsToConfigurator(fieldsTop, fieldsTopCt);
        me.addFieldsToConfigurator(fieldsLeft, fieldsLeftCt);
        me.addFieldsToConfigurator(fieldsAgg, fieldsAggCt);

        me.internalReconfiguration = false;
    },

    /**
     * Listener for the 'pivotdone' event. Initialize configurator fields or restore last field focus.
     *
     * @private
     */
    onPivotDone: function(){
        if(this.internalReconfiguration){
            this.internalReconfiguration = false;
        }else {
            this.refreshDimensions();
        }
    },

    /**
     * Collect configurator changes and reconfigure the pivot component
     *
     * @private
     */
    reconfigurePivot: function(resolve, reject){
        var me = this,
            view = me.getView(),
            pivot = view.getPivot(),
            obj = {
                topAxis:    me.getFieldsFromContainer(me.getTopAxisContainer(), true),
                leftAxis:   me.getFieldsFromContainer(me.getLeftAxisContainer(), true),
                aggregate:  me.getFieldsFromContainer(me.getAggregateContainer(), true)
            };

        Ext.apply(obj, me.matrixProperties);

        me.internalReconfiguration = true;
        if(pivot.fireEvent('beforeconfigchange', view, obj) !== false){
            pivot.getMatrix().reconfigure(obj);
            pivot.fireEvent('configchange', view, obj);
        }
        resolve(me);
    },

    /**
     * Returns the container that stores all unused fields.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getAllFieldsContainer: function(){
        return this.lookupReference('fieldsCt');
    },

    /**
     * Returns the container that stores all fields configured on the left axis.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getLeftAxisContainer: function(){
        return this.lookupReference('fieldsLeftCt');
    },

    /**
     * Returns the container that stores all fields configured on the top axis.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getTopAxisContainer: function(){
        return this.lookupReference('fieldsTopCt');
    },

    /**
     * Returns the container that stores all fields configured on the aggregate.
     *
     * @returns {Ext.pivot.plugin.configurator.Container}
     */
    getAggregateContainer: function(){
        return this.lookupReference('fieldsAggCt');
    },

    /**
     * Apply configurator changes to the pivot component.
     *
     * This function will trigger the delayed task which is actually reconfiguring the pivot component
     * with the new configuration.
     *
     * @return {Ext.Promise}
     */
    applyChanges: function(){
        var me = this;

        return new Ext.Promise(function (resolve, reject) {
            var view = me.getView();

            if(me.configurationChanged) {
                me.configurationChanged = false;

                if (view.isHidden() || me.internalReconfiguration) {
                    // if the plugin is disabled don't do anything
                    reject(me);
                    return;
                }

                Ext.asap(me.reconfigurePivot, me, [resolve, reject]);
            }else{
                resolve(me);
            }
        });
    },

    /**
     * This function is used to retrieve all configured fields in a fields container.
     *
     * @private
     */
    getFieldsFromContainer: function(ct, justConfigs){
        var store = ct.getStore(),
            len = store.getCount(),
            fields = [],
            i, item;

        for(i = 0; i < len; i++){
            item = store.getAt(i).get('field');
            fields.push(justConfigs === true ? item.getConfiguration() : item);
        }

        return fields;
    },

    /**
     * Easy function for assigning fields to a container.
     *
     * @private
     */
    addFieldsToConfigurator: function(fields, fieldsCt){
        var len = fields.length,
            i;

        fieldsCt.getStore().removeAll();

        for(i = 0; i < len; i++){
            fieldsCt.addField(fields[i], -1);
        }

        fieldsCt.getList().refresh();
    },

    /**
     * Build the fields array for each container by parsing all given fields or from the pivot config.
     *
     * @private
     */
    getConfigFields: function(items){
        var len = items.length,
            fields = this.getView().getFields(),
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
    }

});
