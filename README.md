## webpack是如何工作的？

## 主要内容包括：

- 借助babel编译器，将es6的代码转为es5，（本文不涉及操作ast，主要是整体思路的梳理）

- webpack 是如何分析文件之间的依赖关系 

- 对比 es6 转为 es5 的代码，分析babel内部ast的处理

- 运行打包以后的代码，看代码是否正确的处理了依赖关系，并执行

### 打包的文件 包括 index.js  a.js b.js c.js
`文件index.js`

```js
import a from './a.js';
var b = a
console.log("我是index.js 文件内部打印的数据 + " ,b);

```
`文件a.js`

```js
import {b} from './b.js';
var test = "abc";
function fn1(){
    return 1
};
var arrowFn = () =>{
    return  "文件a中的arrowFn被调用！"
}
arrowFn();
export default `我是文件 a 中导出的数据 和 文件 a 中引入的 b 文件的数据:  ${b}`;
```

`文件b.js`
```js
import {c,obj} from './js/c.js';
// 修改obj
obj.a="a已被修改";
obj.b="b已被修改";
console.log("文件b中引入了文件c的obj，并修改后打印：",obj);
export let b = `我是文件 b 中导出的数据 和 文件 b 中引入的 c 文件的数据:  ${c}`;
```

`文件c.js`
```js
// 测试 es6的模块引入机制
var myobj = {
    a: 1,
    b: [1,2,3]

};
console.log("文件c的myobj，被文件b修改后打印：",myobj);
const myc = "   我是文件 c  中导出的数据   ";
export {
    myobj as obj,
    myc as c
}

```

### 依赖关系
> index.js中打印数据，index + a + b + c的数据，index中引入了a， a 中引入了b，b中引入了c。 


————————————————————————————————————————————————————————————
` package.json `
```json 
{
  "name": "webpack-mini",
  "version": "1.0.0",
  "description": "webpack mini",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "mergejs" :"node bundler.js"
  },
  "author": "andy",
  "license": "ISC",
  "devDependencies": {
    "@babel/core": "^7.7.2",
    "@babel/parser": "^7.7.3",
    "@babel/preset-env": "^7.7.1",
    "@babel/traverse": "^7.7.2"
  },
  "dependencies": {
    "js-beautify": "^1.10.2"
  }
}
```

 ## commonjs和import的区别对比

 ### commonjs 是 模块拷贝。而 import 是导入的模块的引用。


 # 总结

 + 把模块转为了函数（把每个模块中的代码存在function作用域里）
 + 
