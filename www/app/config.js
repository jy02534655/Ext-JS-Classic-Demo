//公用类
//用于存放各种配置
//没钱买服务器，后端接口用js模拟，返回的数据是固定数据
//只要服务端返回的数据格式标准
//实际开发中直接把模拟接口地址换成后端地址直接就能用
Ext.define('app.config', {
    //别名，为了方便调用，这样通过 config.参数名 就能直接使用
    //如config.ver
    alternateClassName: 'config',
    statics: {
        //临时配置参数
        tmpConfig:null,
        //版本号
        ver: '1.0.1',
        //无须登陆检测就可以访问的页面
        //例如登录页的xtype为login，就配置为login:true
        //注意xtype只能小写
        unCheck: {
            userlock: true,
            userreset: true,
            login: true,
            register: true
        },
        //统计报表
        report: {
            //员工统计
            employee: '~api/report/employee',
            //销量
            sales: '~api/report/sales',
            //市场占有率
            share: '~api/report/share'
        },
        //用户
        user: {
            //注册
            register: '~api/user/login',
            //重置密码
            reset: '~api/user/reset',
            //解除绑定
            unLock: '~api/user/login',
            //登录
            login: '~api/user/login',
            //导航菜单
            navigation: '~api/user/navigation'
        },
        //基础配置
        basis: {
            //员工级别
            level: {
                //员工待遇
                pay:{
                    tree: '~api/basis/pay',
                    edit: '~api/update'
                },
                add: '~api/add',
                list: '~api/basis/level',
                del: '~api/delete',
                update: '~api/update'
            },
            //员工类别
            category: {
                add: '~api/add',
                list: '~api/basis/category',
                del: '~api/delete',
                update: '~api/update'
            },
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
