const fs = require("fs");
const path = require("path");
const babylon = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const babel = require("@babel/core");

//每次调用生成文件对象的createAsset方法，自增1，可以通过此ID来查看我们处理的文件个数
let ID = 0;
/***
 * 读取文件内容，并获得当前js文件的依赖关系
 * 输入 str（文件路径）
 * 输出 文件对象 {}
 */
function createAsset(filename) {
  //读取文件内容，返回：字符串
  const content = fs.readFileSync(filename, "utf-8");
  //将文件内容，通过babylon解析成语法树
  const ast = babylon.parse(content, {
    sourceType: "module"
  });

  // 存储当前文件所依赖的文件模块，就是通过import引入的文件，保存在此数组中
  const dependencies = [];

  //遍历当前文件内容的语法树
  traverse(ast, {
    //找到有 import语法 的对应节点
    ImportDeclaration: ({ node }) => {
      //把当前依赖的模块加入到数组中，就是文件路径字符串，
      //例如 如果当前js文件 有一句 import a from './a.js'， 
      //node.source.value 就是 Import 语句中的 ./a.js
      dependencies.push(node.source.value);
    }
  });

  
  //这边主要把ES6 的代码转成 ES5
  const { code } = babel.transformFromAstSync(ast, null, {
      presets: ["@babel/preset-env"]
    });
  //模块的id 从0开始，相当一个js文件 （打包后变成一个函数）
  const id = ID++;
  return {
    id,
    filename,
    dependencies,
    code
  };
};

/***
 * 从入口开始分析所有依赖项，形成依赖图,index.js依赖a.js,a.js依赖b.js，b.js依赖c.js ，采用广度遍历，一边循环，一边网循环目标中push。
 * 输入 str（文件路径）
 * 输出 数组 [文件对象，文件对象，文件对象...]
 */
function createGraph(entry) {
  // 读取文件，并保存返回的对象
  const mainAsset = createAsset(entry);
    
  //既然要广度遍历肯定要有一个队列，第一个元素肯定是 从 "./es6ToEs5/index.js" 返回的对象
  const queue = [mainAsset];
  // 遍历存放文件对象的数组
  for (const asset of queue) {
    //获取文件路径  './es6ToEs5/index.js' 返回 './es6ToEs5'
    const dirname = path.dirname(asset.filename);
    //新增一个属性来保存子依赖项的数据
    //保存类似 这样的数据结构 --->  {"./a.js" : 1}
    asset.mapping = {};
    // 遍历 数组当中每一个文件对象的依赖项dependencies数组
    asset.dependencies.forEach(relativePath => {
      // 拿到当前文件所依赖文件的路径
      const absolutePath = path.join(dirname, relativePath);
      //console.log('absolutePath:',absolutePath);
        
      //来获取所依赖文件的文件对象
      const child = createAsset(absolutePath);

      //给依赖的子文件对象增加属性mapping，
      asset.mapping[relativePath] = child.id;

      //将子依赖依次加入队列中，广度遍历, 依次把a.js的文件对象，b.js，c.js 进行遍历，直到没有依赖项。
      //目前所有的依赖项（文件对象）已经全部push到了一个数组中
      queue.push(child);
      //console.log("queue2:",queue);
    });
  }
  return queue;
};

/***
 * 输入 [文件对象，文件对象，文件对象...]
 * 输出 str (生成对应环境能执行的代码)
 */
function bundle(graph) {
  let modules = "";
  //循环文件对象数组，并把每个模块中的代码存在function作用域里
  //console.log("graph",graph)
  graph.forEach(mod => {
    modules += `${mod.id}:[
      function (require, module, exports){
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)},
    ],`;
  });

  //require, module, exports 是 commonjs的标准不能再浏览器中直接使用，所以这里模拟commonjs模块加载，执行，导出操作。

  /***
   *  str -> 可执行脚本
   *  功能：通过require递归调用和module来串联执行整个脚本
   */
  const result = `
    (function(modules){
      //创建require函数， 它接收一个模块ID（这个模块id是数字0，1，2...，每一个id对应一个函数（一个文件模块）） 
      function require(id){
        const [fn, mapping] = modules[id];
        function localRequire(relativePath){
          //根据模块的路径在mapping中找到对应的模块id，来执行对应的模块函数，直到全部依赖的文件递归执行完。
          return require(mapping[relativePath]);
        }
        const module = {exports:{}};
        //执行每个模块的代码。
        fn(localRequire,module,module.exports);
        return module.exports;
      }
      //init开始执行
      require(0);
    })({${modules}})
  `;
    //模块执行器 功能  require(0);  require(1);  require(2);  require(3);...
  return result;
}

const graph = createGraph("./es6ToEs5/index.js");//[文件对象，文件对象，文件对象...]
const ret = bundle(graph);

// 打包生成文件
fs.writeFileSync("./bundle.js", ret);

