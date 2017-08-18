//视图控制器
//会员级别
Ext.define('app.view.basis.level.Controller', {
    extend: 'ux.app.ViewController',
    alias: 'controller.basisLevel',
    //点击文字进行编辑
    onEditClick: function (t, rec) {
        this.createView(rec);
    },
    //点击添加按钮
    onAddClick: function () {
        this.createView();
    },
    //创建视图
    createView: function (rec) {
        Ext.widget('basisLevelEdit', {
            viewModel: {
                data: {
                    //根据rec判断是新增还是修改
                    title: rec ? '修改会员级别: ' + rec.get('type') : '新增会员级别',
                    //新增则创建一个模型对象
                    //编辑则直接赋值
                    //用于新增编辑时操作数据，名称固定为data
                    data: rec ? rec : Ext.create('app.model.basis.Level')
                },
                stores: {
                    //用于新增编辑成功后保存数据，名称固定为store
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
        util.storeLoad(this.getStore('payStore'), {
            id: this.getViewModel().get('data').getId()
        },
        true);
    },
    //保存权限
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
    },
});