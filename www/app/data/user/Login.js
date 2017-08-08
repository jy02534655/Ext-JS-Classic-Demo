//模拟数据源
//登录接口
Ext.define('app.data.user.Login', {
    extend: 'app.data.Simulated',
    data: {
        success: true,
        message: '登录成功',
        data: {
            userid: 1,
            fullName: '张三',
            img: 'resources/images/user-profile/2.png'
        }
    }
});