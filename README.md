## webpack是如何工作的？

## 主要内容包括：

- 打包的文件
- 文件的依赖关系
- 整体思路梳理
- 代码分析
- 源码
- 项目目录结构


## 打包的文件
- index.js  
- a.js 
- b.js 
- c.js

`文件index.js`

```js
import a from './a.js';
var temp = a
console.log("index.js + " ,temp);

```
`文件a.js`

```js
import {b} from './b.js';
export default `a.js + ${b}`;
```

`文件b.js`
```js
import {c} from './js/c.js';
export let b = `b.js +  ${c}`;
```

`文件c.js`
```js
export const c = " c.js  ";

```

## 文件的依赖关系
> index中引入了a， a 中引入了b，b中引入了c。 index.js中打印数据（ndex + a + b + c的数据）




## 整体思路梳理
> 输入一个js文件，分析其内部依赖，共找到n个依赖的js文件，将这n个文件按照指定规则，转成了n个函数，打包输出为了一个js文件。**（n-> 1 ） n个Js文件合并成一个这就是webpack重要的功能之一**

## 代码分析

### 三个函数

#### createAsset函数 str -> {}

- 通过传入文件路径"./es6ToEs5/index.js"，进而通过readFileSync读取文件内容，
- 将文件内容，通过babylon解析成语法树，
- 通过traverse遍历语法树，通过ImportDelaration钩子函数将import a from './a.js'语句中的 ./a.js 拿出来，并存到一个依赖收集的数组当中。
- 通过babel.transformFromAstSync遍历当前js文件语法树，将es6转为es5，并返回字符串
- 在此方法中，让外部变量ID（文件的ID初始值为0）自增，每次调用此函数，此文件ID就会自增一。最终，（可以通过此ID来查看我们处理的文件个数）
- 此函数输出为一个对象包括 id,filename,dependencies,code
如下：
```js
  {
    id: 0,
    filename: './es6ToEs5/index.js',
    dependencies: [ './a.js' ],
    code: '"use strict";\n' +
     '\n' +
      'var _a = _interopRequireDefault(require("./a.js"));\n' +
      '\n' +
      'function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }\n' +
      '\n' +
      'var temp = _a["default"];\n' +
      'console.log("我是index.js 文件内部打印的数据 + 文件a.js的内容：/br", temp);'
  }
```
#### createGraph函数 str -> {}
- 首先，输入是一个文件路径字符串
- 调用createAsset方法，将文件内容读取出来，转换成一个对象
- 新建一个数组(用于广度遍历)，用于存放，文件对象 
- 遍历这个存放文件对象的数组，新增一个属性来保存子依赖项的数据
- 在其中再遍历数组当中文件对象的依赖项dependencies数组
- 在其中调用createAsset来获取依赖文件的文件对象
- 给依赖的子文件对象增加属性mapping ,如mapping: { './a.js': 1 }
- 将子依赖依次加入数组中，广度遍历, 依次把a.js的文件对象，b.js，c.js 进行遍历，直到没有依赖项。（采用广度遍历，一边循环，一边往循环目标中push）
- 目前所有的依赖项（文件对象）已经全部push到了一个数组中
- 输出 数组 [文件对象，文件对象，文件对象...]

#### bundle函数 []=>str
- 循环文件对象数组，并把每个模块中的代码存在function作用域里
- 循环拼接函数按照 0:[function(){},mapping]或者自己指定的形式去拼接

> 拼接的每一个文件模块的函数字符串 

```
0:[
      function (require, module, exports){
        "use strict";
        var _a = _interopRequireDefault(require("./a.js"));
        function _interopRequireDefault(obj) { 
            return obj && obj.__esModule ? obj : { "default": obj }; }
            var temp = _a["default"];
            console.log("index.js + ", temp);
        },
       {"./a.js":1},
    ]
```

- 继续拼接，拼接模拟的模块执行器

## 模块执行器与其中的require方法 str -> 可执行脚本

```js
(function(modules){
    //创建require函数， 它接收一个模块ID（这个模块id是数字0，1，2...，每一个id对应一个函数（一个文件模块）） 
    function require(id){
      const [fn, mapping] = modules[id];
      function localRequire(relativePath){
        //根据模块的路径在mapping中找到对应的模块id，递归调用require方法，把所有的模块都执行
        return require(mapping[relativePath]);
      }
      const module = {exports:{}};
      //执行每个模块的代码。
      fn(localRequire,module,module.exports);
      return module.exports;
    }
    //执行入口文件，
    
    require(0);
  })({${modules}})
```
- 模块执行器入参，是整个按照指定规则拼接好的js字符串（包含入口文件依赖的所有文件），返回可执行的整个打包好的脚本。
- mapping就是为了串联起来执行所有依赖模块，给模块执行器用的，{"./a.js":1}
- require函数入参是一个数字，一个数字对应一个模块函数。
- localRequire 函数返回的是 每个模块函数（文件） 
- fn(localRequire,module,module.exports)对应每个模块函数的function (require, module, exports){...}这个函数。
- fn中执行_interopRequireDefault函数，返回一个对象。这个对象就是每一个文件模块的代码

## 总结
- 文件内容读取转换为对象，对象包括id,filename,依赖项数组,code
- 广度遍历依赖项文件对象数组，得到所有依赖文件对象组成的数组
- 按照模块执行器的规则0:[function(){code}]的方式，遍历得到的文件对象数组得到所有依赖文件拼接成的字符串
- 通过模块执行器（接收上方打包好的文件字符串），通过文件ID调用入口文件（require(0)）开始，依次自动调用所有依赖模块。
- 我们是通过AST的Import钩子拿到的文件依赖。
- 对于每个文件我们还做了，转为ast，拿到依赖，加入需要的属性，es6转es5，code,然后，返回一个方便我们使用的文件对象
- webpack是很强大，babel一样强大，AST是很重要的工具。
 
## 项目目录结构 ##
![cmd-markdown-logo](https://user-gold-cdn.xitu.io/2019/11/14/16e65e3b1f5899bc?w=255&h=297&f=png&s=10259)

## 源码
欢迎指教，帮忙点个 star
[github](https://github.com/AndyRoyal/miniWebpack)



—————————————下回分解————————————————

 ### commonjs和import的区别：


