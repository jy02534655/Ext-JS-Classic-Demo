//公用类
//各种共用方法
Ext.define('app.util', {
    //别名，为了方便调用，这样通过 util.方法名(参数) 就能直接使用
    //如util.equals({a:1},{b:2});
    alternateClassName: 'util',
    statics: {
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