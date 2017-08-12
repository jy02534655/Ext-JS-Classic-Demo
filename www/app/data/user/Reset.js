//模拟数据源
//重置密码接口
Ext.define('app.data.user.Reset', {
    extend: 'app.data.Simulated',
    data: {
        success: true,
        message: '密码重置成功，邮件已发送到指定邮箱！'
    }
});