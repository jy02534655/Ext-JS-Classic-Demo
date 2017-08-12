//视图
//注册页
Ext.define('app.view.user.Register', {
    extend: 'app.view.widget.LockingWindow',
    xtype: 'register',
    controller: 'user',
    title: '注册',
    items: [{
        cls: 'auth-dialog',
        xtype: 'form',
        bodyPadding: '20 20',
        width: 455,
        defaultButton: 'submitButton',
        layout: {
            type: 'vbox',
            align: 'stretch'
        },
        defaults: {
            margin: '10 0',
            selectOnFocus: true
        },
        items: [{
            xtype: 'label',
            cls: 'lock-screen-top-label',
            text: '创建账号'
        },
        {
            xtype: 'textfield',
            cls: 'auth-textbox',
            hideLabel: true,
            allowBlank: false,
            fieldLabel: '姓名',
            name: 'fullName',
            triggers: {
                glyphed: {
                    cls: 'trigger-glyph-noop auth-email-trigger'
                }
            }
        },
        {
            xtype: 'textfield',
            cls: 'auth-textbox',
            hideLabel: true,
            allowBlank: false,
            name: 'userid',
            fieldLabel: '用户名',
            triggers: {
                glyphed: {
                    cls: 'trigger-glyph-noop auth-email-trigger'
                }
            }
        },
        {
            xtype: 'textfield',
            cls: 'auth-textbox',
            hideLabel: true,
            allowBlank: false,
            name: 'email',
            fieldLabel: '邮箱',
            vtype: 'email',
            triggers: {
                glyphed: {
                    cls: 'trigger-glyph-noop auth-envelope-trigger'
                }
            }
        },
        {
            xtype: 'textfield',
            cls: 'auth-textbox',
            hideLabel: true,
            allowBlank: false,
            fieldLabel: '密码',
            name: 'password',
            inputType: 'password',
            triggers: {
                glyphed: {
                    cls: 'trigger-glyph-noop auth-password-trigger'
                }
            }
        },
        {
            xtype: 'checkbox',
            flex: 1,
            name: 'agrees',
            cls: 'form-panel-font-color rememberMeCheckbox',
            height: 32,
            bind: '{agrees}',
            allowBlank: false,
            boxLabel: '我同意注册条款和条件',
            // 除非同意条件，否则不能提交
            isValid: function () {
                var me = this;
                return me.checked || me.disabled;
            }
        },
        {
            xtype: 'button',
            scale: 'large',
            ui: 'soft-blue',
            formBind: true,
            reference: 'submitButton',
            margin: '5 0',
            iconAlign: 'right',
            iconCls: 'x-fa fa-angle-right',
            text: '注册',
            listeners: {
                click: 'onRegister'
            }
        },
        {
            xtype: 'component',
            html: '<div style="text-align:right">' + '<a href="#view.login" class="link-forgot-password">' + '返回登录</a>' + '</div>'
        }]
    }]
});