/**
 * 项目入口文件
 */
Ext.define('app.Application', {
    extend: 'Ext.app.Application',
    quickTips: false,
    platformConfig: {
        desktop: {
            quickTips: true
        }
    },
    //应用有更新就会触发
    onAppUpdate: function () {
        Ext.Msg.confirm('提示', '当前应用程序有新版本，是否更新？',
            function (choice) {
                if (choice === 'yes') {
                    window.location.reload();
                }
            }
        );
    }
});
