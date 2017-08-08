//视图
//找回密码
Ext.define('app.view.user.PasswordReset', {
    extend: 'app.view.widget.LockingWindow',
    xtype: 'passwordreset',
    title: '找回密码',
    defaultFocus : 'authdialog', 
    items: [
        {
            xtype: 'authdialog',
            width: 455,
            defaultButton: 'resetPassword',
            autoComplete: true,
            bodyPadding: '20 20',
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            defaults : {
                margin: '10 0'
            },
            items: [
                {
                    xtype: 'label',
                    cls: 'lock-screen-top-label',
                    text: '通过邮箱找回密码'
                },
                {
                    xtype: 'textfield',
                    cls: 'auth-textbox',
                    height: 55,
                    name: 'email',
                    hideLabel: true,
                    allowBlank: false,
                    msgTarget: 'qtip',
                    fieldLabel: '邮箱',
                    vtype: 'email',
                    triggers: {
                        glyphed: {
                            cls: 'trigger-glyph-noop auth-email-trigger'
                        }
                    }
                },
                {
                    xtype: 'button',
                    reference: 'resetPassword',
                    scale: 'large',
                    ui: 'soft-blue',
                    formBind: true,
                    iconAlign: 'right',
                    iconCls: 'x-fa fa-angle-right',
                    msgTarget: 'qtip',
                    text: '找回密码',
                    listeners: {
                        click: 'onResetClick'
                    }
                },
                {
                    xtype: 'component',
                    html: '<div style="text-align:right">' +
                        '<a href="#view.login" class="link-forgot-password">'+
                            '返回登录</a>' +
                        '</div>'
                }
            ]
        }
    ]
});
