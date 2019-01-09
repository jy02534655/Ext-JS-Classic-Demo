//模拟数据源
//帮助
Ext.define('app.data.faq.FAQ', {
    extend: 'app.data.Simulated',

    data: [{
            name: '接口',

            questions: [{
                    question: '这个示例的接口用什么开发的?',
                    answer: '这个示例没有服务端，用的Ext Js 框架自带的类模拟的接口，所有的数据都是假数据！'
                },
                {
                    question: '实际开发过程中要如何才能对接接口?',
                    answer: '只要服务端开发的接口返回的数据格式符合标准，在实际开发过程中只需要调整请求地址即可，无须其他改动。'
                },
                {
                    question: '模拟接口返回的状态码都是成功状态，实际开发过程中调用接口失败怎么办?',
                    answer: '本示例已做全局处理，并且在帮助类中封装了ajax调用，ajax与ajaxP等方法可以自动处理失败信息，只要服务端开发的接口返回的数据格式符合标准，在实际开发过程中只需要调整请求地址即可，无须其他改动。如果需要自行处理错误状态，调用帮助类中ajaxB方法或者自己写代码实现即可。'
                },
                {
                    question: '什么样的数据才是标准数据?',
                    answer: '<p>服务端返回的数据一般分三种，一种是列表数据，一种是单条数据，最好一种是树形数据。具体格式内容可以参考app/data文件夹下模拟接口代码。'
                },
                {
                    question: '为什么示例中有些地方我进行刷新/新增/修改后数据没有发生变化?',
                    answer: '因为在示例里面我使用了模拟接口，所有的数据都是固定的数据，有些示例没有做无刷新处理，所以数据不会刷新，这并不会影响实际开发。'
                },
                {
                    question: '为什么我用谷歌浏览器调试时看不到请求的数据?',
                    answer: '<div>因为在示例里面我使用了模拟接口，所以谷歌浏览器调试模式看不到，不过我用console.log()做了输出，可以直接在console中查看。</div><div>如图：</div><img src="resources/images/console.jpg">'
                }
            ]
        },
        {
            name: '开发',

            questions: [{
                question: '为什么我使用一个Ext自带的控件/自定义类时报找不到这个类时控制台报：<font color=red>xxxx is not defined</font>？',
                answer: '在Ext Js中所有的类使用都需要通过<font color=red>extend:"你要使用的类"</font>或者<font color=red>requires:["你要使用的类"]</font>方式来引入,引入后需要执行<font color=red>sencha app build</font>命令编译一下项目。如果不引入对应的类并编译项目，Ext Js自带的基础类在开发模式中不会报错，但是在控制台中会有警告出现，打包后警告会变成错误提示。自定义类会直接报错无法使用。'
            }, {
                question: '为什么我使用一个Ext自带的控件如日期控件,展示效果和官方示例不一样？',
                answer: '你没有引入这个类并且编译项目，Ext Js的默认样式只有基础样式，每次使用新的控件的时候，需要引入这个类并且编译项目才能把这个类对应的样式加入到你的项目中。'
            }]
        },
        {
            name: '源码',

            questions: [{
                question: '在那里能看到源码?',
                answer: '<a href="https://github.com/jy02534655/Ext-JS-Classic-Demo" target="_blank">https://github.com/jy02534655/Ext-JS-Classic-Demo</a>'
            }]
        },
        {
            name: '疑问',

            questions: [{
                    question: '在那里能反馈示例bug?',
                    answer: '如果发现bug发送邮件到<font color=red>molangzaishi@qq.com</font>，bug描述方式请参考前端大神张鑫旭的文章<a href="http://www.zhangxinxu.com/wordpress/2015/05/how-to-ask-web-front-question" target="_blank">http://www.zhangxinxu.com/wordpress/2015/05/how-to-ask-web-front-question/</a>'
                },
                {
                    question: '有没有QQ群可以让大家能够交流技术?',
                    answer: '<div style="padding:3px 3px 3px 0;color: rgb(255,56,0);">        Ext Js 交流群欢迎你加入</div><div><span style="padding:3px 3px 3px 0;float:left;">            群1：</span><span style="margin:0 auto;    display: block;"><a target="_blank" href="http://shang.qq.com/wpa/qunwpa?idkey=344ec6a5e3967f274f9f810d4289f181ce6425169dab13ee64b950481b3473fc"><img border="0" src="http://pub.idqqimg.com/wpa/images/group.png" alt="Sencha Touch 交流" title="Sencha Touch 交流"></a></span></div><div style="margin-top:3px"><span style="padding:3px 3px 3px 0;float:left;">            群2：</span><span style="margin:0 auto;    display: block;"><a target="_blank" href="http://shang.qq.com/wpa/qunwpa?idkey=df0bb7c613ca7eef2ad51a03f0f95f9dc23a9116df821f496c5d29c348113f02"><img border="0" src="http://pub.idqqimg.com/wpa/images/group.png" alt="Sencha Touch Develop" title="Sencha Touch Develop"></a></span></div>'
                }
            ]
        }
    ]
});