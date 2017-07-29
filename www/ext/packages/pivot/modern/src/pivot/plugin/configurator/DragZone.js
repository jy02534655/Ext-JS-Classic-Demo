/**
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.DragZone', {
    extend: 'Ext.drag.Source',

    requires: [
        'Ext.drag.proxy.Placeholder'
    ],

    groups: 'pivotfields',
    proxy: {
        type: 'placeholder',
        cursorOffset: [-20, 30],
        placeholderCls: Ext.baseCSSPrefix + 'pivot-drag-proxy-placeholder',
        validCls: Ext.baseCSSPrefix + 'pivot-drag-proxy-placeholder-valid',
        invalidCls: Ext.baseCSSPrefix + 'pivot-drag-proxy-placeholder-invalid'
    },
    handle: '.' + Ext.baseCSSPrefix + 'listitem',

    platformConfig: {
        phone: {
            activateOnLongPress: true
        }
    },

    constructor: function(panel){
        var list = panel.getList();

        this.panel = panel;
        this.list = list;

        this.callParent([{
            element: list.getScrollable().getElement()
        }]);
    },

    onDragStart: function(info){
        var item = Ext.fly(info.eventTarget).up(this.getHandle()),
            html = '<span class="x-pivot-drag-placeholder-icon">&nbsp;</span><span>{0}</span>',
            record;

        if(!item || !item.component){
            return;
        }
        record = item.component.getRecord();

        info.setData('record', record);
        info.setData('sourceList', this.list);

        this.getProxy().setHtml(Ext.String.format(html, record.get('text')));
    }

});
