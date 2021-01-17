// padStart 的 polyfill，因为某些机型或情况，还无法支持es7的padStart，比如电脑版的微信小程序
// 所以这里做一个兼容polyfill的兼容处理
if (!String.prototype.padStart) {
  // 为了方便表示这里 fillString 用了ES6 的默认参数，不影响理解
  String.prototype.padStart = (maxLength, fillString = ' ') => {
    if (Object.prototype.toString.call(fillString) !== '[object String]') {
      throw new TypeError('fillString must be String');
    }
    const str = this;
    // 返回 String(str) 这里是为了使返回的值是字符串字面量，在控制台中更符合直觉
    if (str.length >= maxLength) return String(str);

    const fillLength = maxLength - str.length;
    let times = Math.ceil(fillLength / fillString.length);
    while ((times >>= 1)) {
      fillString += fillString;
      if (times === 1) {
        fillString += fillString;
      }
    }
    return fillString.slice(0, fillLength) + str;
  };
}

function timeFormat(timestamp = null, fmt = 'yyyy-mm-dd') {
  // 其他更多是格式化有如下:
  // yyyy:mm:dd|yyyy:mm|yyyy年mm月dd日|yyyy年mm月dd日 hh时MM分等,可自定义组合
  // 如果输入的是Number类型，直接转换成整数；如果是String类型，使用new Date转换Unix Timestamp或ISO类型成Timestamp。
  timestamp = typeof timestamp === 'number'
    ? parseInt(timestamp, 10)
    : Number(new Date(timestamp));
  // 如果为null,则格式化当前时间
  if (!timestamp || timestamp <= 0) {
    timestamp = Number(new Date());
  }
  // 判断用户输入的时间戳是秒还是毫秒,一般前端js获取的时间戳是毫秒(13位),后端传过来的为秒(10位)
  if (timestamp.toString().length === 10) timestamp *= 1000;
  const date = new Date(timestamp);
  let ret;
  const opt = {
    'y+': date.getFullYear().toString(), // 年
    'm+': (date.getMonth() + 1).toString(), // 月
    'd+': date.getDate().toString(), // 日
    'h+': date.getHours().toString(), // 时
    'M+': date.getMinutes().toString(), // 分
    's+': date.getSeconds().toString(), // 秒
    // 有其他格式化字符需求可以继续添加，必须转化成字符串
  };
  for (const k in opt) {
    ret = new RegExp(`(${k})`).exec(fmt);
    if (ret) {
      fmt = fmt.replace(
        ret[1],
        ret[1].length === 1 ? opt[k] : opt[k].padStart(ret[1].length, '0'),
      );
    }
  }
  return fmt;
}

export default timeFormat;