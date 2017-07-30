//公用类
//各种共用方法
Ext.define('app.util', {
    //别名，为了方便调用，这样通过 util.方法名(参数) 就能直接使用
    //如util.equals({a:1},{b:2});
    alternateClassName: 'util',
    statics: {
        //视图请求store数据的方法，这个视图必须绑定了store
        //view视图对象
        //params参数，这是一个json对象，示例{userName:'test',passWord:'test'}
        //update是否强制重新请求数据
        viewLoad: function (view, params, update) {
            var store = view.getStore(),
            storeId = store.storeId;
            if (storeId == 'ext-empty-store') {
                //在ext中，如果使用bind方式绑定store，在加载数据时可能出现store还未绑定到视图中就请求数据的情况
                //这种情况我们就获取到ViewModel，根据ViewModel来加载数据
                //console.log('列表还未绑定store，从ViewModel中加载');
                store = view.getViewModel().getStore(view.getBind().store.stub.name);
            }
            this.storeLoad(store, params, update);
        },
        //store请求数据的方法
        //store数据仓库对象
        //params参数，这是一个json对象，示例{userName:'test',passWord:'test'}
        //update是否强制重新请求数据
        storeLoad: function (store, params, update) {
            //console.log('store正在加载:', store.isLoading(), '参数：', params);
            //如果已经在请求数据，中断
            if (store.isLoading()) {
                return;
            } else if (update) {
                //如果强制刷新，重新设置参数，并且清空数据
                store.getProxy().setExtraParams(params);
                store.removeAll();
            }
                //如果有参数
            else if (params) {
                //获取旧的参数
                var oldParams = store.getProxy().getExtraParams();
                //如果没有数据直接重新请求
                //比较新旧两个参数是否相同，如果不同，重新设置参数，并且清空数据
                //如果相同中断执行
                if (store.getCount() < 1) {
                    store.getProxy().setExtraParams(params);
                } else if (!this.equals(oldParams, params)) {
                    store.getProxy().setExtraParams(params);
                    store.removeAll();
                } else {
                    return;
                }
            } else if (store.getCount() > 0) {
                //console.log('已有数据，中断执行');
                //如果没有参数，但是数据已经存在，中断执行
                return;
            }
            //请求数据
            store.loadPage(1);
        },
        //比较两个对象是否相等
        equals: function (x, y) {
            var me = this;
            //直接相等
            if (x === y) {
                return true;
            }
            //如果x或者y任意一个不是object类型
            if (!(x instanceof Object) || !(y instanceof Object)) {
                return false;
            }
            //如果constructor不相等
            if (x.constructor !== y.constructor) {
                return false;
            }
            //遍历比较
            for (var p in x) {
                //如果p是x的属性
                if (x.hasOwnProperty(p)) {
                    //如果y中没有p这个属性
                    if (!y.hasOwnProperty(p)) {
                        return false;
                    }
                    //原代码x[p] === y[p]
                    //这里不进行强制比较
                    if (x[p] == y[p]) {
                        continue;
                    }
                    if (typeof (x[p]) !== "object") {
                        return false;
                    }
                    if ((!x[p] && y[p]) || (x[p] && !y[p])) {
                        return false;
                    }
                    //自调用进行比较
                    if (!me.equals(x[p], y[p])) {
                        return false;
                    }
                }
            }
            for (p in y) {
                if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) {
                    return false;
                }
            }
            return true;
        }
    }
});