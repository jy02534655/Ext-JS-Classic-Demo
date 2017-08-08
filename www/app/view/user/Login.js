//视图
//登录页
Ext.define('app.view.user.Login', {
    extend: 'app.view.widget.LockingWindow',
    xtype: 'login',
    requires: [
      'Ext.form.field.Checkbox'
    ],
    controller: 'user',
    listeners: {
        //监听页面初始化事件
        render: 'onLoginRender'
    },
    title: '登录',
    defaultFocus: 'authdialog',
    items: [
        {
            xtype: 'authdialog',
            //默认提交按钮
            defaultButton: 'loginButton',
            //自动填充
            autoComplete: true,
            bodyPadding: '20 20',
            width: 415,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            defaults: {
                margin: '5 0'
            },
            items: [
                {
                    xtype: 'label',
                    text: '请登录'
                },
                {
                    xtype: 'textfield',
                    cls: 'auth-textbox',
                    name: 'userid',
                    bind: '{userid}',
                    height: 55,
                    fieldLabel: '用户名',
                    hideLabel: true,
                    allowBlank: false,
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
                    msgTarget: 'qtip',
                    fieldLabel: '密码',
                    inputType: 'password',
                    name: 'password',
                    bind: '{password}',
                    allowBlank: false,
                    triggers: {
                        glyphed: {
                            cls: 'trigger-glyph-noop auth-password-trigger'
                        }
                    }
                },
                {
                    xtype: 'container',
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'checkboxfield',
                            flex: 1,
                            cls: 'form-panel-font-color rememberMeCheckbox',
                            height: 30,
                            inputValue: 1,
                            name: 'persist',
                            bind: '{persist}',
                            boxLabel: '记住我'
                        },
                        {
                            xtype: 'box',
                            html: '<a href="#view.passwordreset" class="link-forgot-password"> 忘记密码 ?</a>'
                        }
                    ]
                },
                {
                    xtype: 'button',
                    reference: 'loginButton',
                    scale: 'large',
                    ui: 'soft-green',
                    iconAlign: 'right',
                    iconCls: 'x-fa fa-angle-right',
                    text: '登录',
                    formBind: true,
                    listeners: {
                        click: 'onLoginClick'
                    }
                },
                {
                    xtype: 'box',
                    html: '<div class="outer-div"><div class="seperator">&</div></div>',
                    margin: '10 0'
                },
                {
                    xtype: 'button',
                    scale: 'large',
                    ui: 'gray',
                    iconAlign: 'right',
                    iconCls: 'x-fa fa-user-plus',
                    //触发路由
                    href: '#view.register',
                    //本页打开
                    hrefTarget: '_self',
                    text: '注册'
                }
            ]
        }
    ],
    initComponent: function () {
        this.addCls('user-login-register-container');
        this.callParent(arguments);
    }
});
