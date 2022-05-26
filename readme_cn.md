# Fasty 一个极快的 JavaScript 模板引擎

Fasty 是一个简约、超快的 JavaScript 模板引擎， 它使用了非常独特（独创的）的缓存技术，从而获得接近 JavaScript 极限的运行性能，并且同时支持 NodeJS 和浏览器。


> Fasty 的渲染速度，超过了已知市面上的所有 JavaScript 引擎 100 倍以上。


## 使用方法

```javascript
var fasty = new Fasty({
    //共享的模板数据 或者 方法
    share : {
        att1:'attr',
        func1:function (){},
    }
});
fasty.render(template,data);
```


## Fasty 语法


### 输出

```
// #1
{{var x = 100}}
{{x}}

// #2
{{"hello world"}}
```

### if-else
```
{{~if (x == 100)}}

{{~else if(x == 200)}}

{{~else}}

{{~end}}
```

### for 循环
```
// #1
{{~for (item of array)}}

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

## 作者

- Micahel (fuhai999@gmail.com) - 小码科技
- Wechat: wx198819880

## License
Fasty is licensed under the MIT License. 

