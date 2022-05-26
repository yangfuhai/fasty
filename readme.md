# Fasty -  a faster javascript templating engine.

Fasty is a simple and super fast templating engine that 
use a template rendering speed by a special cache solution(Original), 
hence achieving runtime performance which is close to the limits of JavaScript. 
At the same time, it supports both NodeJS and browser.

>Fasty Rendering faster is 100+ times  more than other JavaScript engines.

## Usage

**Usage 1**
```javascript
var template = '<div> hello {{ name }} </div>'
var data = {name: "fasty"}

var fasty = new Fasty();
var result = fasty.render(template,data);
// result :<div> hello fasty </div>
```

**Usage 2**
```javascript
var template = ' {{attr}} hello {{ func1(name) }} ---'
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
// result : text... hello fasty kiss~~
```

## Fasty grammar


### output

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

### for-loop
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

### safely access

```
#1
{{a?.b?.c}}

#2
{{a.bbbb?().ccc?.ddd}}
```

### init options

```javascript
var options = {
    //the shared template data or functions
    share : {
        attr:'text...',
        func1:function (v){
            return v + " kiss~~"
        },
    },
    shareDataFirst: false, //default is false
    safelyAccess: true,//default is true, bug not support IE
}
```

## Author

- Micahel (fuhai999@gmail.com) - 小码科技
- Wechat: wx198819880

## License
Fasty is licensed under the MIT License. 
