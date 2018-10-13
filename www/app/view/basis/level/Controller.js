//视图控制器
//员工级别
Ext.define('app.view.basis.level.Controller', {
    extend: 'ux.app.ViewController',
    alias: 'controller.basisLevel',
    //点击文字进行编辑
    onEditClick: function (t, rec) {
        this.createView(rec);
    },
    //点击添加按钮
    onAddClick: function () {
        this.createView(null, config.categoryRecord);
    },
    //创建视图
    createView: function (rec, categoryRecord) {
        Ext.widget('basisLevelEdit', {
            viewModel: {
                data: {
                    title: rec ? '修改员工级别: ' + rec.get('type') : '新增员工级别',
                    //因为是在员工类别基础上新增员工级别，所以新增时需要给一个员工类别到服务端
                    data: rec ? rec : Ext.create('app.model.basis.Level', {
                        categoryId: categoryRecord.get('id')
                    })
                },
                stores: {
                    store: this.getStore('basisLevelStore')
                }
            }
        });
    },
    //保存
    onSave: function () {
        this.winModelSave();
    },
    //点击删除
    onDeleteClick: function () {
        this.onDelete(config.basis.level.del, 'id', '确认删除?');
    },

    //点击待遇设置
    onPlayClick: function () {
        var grid = this.getView(),
            //获取已选中项
            rec = grid.getSelectionModel().getSelection()[0],
            //获取数据仓库
            store = this.getStore('payStore');
        Ext.widget('levelPay', {
            viewModel: {
                stores: {
                    payStore: store
                },
                data: {
                    data: rec
                }
            }
        });
    },
    //员工待遇分配界面显示时
    onPayShow: function () {
        //获取已设置的待遇
        //在6.2.1版本中需要延迟执行。否则会出现布局错误导致树形菜单无法展开
        //在6.5.3版本中不需要延迟执行，否则会出现提交数据时不能正确获取当前勾选项的问题
        util.storeLoad(this.getStore('payStore'), {
                id: this.getViewModel().get('data').getId()
            },
            true);
    },
    //保存待遇
    onSavePay: function () {
        var me = this,
            view = this.getView(),
            //获取选中项集合
            list = view.down('treepanel').getChecked(),
            length = list.length,
            ids = [],
            i;
        for (i = 0; i < length; i++) {
            ids.push(list[i].getId())
        }
        //将选中项id以逗号分割形式传到服务端
        util.ajaxP(config.basis.level.pay.edit, {
            //主键
            id: view.getViewModel().get('data').getId(),
            itemId: ids.toString()
        }).then(function () {
            me.closeView();
        });
    }
});