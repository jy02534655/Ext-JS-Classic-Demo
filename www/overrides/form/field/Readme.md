# overrides/form/field目录
用于重写Ext.form.field相关类默认配置或增强功能
### Base.js
重写Ext.form.field.Base默认配置

支持allowBlank动态绑定，支持vtype动态绑定
### Text.js
重写Ext.form.field.Text默认配置

必填项自动标红加*，取值时自动清除前后空格，重置值时支持重置为指定的值
### TextArea.js
重写Ext.form.field.TextArea默认配置
### VTypes.js
重写Ext.form.field.VTypes

增加验证类型