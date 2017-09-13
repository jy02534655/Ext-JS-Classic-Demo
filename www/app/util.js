//公用类
//各种共用方法
Ext.define('app.util', {
    //别名，为了方便调用，这样通过 util.方法名(参数) 就能直接使用
    //如util.equals({a:1},{b:2});
    alternateClassName: 'util',
    statics: {

        //ajax请求，post提交方式
        //使用方式util.ajaxP(url, params,isNoMes).then(function(response){执行方法})
        //url请求地址
        //params参数
        //isNoMes是否不显示消息提示
        //response返回的数据，已转换为json
        //只有执行成功才执行then
        ajaxP: function (url, params, isNoMes) {
            return this.ajax(url, params, isNoMes, 'POST');
        },
        //ajax请求，get提交方式
        //使用方式util.ajax(url, params,isNoMes).then(function(response){执行方法})
        //url请求地址
        //params参数
        //isNoMes是否不显示消息提示
        //response返回的数据，已转换为json
        //只有执行成功才执行then
        ajax: function (url, params, isNoMes, method) {
            var deferred = new Ext.Deferred();
            Ext.Ajax.request({
                url: url,
                method: method || 'GET',
                params: params,
                success: function (response) {
                    //处理返回值，转换为json对象
                    response = Ext.decode(response.responseText);
                    if (response.success) {
                        deferred.resolve(response);
                    }
                    if (!response.success || !isNoMes) {
                        Ext.toast(response.message);
                    }
                }
            });
            return deferred.promise;
        },
        //可以返回错误信息的ajax
        ajaxB: function (url, params, method) {
            var deferred = new Ext.Deferred();
            Ext.Ajax.request({
                url: url,
                method: method || 'GET',
                params: params,
                success: function (response) {
                    //处理返回值，转换为json对象
                    response = Ext.decode(response.responseText);
                    deferred.resolve(response);
                },
                failure: function () {
                    deferred.resolve({
                        success: false,
                        message: '请求失败，服务端无法连接或出错！'
                    });
                }
            });
            return deferred.promise;
        },
        //可以返回错误信息的ajax
        ajaxB: function (url, params, method) {
            var deferred = new Ext.Deferred();
            Ext.Ajax.request({
                url: url,
                method: method || 'GET',
                params: params,
                success: function (response) {
                    //处理返回值，转换为json对象
                    response = Ext.decode(response.responseText);
                    deferred.resolve(response);
                },
                failure: function () {
                    deferred.resolve({
                        success: false,
                        message: '请求失败，服务端无法连接或出错！'
                    });
                }
            });
            return deferred.promise;
        },

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
        },

        //链式
        //model.saveModel方式
        //使用方式util.saveModel(model).then(function(record, b){执行方法})
        //model model
        //只有执行成功才执行then
        saveModel: function (model) {
            var deferred = new Ext.Deferred(),
            phantom = model.phantom;
            //console.log(phantom, model.dirty);
            //修改状态并且未做修改
            if (!phantom && !model.dirty) {
                console.log('模型数据无变化，直接返回消息!');
                Ext.toast('编辑成功！');
                //直接返回数据
                deferred.resolve({
                    rec: model,
                    phantom: phantom
                });
            } else {
                model.save({
                    success: function (record, b) {
                        Ext.toast(b.getResultSet().message);
                        deferred.resolve({
                            rec: record,
                            phantom: phantom
                        });
                    },
                    //表单提交失败
                    failure: function (response, b) {
                        //如果是修改
                        if (!phantom) {
                            //取消模型的更改
                            model.reject();
                        }
                        try {
                            Ext.toast(b.getResultSet().message);
                        } catch (e) { }
                    }
                });
            }
            return deferred.promise;
        },

        //验证模型
        //form  表单视图控件
        //model 模型对象
        validFormModel: function (form, model) {
            //更新模型数据，讲表单中的数据赋给模型
            form.updateRecord(model);
            var errors = model.validate(),
            //验证结果
            valid = errors.isValid(),
            message;
            if (!valid) {
                //遍历错误信息，弹出提示框
                errors.each(function (err) {
                    //提示信息，注意这里依赖于Ext.Toast，需引入
                    //2秒后自动隐藏此信息，默认为1秒后隐藏
                    Ext.toast(err.getMessage());
                    return false;
                });
                return valid;
            }
            return model;
        },

        //获取视图中所有输入对象
        getViewFields: function (view, byName) {
            var fields = {},
            itemName;

            var getFieldsFrom = function (item) {
                if (item.is('field')) {
                    itemName = item.getName();

                    if ((byName && itemName == byName) || typeof byName == 'undefined') {
                        if (fields.hasOwnProperty(itemName)) {
                            if (!Ext.isArray(fields[itemName])) {
                                fields[itemName] = [fields[itemName]];
                            }

                            fields[itemName].push(item);
                        } else {
                            fields[itemName] = item;
                        }
                    }

                }

                if (item.isContainer) {
                    item.items.each(getFieldsFrom);
                }
            };

            view.items.each(getFieldsFrom);

            return (byName) ? (fields[byName] || []) : fields;
        },
        //获取视图中所有值
        //view视图对象
        getViewValues: function (view, enabled, all) {
            //获取到视图中所有的输入对象
            var fields = this.getViewFields(view),
            values = {},
            isArray = Ext.isArray,
            //是否通过验证
            isValid = true,
            field,
            val,
            valid,
            addValue,
            bucket,
            name,
            data,
            ln,
            i;
            //取值方法
            addValue = function (field) {
                //获取提交data
                data = field.getSubmitData();
                //如果是obj数据
                if (Ext.isObject(data)) {
                    //循环遍历
                    for (name in data) {
                        //判断data中是否有name这个属性
                        if (data.hasOwnProperty(name)) {
                            //取的值
                            val = data[name];
                            if (!val || val === '') {
                                return;
                            }
                            //如果是按钮
                            if (!field.isRadio) {
                                //如果values中已经有这个值了
                                if (values.hasOwnProperty(name)) {
                                    //临时存储这个值
                                    bucket = values[name];
                                    //如果不是数组
                                    if (!isArray(bucket)) {
                                        bucket = values[name] = [bucket];
                                    }
                                    //如果是数组
                                    if (isArray(val)) {
                                        //合并值
                                        values[name] = bucket.concat(val);
                                    } else {
                                        //添加值
                                        bucket.push(val);
                                    }
                                } else {
                                    //没有则直接赋值
                                    values[name] = val;
                                }
                            } else {
                                values[name] = values[name] || val;
                            }
                        }
                    }
                }
            };
            //验证并取值
            valid = function (field) {
                if (!field.isValid()) {
                    isValid = false;
                } else {
                    addValue(field);
                }
            };

            // 遍历fields赋值
            for (name in fields) {
                if (fields.hasOwnProperty(name)) {
                    field = fields[name];
                    if (isArray(field)) {
                        ln = field.length;
                        for (i = 0; i < ln; i++) {
                            valid(field[i]);
                        }
                    } else {
                        valid(field);
                    }
                }
            }
            //通过验证
            if (isValid) {
                return values;
            }
            return false;
        },
        //重置视图内所有值
        //isAll 是否重置所有内容
        resetView: function (view, isAll) {
            if (!view) {
                return;
            }
            var fields = this.getViewFields(view),
            isArray = Ext.isArray,
            field,
            ln,
            i,
            name;
            //循环遍历，重置值
            for (name in fields) {
                if (fields.hasOwnProperty(name)) {
                    field = fields[name];

                    if (isArray(field)) {
                        ln = field.length;
                        for (i = 0; i < ln; i++) {
                            //隐藏域不重置，除非isAll为tre
                            if (!field[i].isXType('hiddenfield') || isAll) {
                                field[i].reset();
                            }
                        }
                    } else {
                        //隐藏域不重置，除非isAll为tre
                        if (!field.isXType('hiddenfield') || isAll) {
                            field.reset();
                        }
                    }
                }
            }
        },
        //纳新的需求重写参数
        neuropathyData: function (name, limit, page, params, paramsName) {
            data = {
                p0: name,
                p1: this.getP1(limit, page, params, paramsName)
            };
            console.log(data);
            return data;
        },
        //纳新的需求重写参数
        getP1: function (limit, page, params, paramsName) {
            var length = paramsName.length,
            digital = {},
            digitalName, p1, i;
            for (i = 0; i < length; i++) {
                digitalName = paramsName[i];
                digital[digitalName] = params[digitalName];
            }
            p1 = [digital, limit, page];
            return Ext.encode(p1);
        }
    }
});