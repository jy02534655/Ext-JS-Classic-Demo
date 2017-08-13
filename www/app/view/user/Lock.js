//视图
//锁定页
Ext.define('app.view.user.Lock', {
    extend: 'app.view.widget.LockingWindow',
    xtype: 'userlock',
    controller: 'user',
    title: '锁定中',
    items: [{
        cls: 'auth-dialog',
        xtype: 'form',
        defaultButton: 'unLockButton',
        width: 455,
        layout: {
            type: 'vbox',
            align: 'stretch'
        },
        items: [{
            xtype: 'container',
            cls: 'auth-profile-wrap',
            height: 120,
            layout: {
                type: 'hbox',
                align: 'center'
            },
            items: [{
                xtype: 'image',
                height: 80,
                margin: 20,
                width: 80,
                alt: 'lockscreen-image',
                cls: 'lockscreen-profile-img auth-profile-img',
                bind: {
                    src: '{userData.img}'
                }
            },
            {
                xtype: 'box',
                //因为视图没有指定数据源，默认使用核心数据源中的数据
                bind: {
                    html: '<div class=\'user-name-text\'> {userData.fullName} </div><div class=\'user-post-text\'> {userData.position} </div>'
                }
            }]
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
            items: [{
                xtype: 'textfield',
                labelAlign: 'top',
                cls: 'lock-screen-password-textbox',
                labelSeparator: '',
                fieldLabel: '请输入您的密码解除锁定',
                emptyText: '密码',
                blankText: '请输入您的密码解除锁定',
                name: 'password',
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
                reference: 'unLockButton',
                scale: 'large',
                ui: 'soft-blue',
                iconAlign: 'right',
                iconCls: 'x-fa fa-angle-right',
                text: '解除锁定',
                formBind: true,
                listeners: {
                    click: 'onUnLock'
                }
            },
            {
                xtype: 'component',
                html: '<div style="text-align:right">' + '<a href="#view.login" class="link-forgot-password">' + '使用其他账号登录</a>' + '</div>'
            }]
        }]
    }]
});