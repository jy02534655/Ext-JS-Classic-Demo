/**
  *支持表单自动填充功能
 */
Ext.define('app.view.widget.Dialog', {
    extend: 'Ext.form.Panel',
    xtype: 'authdialog',
    /*
     * 自动设置焦点到可用的、显示的、无值的文本框中
     */
    defaultFocus: 'textfield:focusable:not([hidden]):not([disabled]):not([value])',

    /**
        * @cfg {Boolean} [autoComplete = false]
        * 是否启用自动填充功能
       */
    autoComplete : false,

    initComponent: function () {
        var me = this, listen;

        if (me.autoComplete) {
            me.autoEl = Ext.applyIf(
                me.autoEl || {},
                {
                    tag: 'form',
                    name: 'authdialog',
                    method: 'post'
                });
        }

        me.addCls('auth-dialog');
        me.callParent();

        if (me.autoComplete) {
            listen = {
                afterrender : 'doAutoComplete',
                scope : me,
                single : true
            };

            Ext.each(me.query('textfield'), function (field) {
                field.on(listen);
            });
        }
    },

    doAutoComplete : function(target) {
        if (target.inputEl && target.autoComplete !== false) {
            target.inputEl.set({ autocomplete: 'on' });
        }
    }
});
