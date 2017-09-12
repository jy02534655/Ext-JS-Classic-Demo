//视图控制器
//用户控制器
Ext.define('app.view.user.Controller', {
    extend: 'ux.app.ViewController',
    alias: 'controller.user',
    //登录页面启动时
    onLoginRender: function () {
        var me = this;
        app.model.User.load(1, {
            success: function (user) {
                //如果读取到本地用户信息，自动填充到表单
                me.getViewModel().setData(user.getData());
            }
        });
    },
    onSpecialkey: function (f, e) {
        var me = this;
        if (e.getKey() == e.ENTER) {
            //按回车时自动提交数据
            me.onLoginClick();
        }
    },
    //点击登录
    onLoginClick: function (button) {
        var me = this,
        view = me.getView(),
        form = view.down('form'),
        values = form.getValues();
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
    //登录成功
    loginSuccess: function (data) {
        //全局变量写入用户信息
        config.userData = data;
        //关闭弹窗
        this.getView().close();
        //触发路由
        //由核心控制器接收路由，处理登录成功流程
        this.redirectTo('user.home');
    },
    //保存用户信息
    keepUser: function (user) {
        if (!user.persist) {
            user.password = '';
        }
        //id必须为int类型，否则localstorage代理不能正确存储ids
        user.id = 1;
        var logUser = Ext.create('app.model.User', user);
        //储存到本地
        logUser.save();
    },
    //取消锁定
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