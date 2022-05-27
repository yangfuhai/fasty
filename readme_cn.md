# Fasty 一个极快的 JavaScript 模板引擎

Fasty 是一个简约、超快的 JavaScript 模板引擎， 它使用了非常独特（独创的）的缓存技术，从而获得接近 JavaScript 极限的运行性能，并且同时支持 NodeJS 和浏览器。


> Fasty 的渲染速度，超过了已知市面上的所有 JavaScript 引擎 100 倍以上。


## 使用方法

**示例1**
```javascript
var template = '<div> hello {{ name }} </div>'
var data = {name: "fasty"}

var fasty = new Fasty();
var result = fasty.render(template,data);
// result :<div> hello fasty </div>
```

**示例2**
```javascript
var template = ' {{attr}} hello {{ func1(name) }} ---'
var data = {name: "fasty"}

var fasty = new Fasty({
    //共享的模板数据 或者 方法
    share : {
        attr:'text...',
        func1:function (v){
            return v + " kiss~~"
        },
    }
});

var result = fasty.render(template,data);
// result : text... hello fasty kiss~~
```


## Fasty 语法


### 输出

```
// #1
{{~ var x = 100}}
{{x}}

// #2
{{"hello world"}}
```

### if-else
```
{{~ if (x == 100)}}

{{~ elseif(x == 200)}}

{{~ else}}

{{~ end}}
```

### for 循环
```
// #1
{{~ for (item of array)}}

{{~end}}

// #2
{{~for (item in array)}}

{{~end}}

// #3
{{~for (key of Object.keys(item))}}

{{~end}}

// #4
{{~for (var x = i;x < 100;x++)}}

{{~end}}
```

### 安全访问

```
#1
{{a?.b?.c}}

#2
{{a.bbbb?().ccc?.ddd}}
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
    
    //是否开启安全访问，这个功能是使用 Proxy 实现的，不支持 IE 浏览器
    //IE 下需要设置为 false
    safelyAccess: true,
}
```

## 作者

- Micahel (fuhai999@gmail.com) - 小码科技
- Wechat: wx198819880

## License
Fasty is licensed under the MIT License. 

