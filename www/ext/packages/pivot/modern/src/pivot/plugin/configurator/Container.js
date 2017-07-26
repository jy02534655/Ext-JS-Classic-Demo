/**
 * This is a container that holds configurator fields.
 */
Ext.define('Ext.pivot.plugin.configurator.Container', {
    extend: 'Ext.Panel',

    alias: 'widget.pivotconfigcontainer',

    requires: [
        'Ext.pivot.plugin.configurator.Column',
        'Ext.pivot.plugin.configurator.DragZone',
        'Ext.pivot.plugin.configurator.DropZone',
        'Ext.dataview.List'
    ],

    config: {
        /**
         * Possible values:
         *
         * - `all` = the container is the "all fields" area;
         * - `aggregate` = the container is the "values" area;
         * - `leftAxis` = the container is the "row values" area;
         * - `topAxis` = the container is the "column values" area;
         *
         */
        fieldType: 'all',
        emptyText: null,

        store: {
            type: 'array',
            fields: [
                {name: 'text', type: 'string'},
                {name: 'field', type: 'auto'}
            ]
        },

        list: {
            xclass: 'Ext.dataview.List',
            handleSorting: false,
            handleFiltering: false,
            isConfiguratorContainer: true,
            disableSelection: true,
            itemConfig: {
                xtype: 'pivotconfigfield'
            },
            deferEmptyText: false,
            touchAction: {
                panX: false,
                pinchZoom: false,
                doubleTapZoom: false
            },
            itemRipple: false
        }
    },

    layout: 'fit',

    initialize: function() {
        var me = this,
            list = me.getList();

        me.callParent();

        me.dragZone = new Ext.pivot.plugin.configurator.DragZone(me);
        me.dropZone = new Ext.pivot.plugin.configurator.DropZone(me);

        if (me.getFieldType() !== 'all') {
            list.element.on({
                delegate: '.' + Ext.baseCSSPrefix + 'pivot-grid-config-column-btn',
                tap: me.handleColumnBtnTap,
                scope: me
            });

            list.element.on({
                delegate: '.' + Ext.baseCSSPrefix + 'listitem-body-el',
                tap: me.handleColumnTap,
                scope: me
            });
        }
    },

    destroy: function () {
        Ext.destroyMembers(this, 'storeListeners', 'dragZone', 'dropZone');

        this.callParent();
    },

    updateFieldType: function (type) {
        if (type !== 'all') {
            this.setUserCls(Ext.baseCSSPrefix + 'pivot-grid-config-container');
        }
    },

    updateEmptyText: function(text) {
        var list = this.getList();

        if(list) {
            list.setEmptyText(text);
        }
    },

    applyList: function (list, oldList) {
        var store;

        if (list) {
            store = this.getStore();

            if (list.isComponent) {
                list.setStore(store);
            } else {
                list.store = store;
                list.emptyText = this.getEmptyText();

                list = Ext.factory(list, Ext.dataview.List, oldList);
            }
        }

        return list;
    },

    updateList: function (list) {
        if (list) {
            this.add(list);
        }
    },

    applyStore: function (store) {
        return Ext.Factory.store(store);
    },

    updateStore: function (store, oldStore) {
        var me = this;

        Ext.destroy(me.storeListeners);

        if (store) {
            me.storeListeners = store.on({
                datachanged: me.applyChanges,
                scope: me
            });
        }
    },

    /**
     * This is used for firing the 'configchange' event
     *
     */
    applyChanges: function () {
        if (this.getFieldType() !== 'all') {
            this.fireEvent('configchange', this);
        }
    },

    /**
     * This is used for adding a new config field to this container.
     *
     * @private
     */
    addField: function (config, pos) {
        var me = this,
            store = me.getStore(),
            fieldType = me.getFieldType(),
            cfg = {};

        config.isAggregate = (fieldType === 'aggregate');

        Ext.apply(cfg, {
            field:      config,
            text:       config.getFieldText()
        });

        if (pos >= 0) {
            store.insert(pos, cfg);
        } else {
            store.add(cfg);
        }
    },

    removeField: function (record) {
        this.getStore().remove(record);

        record.set('field', null);
    },

    moveField: function (record, pos) {
        var store = this.getStore(),
            index = store.indexOf(record);

        if (pos === -1 && index === store.getCount() - 1) {
            // nothing to do here;
            // the record is already on the last position in the store
            return;
        }

        store.remove(record);

        if (pos >= 0) {
            store.insert(pos, record);
        } else {
            store.add(record);
        }
    },

    handleColumnBtnTap: function (e) {
        var me = this,
            target = Ext.fly(e.currentTarget),
            item = target.up('.' + me.getList().baseCls + 'item').component,
            record = item.getRecord();

        if (!record) {
            return;
        }

        if (target.hasCls(Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-delete')) {
            me.fireEvent('removefield', me, item, record);
            return;
        }

        if (target.hasCls(Ext.baseCSSPrefix + 'pivot-grid-config-column-btn-tools')) {
            me.fireEvent('toolsbtnpressed', me, item);
        }
    },

    handleColumnTap: function (e) {
        var me = this,
            target = Ext.fly(e.currentTarget),
            item = target.up('.' + me.getList().baseCls + 'item').component,
            record = item.getRecord();

        if (!record) {
            return;
        }

        me.fireEvent('toolsbtnpressed', me, item);
    }
});
