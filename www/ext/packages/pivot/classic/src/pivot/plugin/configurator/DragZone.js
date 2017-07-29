/**
 * This class is used for managing the configurator's panel drag zone.
 *
 * @private
 */
Ext.define('Ext.pivot.plugin.configurator.DragZone', {
    extend: 'Ext.dd.DragZone',

    configColumnSelector:       '.' + Ext.baseCSSPrefix + 'pivot-grid-config-column',
    configColumnInnerSelector:  '.' + Ext.baseCSSPrefix + 'pivot-grid-config-column-inner',
    maxProxyWidth:              120,
    dragging:                   false,
    
    constructor: function(panel) {
        this.panel = panel;
        this.ddGroup =  this.getDDGroup();
        this.callParent([panel.el]);
    },

    getDDGroup: function() {
        // return the column header dd group so we can allow column droping inside the grouping panel
        return 'configurator-' + this.panel.id;
    },
    
    getDragData: function(e) {
        var header, headerCmp, ddel, field;

        if (e.getTarget(this.configColumnInnerSelector)) {
            header = e.getTarget(this.configColumnSelector);

            if (header) {
                headerCmp = Ext.getCmp(header.id);
                headerCmp.focus();
                field = headerCmp.getField();

                if (!this.panel.dragging && field && !field.getSettings().isFixed(headerCmp.ownerCt)) {
                    ddel = document.createElement('div');
                    ddel.innerHTML = headerCmp.header;
                    return {
                        ddel: ddel,
                        header: headerCmp
                    };
                }
            }
        }
        return false;
    },

    onBeforeDrag: function() {
        return !(this.panel.dragging || this.disabled);
    },

    onInitDrag: function() {
        this.panel.dragging = true;
        this.callParent(arguments);
    },
    
    onDragDrop: function() {
        this.panel.dragging = false;
        this.callParent(arguments);
    },

    afterRepair: function() {
        this.callParent();
        this.panel.dragging = false;
    },

    getRepairXY: function() {
        return this.dragData.header.el.getXY();
    },
    
    disable: function() {
        this.disabled = true;
    },
    
    enable: function() {
        this.disabled = false;
    }

});