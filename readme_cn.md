# Fasty 一个极快的 JavaScript 模板引擎

Fasty 是一个简约、超快的 JavaScript 模板引擎， 它使用了非常独特的缓存技术，从而获得接近 JavaScript 极限的运行性能，并且同时支持 NodeJS 和浏览器。


> Fasty 的渲染速度，超过很多市面上的 JavaScript 引擎 100 倍以上。

## Fasty 特点
- 1、极高性能：Fasty 直接把模板内容编译成 JavaScript 执行，而不是使用正则替换，因此，Fasty 的渲染性能超过很多其他模板引擎 100 倍或以上。
- 2、极度简单：Fasty 只内置了输出指令 `{{ }}` 和 逻辑指令 `{{~ }}`
- 3、非常灵活：Fasty 直接与 JavaScript 打通，比如当我们引用 JQuery 之后，可以直接这样使用 `{{ $("#id").text() }}`


## 使用方法

**示例1**
```javascript
var template = '<div> hello {{ name }} </div>'
var data = {name: "fasty"}

var fasty = new Fasty();
var result = fasty.render(template,data);
// result: <div> hello fasty </div>
```

**示例2**
```javascript
var template = ' {{attr}} hello {{ func1(name) }} ---'
var data = {name: "fasty"}

var fasty = new Fasty({
    //共享的模板数据 或者 方法
    share : {
        attr:'text...',
        
        //定义了模板共享方法，因此在 {{...}} 中可以直接使用
        func1: function (v){
            return v + " kiss~~"
        },
    }
});

var result = fasty.render(template,data);
// result: text... hello fasty kiss~~
```


## Fasty 语法


### 输出

```
// #1 变量
{{~ var x = 100}}
{{x}}
//输出: 100


// #2 字符串
{{"hello world"}}
//输出：hello world


// #3 安全输出，对 html 进行 escape
{{# "<div> hello world </div>"}}
//输出：&lt;div&gt; hello world &lt;/div&gt;


// #4 强制转换 html 输出
{{! "&lt;div&gt; hello world &lt;/div&gt;"}}
//输出：<div> hello world </div>
```


## 变量定义

```
#1
{{~ var a =100}}

#2
{{~ var a =100,b = 200,c=300}}

#3
#{{~ let a =100}}

#4
#{{~ let a =100,b=200,c=300}}

#4
#{{~ const a =100}}

#5
#{{~ const a =100,b=200,c=300}}
```

### if-else

```
{{~ if (x == 100) }}

{{~ elseif(x == 200) }}

{{~ else if(x == 300) }}

{{~ else }}

{{~ end }}
```

> 同时支持 'elseif' or 'else if'

### for 循环
```
// #1
{{~ for (item of array) }}

{{~end}}

// #2
{{~ for (item in array) }}

{{~end}}

// #3
{{~ for (let item of array) }}

{{~end}}

// #4
{{~ for (const item in array) }}

{{~end}}

// #5
{{~ for (key of Object.keys(item) )}}

{{~end}}

// #6
{{~ for (var x = i;x < 100;x++) }}

{{~ end }}

// #7
{{~ for (item of someMethodInvoke().other()) }}

{{~end}}

// #8
{{~ for (var x = i;x < someMethodInvoke().other();x++) }}

{{~ end }}
```

### 安全访问

```
#1
{{a?.b?.c}}

#2
{{a.bbbb?().ccc?.ddd}}
```

### 递归调用

```javascript
var template1 = '{{~for (item of items)}} {{ myRender(item)}} {{~end}}';
var template2 = '{{~for (item of childItems)}} {{ myRender(item)}} {{~end}}';
var fasty = new Fasty({
    share : {
        //自定义你的递归渲染方法
        myRender:function (data){
            return fast.render(data,template2)
        },
    }
});

var data = {
  items: [
    {
      otherAttr: "value1",
      childItems: [
        {
          otherAttr: "value1",
          childItems: [],
        },
        {
          otherAttr: "value1",
          childItems: [],
        },
      ],
    },
    {
      otherAttr: "value1",
      childItems: [
        {
          otherAttr: "value1",
          childItems: [],
        },
        {
          otherAttr: "value1",
          childItems: [],
        },
      ],
    },
  ],
};
fast.render(data,template1);
```


### 初始化配置

```javascript
var options = {
    //共享模板方法和数据
    share : {
        attr:'text...',
        func1:function (v){
            return v + " kiss~~"
        },
    },
    // 是否是共享数据优先
    // 默认 false，即： render 方法传入的 data 数据优先
    shareDataFirst: false, //default is false
    
    //是否开启安全访问，这个功能不支持 IE 浏览器
    //IE 下需要设置为 false，同时配置 false 后会得到更高的运行性能
    safelyAccess: true,

    //自定义 html 安全输出方法
    //当使用 {{# ... }} 的时候使用该方法转换
    $escape:function (html){return html},

    //自定义 unescape 方法
    //当使用 {{! ... }} 的时候使用该方法转换
    $unescape:function (value){return value}
}

var fasty = new Fasty(options);
fast.render(template,data)
```

## 作者

- Micahel (fuhai999@gmail.com) - 小码科技
- Wechat: wx198819880

## License
Fasty is licensed under the MIT License. 

