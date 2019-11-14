
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
    })({0:[
      function (require, module, exports){
        "use strict";

var _a = _interopRequireDefault(require("./a.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var temp = _a["default"];
console.log("index.js + ", temp);
      },
      {"./a.js":1},
    ],1:[
      function (require, module, exports){
        "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _b = require("./b.js");

var _default = "a.js + ".concat(_b.b);

exports["default"] = _default;
      },
      {"./b.js":2},
    ],2:[
      function (require, module, exports){
        "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.b = void 0;

var _c = require("./js/c.js");

var b = "b.js +  ".concat(_c.c);
exports.b = b;
      },
      {"./js/c.js":3},
    ],3:[
      function (require, module, exports){
        "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.c = void 0;
var c = " c.js  ";
exports.c = c;
      },
      {},
    ],})
  