//视图
//注册页
Ext.define('app.view.user.Register', {
    extend: 'app.view.widget.LockingWindow',
    xtype: 'register',
    title: '注册',
    defaultFocus: 'authdialog',  
    items: [
        {
            xtype: 'authdialog',
            bodyPadding: '20 20',
            width: 455,
            reference : 'authDialog',
            defaultButton : 'submitButton',
            autoComplete: true,
            cls: 'auth-dialog-register',
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            defaults : {
                margin: '10 0',
                selectOnFocus : true
            },
            items: [
                {
                    xtype: 'label',
                    cls: 'lock-screen-top-label',
                    text: '创建账号'
                },
                {
                    xtype: 'textfield',
                    cls: 'auth-textbox',
                    height: 55,
                    hideLabel: true,
                    allowBlank: false,
                    fieldLabel: '姓名',
                    msgTarget: 'qtip',
                    name: 'fullName',
                    bind: '{fullName}',
                    triggers: {
                        glyphed: {
                            cls: 'trigger-glyph-noop auth-email-trigger'
                        }
                    }
                },
                {
                    xtype: 'textfield',
                    cls: 'auth-textbox',
                    height: 55,
                    hideLabel: true,
                    allowBlank : false,
                    name: 'userid',
                    bind: '{userid}',
                    fieldLabel: '用户名',
                    msgTarget: 'qtip',
                    triggers: {
                        glyphed: {
                            cls: 'trigger-glyph-noop auth-email-trigger'
                        }
                    }
                },
                {
                    xtype: 'textfield',
                    cls: 'auth-textbox',
                    height: 55,
                    hideLabel: true,
                    allowBlank : false,
                    name: 'email',
                    fieldLabel: '邮箱',
                    vtype: 'email',
                    bind: '{email}',
                    triggers: {
                        glyphed: {
                            cls: 'trigger-glyph-noop auth-envelope-trigger'
                        }
                    }
                },
                {
                    xtype: 'textfield',
                    cls: 'auth-textbox',
                    height: 55,
                    hideLabel: true,
                    allowBlank : false,
                    fieldLabel: '密码',
                    name: 'password',
                    inputType: 'password',
                    bind: '{password}',
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
                    allowBlank : false,
                    boxLabel: '我同意注册条款和条件',

                    // 除非同意条件，否则不能提交
                    isValid: function() {
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
                    bind: false,
                    margin: '5 0',
                    iconAlign: 'right',
                    iconCls: 'x-fa fa-angle-right',
                    text: '注册',
                    listeners: {
                        click: 'onSignupClick'
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
