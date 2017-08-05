//视图控制器
//课程管理
Ext.define('app.view.basis.course.Controller', {
    extend: 'ux.app.ViewController',
    alias: 'controller.basisCourse',
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
        this.showBackView('back.mainCardPanel.basisCourseEdit', {
            viewModel: {
                data: {
                    //是否编辑
                    isEdit:!!rec,
                    title: rec ? '修改课程: ' + rec.get('type') : '新增课程',
                    data: rec ? rec : Ext.create('app.model.basis.Course')
                },
                stores: {
                    store: this.getStore('basisCourseStore')
                }
            }
        });
    },
    //保存
    onSave: function () {
        this.viewModelSave();
    },
    //点击删除按钮
    onDeleteClick: function () {
        //获取待删除项
        var rec = this.getView().getSelectionModel().getSelection()[0];
        Ext.widget('basisCourseDel', {
            viewModel: {
                data: {
                    data: rec,
                    title: '删除课程: ' + rec.get('name')
                },
                stores: {
                    store: this.getStore('basisCourseStore')
                }
            }
        });
    },
    //删除
    onDel: function () {
        //删除成功后会刷新列表
        //本示例接口是模拟接口，所以不会删除数据
        //事件开发过程中只要服务端删除了数据列表数据自然会被删除
        this.winSave(config.basis.course.del);
    }
});
