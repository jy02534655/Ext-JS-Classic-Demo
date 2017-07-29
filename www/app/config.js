//公用类
//用于存放各种配置
Ext.define('app.config', {
    //别名，为了方便调用，这样通过 config.参数名 就能直接使用
    //如config.ver
    alternateClassName: 'config',
    statics: {
        //临时配置参数
        tmpConfig:null,
        //版本号
        ver:'1.0.0'
    }
});