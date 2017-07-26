Ext.define('Ext.layout.component.field.Text', {
    extend: 'Ext.layout.component.Auto',
    alias: 'layout.textfield',

    beginLayoutCycle: function(ownerContext, firstCycle) {
        ownerContext.el.toggleCls(ownerContext.target.heightedCls,
            !ownerContext.heightModel.shrinkWrap);

        this.callParent([ownerContext, firstCycle]);
    }
});