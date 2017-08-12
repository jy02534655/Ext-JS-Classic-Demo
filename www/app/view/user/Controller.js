//视图控制器
//用户控制器
Ext.define('app.view.user.Controller', {
    extend: 'ux.app.ViewController',
    alias: 'controller.user',
    //登录页面启动时
    onLoginRender: function () {
        var me = this;
        app.model.User.load('app.model.User-1', {
            success: function (user) {
                me.getViewModel().setData(user.getData());
            }
        });
    },
    onSpecialkey: function (f, e) {
        var me = this;
        if (e.getKey() == e.ENTER) {
            me.onLoginClick();
        }
    },
    //点击登录
    onLoginClick: function (button) {
        var me = this,
         view = me.getView(),
         form = view.down('form'), values = form.getValues();
        //请求登录接口
        util.ajaxB(config.user.login, values, 'POST').then(function (response) {
            if (response.success) {
                me.keepUser(values);
                //登录成功
                me.loginSuccess(response.data);
            } else {
                //登录失败
                form.getForm().setValues({
                    password: ''
                });
            }
            //提示消息
            Ext.toast(response.message);
        });
    },
    loginSuccess: function (data) {
        config.userData = data;
        this.getView().close();
        this.redirectTo('user.home');
    },
    //保存用户信息
    keepUser: function (user) {
        if (!user.persist) {
            user.password = '';
        }
        user.id = 'app.model.User-1';
        var logUser = Ext.create('app.model.User', user);
        //储存到本地
        logUser.save();
    },
    //取消解锁
    onUnLock: function () {
        var me = this;
        me.formSave(config.user.unLock).then(function () {
            me.onClose();
        });
    },
    //找回密码
    onReset: function () {
        var me = this;
        me.formSave(config.user.reset);
    },
    //注册
    onRegister: function () {
        var me = this;
        me.formSave(config.user.register).then(function (response) {
            //注册成功后自动登录
            me.loginSuccess(response.data);
        });
    }
});
