# Fasty -  a faster javascript templating engine.

[中文文档](./readme_cn.md)

Fasty is a simple and super fast templating engine that 
use a template rendering speed by a special cache solution, 
hence achieving runtime performance which is close to the limits of JavaScript. 
At the same time, it supports both NodeJS and browser.

>Fasty Rendering faster is 100+ times more than other JavaScript engines.

## Usage

**Usage 1**
```javascript
var template = '<div> hello {{ name }} </div>'
var data = {name: "fasty"}

var fasty = new Fasty();
var result = fasty.render(template,data);
// result: <div> hello fasty </div>
```

**Usage 2**
```javascript
var template = ' {{attr}} hello {{ func1(name) }}'
var data = {name: "fasty"}

var fasty = new Fasty({
    //the shared template data or functions
    share : {
        attr:'text...',
        func1:function (v){
            return v + " kiss~~"
        },
    }
});

var result = fasty.render(template,data);
// result: text... hello fasty kiss~~
```

## Fasty grammar


### output

```
// #1 Variable
{{~ var x = 100}}
{{x}}
//output: 100


// #2 string
{{"hello world"}}
//output: hello world


// #3 escape
{{* "<div> hello world </div>"}}
//output: &lt;div&gt; hello world &lt;/div&gt;



// #4 unescape
{{! "&lt;div&gt; hello world &lt;/div&gt;"}}
//output: <div> hello world </div>
```

## Variables definition

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

{{~ else}}

{{~ end}}
```

>Both support 'elseif' or 'else if'

### for-loop
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

### safely access

```
#1
{{a?.b?.c}}

#2
{{a.bbbb?().ccc?.ddd}}
```

### Recursive calls

```
var template1 = '{{~for (item of items)}} {{ myRender(item)}} {{~end}}';
var template2 = '{{~for (item of childItems)}} {{ myRender(item)}} {{~end}}';
var fasty = new Fasty({
    share : {
        //custom your render function
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


### init by options

```javascript
var options = {
    //the shared template data or functions
    share : {
        attr:'text...',
        func1:function (v){
            return v + " kiss~~"
        },
    },

    //default is false
    shareDataFirst: false,

    //default is true, bug not support for IE
    safelyAccess: true,
    
    //custom escape method 
    $escape:function (value){return value},
    
    //custom unescape method 
    $unescape:function (value){return value}
}


var fasty = new Fasty(options);
fast.render(template,data)
```

## Author

- Micahel (fuhai999@gmail.com) - 小码科技
- Wechat: wx198819880

## License
Fasty is licensed under the MIT License. 
