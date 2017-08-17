//视图控制器
//会员级别
Ext.define('app.view.basis.level.Controller', {
    extend: 'ux.app.ViewController',
    alias: 'controller.basisLevel',
    //点击文字进行编辑
    onEditClick: function (t,rec) {
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
    }
});
