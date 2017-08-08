//视图
//锁定页
Ext.define('app.view.user.Lock', {
    extend: 'app.view.widget.LockingWindow',
    xtype: 'userlock',
    title: '锁定',
    defaultFocus : 'authdialog',  
    items: [
        {
            xtype: 'authdialog',
            reference: 'authDialog',
            defaultButton : 'loginButton',
            autoComplete: false,
            width: 455,
            defaultFocus : 'textfield[inputType=password]',
            layout: {
                type  : 'vbox',
                align : 'stretch'
            },

            items: [
                {
                    xtype: 'container',
                    cls: 'auth-profile-wrap',
                    height : 120,
                    layout: {
                        type: 'hbox',
                        align: 'center'
                    },
                    items: [
                        {
                            xtype: 'image',
                            height: 80,
                            margin: 20,
                            width: 80,
                            alt: 'lockscreen-image',
                            cls: 'lockscreen-profile-img auth-profile-img',
                            src: 'resources/images/user-profile/2.png'
                        },
                        {
                            xtype: 'box',
                            html: '<div class=\'user-name-text\'> 戈夫·史密斯 </div><div class=\'user-post-text\'> 项目经理 </div>'
                        }
                    ]
                },

                {
                    xtype: 'container',
                    padding: '0 20',
                    layout: {
                        type: 'vbox',
                        align: 'stretch'
                    },

                    defaults: {
                        margin: '10 0'
                    },

                    items: [
                        {
                            xtype: 'textfield',
                            labelAlign: 'top',
                            cls: 'lock-screen-password-textbox',
                            labelSeparator: '',
                            fieldLabel: '请输入您的密码重新登录',
                            emptyText: 'Password',
                            inputType: 'password',
                            allowBlank: false,
                            triggers: {
                                glyphed: {
                                    cls: 'trigger-glyph-noop password-trigger'
                                }
                            }
                        },
                        {
                            xtype: 'button',
                            reference: 'loginButton',
                            scale: 'large',
                            ui: 'soft-blue',
                            iconAlign: 'right',
                            iconCls: 'x-fa fa-angle-right',
                            text: 'Login',
                            formBind: true,
                            listeners: {
                                click: 'onLoginButton'
                            }
                        },
                        {
                            xtype: 'component',
                            html: '<div style="text-align:right">' +
                                '<a href="#login" class="link-forgot-password">'+
                                    '使用其他账号登录</a>' +
                                '</div>'
                        }
                    ]
                }
            ]
        }
    ]
});
