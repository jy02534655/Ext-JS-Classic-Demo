//动态加载js
//在类中mixins: ['ux.mixin.Loader'],调用
Ext.define('ux.mixin.Loader', {
    mixinId: 'uxMixinUser',
    //加载js
    //url地址string 或者 string[]
    //name js标识，用于判断是否已经加载该js，使用过程中注意不要重复
    loadScript: function (url, name) {
        //在Ext中注册一个全局变量
        if (!Ext.uxJsGlobal) {
            Ext.uxJsGlobal = {};
        }
        var deferred = new Ext.Deferred();
        //判断该js是否已经加载
        if (Ext.uxJsGlobal[name]) {
            //如果已经加载js，直接回调
            deferred.resolve();
        } else {
            //加载指定js
            Ext.Loader.loadScript({
                url: url,
                //加载成功标识为已加载并回调
                onLoad: function () {
                    Ext.uxJsGlobal[name] = true;
                    deferred.resolve();
                },
                //错误处理
                onError: function () {
                    Ext.toast('扩展加载失败，请返回重试！');
                }
            });
        }
        return deferred.promise;
    }
});