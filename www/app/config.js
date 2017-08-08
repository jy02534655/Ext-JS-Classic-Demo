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
        ver: '1.0.1',
        //用户
        user: {
            login: '~api/user/login',
            //导航菜单
            navigation: '~api/user/navigation'
        },
        //基础配置
        basis: {
            //会员卡类型
            card: {
                //新增
                add: '~api/add',
                //列表
                list: '~api/basis/card',
                //删除
                del: '~api/delete',
                //更新
                update: '~api/update'
            },
            //会员卡类型
            course: {
                add: '~api/add',
                list: '~api/basis/course',
                del: '~api/delete',
                update: '~api/update'
            }
        },
        //帮助
        faq: {
            list:'~api/faq/faq'
        }
    }
});