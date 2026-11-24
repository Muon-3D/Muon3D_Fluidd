import "/.vite-e2e/4291/deps/chunk-LK32TJAX.js?v=9b9fafc7";

// node_modules/@irojs/iro-core/dist/iro-core.es.js
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}
function _extends() {
  _extends = Object.assign || function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
var CSS_INTEGER = "[-\\+]?\\d+%?";
var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";
var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";
var PERMISSIVE_MATCH_3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
var PERMISSIVE_MATCH_4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
var REGEX_FUNCTIONAL_RGB = new RegExp("rgb" + PERMISSIVE_MATCH_3);
var REGEX_FUNCTIONAL_RGBA = new RegExp("rgba" + PERMISSIVE_MATCH_4);
var REGEX_FUNCTIONAL_HSL = new RegExp("hsl" + PERMISSIVE_MATCH_3);
var REGEX_FUNCTIONAL_HSLA = new RegExp("hsla" + PERMISSIVE_MATCH_4);
var HEX_START = "^(?:#?|0x?)";
var HEX_INT_SINGLE = "([0-9a-fA-F]{1})";
var HEX_INT_DOUBLE = "([0-9a-fA-F]{2})";
var REGEX_HEX_3 = new RegExp(HEX_START + HEX_INT_SINGLE + HEX_INT_SINGLE + HEX_INT_SINGLE + "$");
var REGEX_HEX_4 = new RegExp(HEX_START + HEX_INT_SINGLE + HEX_INT_SINGLE + HEX_INT_SINGLE + HEX_INT_SINGLE + "$");
var REGEX_HEX_6 = new RegExp(HEX_START + HEX_INT_DOUBLE + HEX_INT_DOUBLE + HEX_INT_DOUBLE + "$");
var REGEX_HEX_8 = new RegExp(HEX_START + HEX_INT_DOUBLE + HEX_INT_DOUBLE + HEX_INT_DOUBLE + HEX_INT_DOUBLE + "$");
var KELVIN_MIN = 2e3;
var KELVIN_MAX = 4e4;
var log = Math.log;
var round = Math.round;
var floor = Math.floor;
function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}
function parseUnit(str, max) {
  var isPercentage = str.indexOf("%") > -1;
  var num = parseFloat(str);
  return isPercentage ? max / 100 * num : num;
}
function parseHexInt(str) {
  return parseInt(str, 16);
}
function intToHex(_int) {
  return _int.toString(16).padStart(2, "0");
}
var IroColor = (function() {
  function IroColor2(value, onChange) {
    this.$ = {
      h: 0,
      s: 0,
      v: 0,
      a: 1
    };
    if (value) this.set(value);
    this.onChange = onChange;
    this.initialValue = _extends({}, this.$);
  }
  var _proto = IroColor2.prototype;
  _proto.set = function set(value) {
    if (typeof value === "string") {
      if (/^(?:#?|0x?)[0-9a-fA-F]{3,8}$/.test(value)) {
        this.hexString = value;
      } else if (/^rgba?/.test(value)) {
        this.rgbString = value;
      } else if (/^hsla?/.test(value)) {
        this.hslString = value;
      }
    } else if (typeof value === "object") {
      if (value instanceof IroColor2) {
        this.hsva = value.hsva;
      } else if ("r" in value && "g" in value && "b" in value) {
        this.rgb = value;
      } else if ("h" in value && "s" in value && "v" in value) {
        this.hsv = value;
      } else if ("h" in value && "s" in value && "l" in value) {
        this.hsl = value;
      } else if ("kelvin" in value) {
        this.kelvin = value.kelvin;
      }
    } else {
      throw new Error("Invalid color value");
    }
  };
  _proto.setChannel = function setChannel(format, channel, value) {
    var _extends2;
    this[format] = _extends({}, this[format], (_extends2 = {}, _extends2[channel] = value, _extends2));
  };
  _proto.reset = function reset() {
    this.hsva = this.initialValue;
  };
  _proto.clone = function clone() {
    return new IroColor2(this);
  };
  _proto.unbind = function unbind() {
    this.onChange = void 0;
  };
  IroColor2.hsvToRgb = function hsvToRgb(hsv) {
    var h = hsv.h / 60;
    var s = hsv.s / 100;
    var v = hsv.v / 100;
    var i = floor(h);
    var f = h - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
    var mod3 = i % 6;
    var r = [v, q, p, p, t, v][mod3];
    var g = [t, v, v, q, p, p][mod3];
    var b = [p, p, t, v, v, q][mod3];
    return {
      r: clamp(r * 255, 0, 255),
      g: clamp(g * 255, 0, 255),
      b: clamp(b * 255, 0, 255)
    };
  };
  IroColor2.rgbToHsv = function rgbToHsv(rgb) {
    var r = rgb.r / 255;
    var g = rgb.g / 255;
    var b = rgb.b / 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var delta = max - min;
    var hue = 0;
    var value = max;
    var saturation = max === 0 ? 0 : delta / max;
    switch (max) {
      case min:
        hue = 0;
        break;
      case r:
        hue = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / delta + 2;
        break;
      case b:
        hue = (r - g) / delta + 4;
        break;
    }
    return {
      h: hue * 60 % 360,
      s: clamp(saturation * 100, 0, 100),
      v: clamp(value * 100, 0, 100)
    };
  };
  IroColor2.hsvToHsl = function hsvToHsl(hsv) {
    var s = hsv.s / 100;
    var v = hsv.v / 100;
    var l = (2 - s) * v;
    var divisor = l <= 1 ? l : 2 - l;
    var saturation = divisor < 1e-9 ? 0 : s * v / divisor;
    return {
      h: hsv.h,
      s: clamp(saturation * 100, 0, 100),
      l: clamp(l * 50, 0, 100)
    };
  };
  IroColor2.hslToHsv = function hslToHsv(hsl) {
    var l = hsl.l * 2;
    var s = hsl.s * (l <= 100 ? l : 200 - l) / 100;
    var saturation = l + s < 1e-9 ? 0 : 2 * s / (l + s);
    return {
      h: hsl.h,
      s: clamp(saturation * 100, 0, 100),
      v: clamp((l + s) / 2, 0, 100)
    };
  };
  IroColor2.kelvinToRgb = function kelvinToRgb(kelvin) {
    var temp = kelvin / 100;
    var r, g, b;
    if (temp < 66) {
      r = 255;
      g = -155.25485562709179 - 0.44596950469579133 * (g = temp - 2) + 104.49216199393888 * log(g);
      b = temp < 20 ? 0 : -254.76935184120902 + 0.8274096064007395 * (b = temp - 10) + 115.67994401066147 * log(b);
    } else {
      r = 351.97690566805693 + 0.114206453784165 * (r = temp - 55) - 40.25366309332127 * log(r);
      g = 325.4494125711974 + 0.07943456536662342 * (g = temp - 50) - 28.0852963507957 * log(g);
      b = 255;
    }
    return {
      r: clamp(floor(r), 0, 255),
      g: clamp(floor(g), 0, 255),
      b: clamp(floor(b), 0, 255)
    };
  };
  IroColor2.rgbToKelvin = function rgbToKelvin(rgb) {
    var r = rgb.r, b = rgb.b;
    var eps = 0.4;
    var minTemp = KELVIN_MIN;
    var maxTemp = KELVIN_MAX;
    var temp;
    while (maxTemp - minTemp > eps) {
      temp = (maxTemp + minTemp) * 0.5;
      var _rgb = IroColor2.kelvinToRgb(temp);
      if (_rgb.b / _rgb.r >= b / r) {
        maxTemp = temp;
      } else {
        minTemp = temp;
      }
    }
    return temp;
  };
  _createClass(IroColor2, [{
    key: "hsv",
    get: function get() {
      var value = this.$;
      return {
        h: value.h,
        s: value.s,
        v: value.v
      };
    },
    set: function set(newValue) {
      var oldValue = this.$;
      newValue = _extends({}, oldValue, newValue);
      if (this.onChange) {
        var changes = {
          h: false,
          v: false,
          s: false,
          a: false
        };
        for (var key in oldValue) {
          changes[key] = newValue[key] != oldValue[key];
        }
        this.$ = newValue;
        if (changes.h || changes.s || changes.v || changes.a) this.onChange(this, changes);
      } else {
        this.$ = newValue;
      }
    }
  }, {
    key: "hsva",
    get: function get() {
      return _extends({}, this.$);
    },
    set: function set(value) {
      this.hsv = value;
    }
  }, {
    key: "hue",
    get: function get() {
      return this.$.h;
    },
    set: function set(value) {
      this.hsv = {
        h: value
      };
    }
  }, {
    key: "saturation",
    get: function get() {
      return this.$.s;
    },
    set: function set(value) {
      this.hsv = {
        s: value
      };
    }
  }, {
    key: "value",
    get: function get() {
      return this.$.v;
    },
    set: function set(value) {
      this.hsv = {
        v: value
      };
    }
  }, {
    key: "alpha",
    get: function get() {
      return this.$.a;
    },
    set: function set(value) {
      this.hsv = _extends({}, this.hsv, {
        a: value
      });
    }
  }, {
    key: "kelvin",
    get: function get() {
      return IroColor2.rgbToKelvin(this.rgb);
    },
    set: function set(value) {
      this.rgb = IroColor2.kelvinToRgb(value);
    }
  }, {
    key: "red",
    get: function get() {
      var rgb = this.rgb;
      return rgb.r;
    },
    set: function set(value) {
      this.rgb = _extends({}, this.rgb, {
        r: value
      });
    }
  }, {
    key: "green",
    get: function get() {
      var rgb = this.rgb;
      return rgb.g;
    },
    set: function set(value) {
      this.rgb = _extends({}, this.rgb, {
        g: value
      });
    }
  }, {
    key: "blue",
    get: function get() {
      var rgb = this.rgb;
      return rgb.b;
    },
    set: function set(value) {
      this.rgb = _extends({}, this.rgb, {
        b: value
      });
    }
  }, {
    key: "rgb",
    get: function get() {
      var _IroColor$hsvToRgb = IroColor2.hsvToRgb(this.$), r = _IroColor$hsvToRgb.r, g = _IroColor$hsvToRgb.g, b = _IroColor$hsvToRgb.b;
      return {
        r: round(r),
        g: round(g),
        b: round(b)
      };
    },
    set: function set(value) {
      this.hsv = _extends({}, IroColor2.rgbToHsv(value), {
        a: value.a === void 0 ? 1 : value.a
      });
    }
  }, {
    key: "rgba",
    get: function get() {
      return _extends({}, this.rgb, {
        a: this.alpha
      });
    },
    set: function set(value) {
      this.rgb = value;
    }
  }, {
    key: "hsl",
    get: function get() {
      var _IroColor$hsvToHsl = IroColor2.hsvToHsl(this.$), h = _IroColor$hsvToHsl.h, s = _IroColor$hsvToHsl.s, l = _IroColor$hsvToHsl.l;
      return {
        h: round(h),
        s: round(s),
        l: round(l)
      };
    },
    set: function set(value) {
      this.hsv = _extends({}, IroColor2.hslToHsv(value), {
        a: value.a === void 0 ? 1 : value.a
      });
    }
  }, {
    key: "hsla",
    get: function get() {
      return _extends({}, this.hsl, {
        a: this.alpha
      });
    },
    set: function set(value) {
      this.hsl = value;
    }
  }, {
    key: "rgbString",
    get: function get() {
      var rgb = this.rgb;
      return "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")";
    },
    set: function set(value) {
      var match;
      var r, g, b, a = 1;
      if (match = REGEX_FUNCTIONAL_RGB.exec(value)) {
        r = parseUnit(match[1], 255);
        g = parseUnit(match[2], 255);
        b = parseUnit(match[3], 255);
      } else if (match = REGEX_FUNCTIONAL_RGBA.exec(value)) {
        r = parseUnit(match[1], 255);
        g = parseUnit(match[2], 255);
        b = parseUnit(match[3], 255);
        a = parseUnit(match[4], 1);
      }
      if (match) {
        this.rgb = {
          r,
          g,
          b,
          a
        };
      } else {
        throw new Error("Invalid rgb string");
      }
    }
  }, {
    key: "rgbaString",
    get: function get() {
      var rgba = this.rgba;
      return "rgba(" + rgba.r + ", " + rgba.g + ", " + rgba.b + ", " + rgba.a + ")";
    },
    set: function set(value) {
      this.rgbString = value;
    }
  }, {
    key: "hexString",
    get: function get() {
      var rgb = this.rgb;
      return "#" + intToHex(rgb.r) + intToHex(rgb.g) + intToHex(rgb.b);
    },
    set: function set(value) {
      var match;
      var r, g, b, a = 255;
      if (match = REGEX_HEX_3.exec(value)) {
        r = parseHexInt(match[1]) * 17;
        g = parseHexInt(match[2]) * 17;
        b = parseHexInt(match[3]) * 17;
      } else if (match = REGEX_HEX_4.exec(value)) {
        r = parseHexInt(match[1]) * 17;
        g = parseHexInt(match[2]) * 17;
        b = parseHexInt(match[3]) * 17;
        a = parseHexInt(match[4]) * 17;
      } else if (match = REGEX_HEX_6.exec(value)) {
        r = parseHexInt(match[1]);
        g = parseHexInt(match[2]);
        b = parseHexInt(match[3]);
      } else if (match = REGEX_HEX_8.exec(value)) {
        r = parseHexInt(match[1]);
        g = parseHexInt(match[2]);
        b = parseHexInt(match[3]);
        a = parseHexInt(match[4]);
      }
      if (match) {
        this.rgb = {
          r,
          g,
          b,
          a: a / 255
        };
      } else {
        throw new Error("Invalid hex string");
      }
    }
  }, {
    key: "hex8String",
    get: function get() {
      var rgba = this.rgba;
      return "#" + intToHex(rgba.r) + intToHex(rgba.g) + intToHex(rgba.b) + intToHex(floor(rgba.a * 255));
    },
    set: function set(value) {
      this.hexString = value;
    }
  }, {
    key: "hslString",
    get: function get() {
      var hsl = this.hsl;
      return "hsl(" + hsl.h + ", " + hsl.s + "%, " + hsl.l + "%)";
    },
    set: function set(value) {
      var match;
      var h, s, l, a = 1;
      if (match = REGEX_FUNCTIONAL_HSL.exec(value)) {
        h = parseUnit(match[1], 360);
        s = parseUnit(match[2], 100);
        l = parseUnit(match[3], 100);
      } else if (match = REGEX_FUNCTIONAL_HSLA.exec(value)) {
        h = parseUnit(match[1], 360);
        s = parseUnit(match[2], 100);
        l = parseUnit(match[3], 100);
        a = parseUnit(match[4], 1);
      }
      if (match) {
        this.hsl = {
          h,
          s,
          l,
          a
        };
      } else {
        throw new Error("Invalid hsl string");
      }
    }
  }, {
    key: "hslaString",
    get: function get() {
      var hsla = this.hsla;
      return "hsla(" + hsla.h + ", " + hsla.s + "%, " + hsla.l + "%, " + hsla.a + ")";
    },
    set: function set(value) {
      this.hslString = value;
    }
  }]);
  return IroColor2;
})();
var sliderDefaultOptions = {
  sliderShape: "bar",
  sliderType: "value",
  minTemperature: 2200,
  maxTemperature: 11e3
};
function getSliderStyles(props) {
  var _ref;
  return _ref = {}, _ref[props.layoutDirection === "horizontal" ? "marginLeft" : "marginTop"] = props.sliderMargin, _ref;
}
function getSliderDimensions(props) {
  var _sliderSize;
  var width = props.width, sliderSize = props.sliderSize, borderWidth = props.borderWidth, handleRadius = props.handleRadius, padding = props.padding, sliderShape = props.sliderShape;
  var ishorizontal = props.layoutDirection === "horizontal";
  sliderSize = (_sliderSize = sliderSize) != null ? _sliderSize : padding * 2 + handleRadius * 2;
  if (sliderShape === "circle") {
    return {
      handleStart: props.padding + props.handleRadius,
      handleRange: width - padding * 2 - handleRadius * 2,
      width,
      height: width,
      cx: width / 2,
      cy: width / 2,
      radius: width / 2 - borderWidth / 2
    };
  } else {
    return {
      handleStart: sliderSize / 2,
      handleRange: width - sliderSize,
      radius: sliderSize / 2,
      x: 0,
      y: 0,
      width: ishorizontal ? sliderSize : width,
      height: ishorizontal ? width : sliderSize
    };
  }
}
function getCurrentSliderValue(props, color) {
  var hsva = color.hsva;
  var rgb = color.rgb;
  switch (props.sliderType) {
    case "red":
      return rgb.r / 2.55;
    case "green":
      return rgb.g / 2.55;
    case "blue":
      return rgb.b / 2.55;
    case "alpha":
      return hsva.a * 100;
    case "kelvin":
      var minTemperature = props.minTemperature, maxTemperature = props.maxTemperature;
      var temperatureRange = maxTemperature - minTemperature;
      var percent = (color.kelvin - minTemperature) / temperatureRange * 100;
      return Math.max(0, Math.min(percent, 100));
    case "hue":
      return hsva.h /= 3.6;
    case "saturation":
      return hsva.s;
    case "value":
    default:
      return hsva.v;
  }
}
function getSliderValueFromInput(props, x, y) {
  var _getSliderDimensions = getSliderDimensions(props), handleRange = _getSliderDimensions.handleRange, handleStart = _getSliderDimensions.handleStart;
  var handlePos;
  if (props.layoutDirection === "horizontal") {
    handlePos = -1 * y + handleRange + handleStart;
  } else {
    handlePos = x - handleStart;
  }
  handlePos = Math.max(Math.min(handlePos, handleRange), 0);
  var percent = Math.round(100 / handleRange * handlePos);
  switch (props.sliderType) {
    case "kelvin":
      var minTemperature = props.minTemperature, maxTemperature = props.maxTemperature;
      var temperatureRange = maxTemperature - minTemperature;
      return minTemperature + temperatureRange * (percent / 100);
    case "alpha":
      return percent / 100;
    case "hue":
      return percent * 3.6;
    case "red":
    case "blue":
    case "green":
      return percent * 2.55;
    default:
      return percent;
  }
}
function getSliderHandlePosition(props, color) {
  var _getSliderDimensions2 = getSliderDimensions(props), width = _getSliderDimensions2.width, height = _getSliderDimensions2.height, handleRange = _getSliderDimensions2.handleRange, handleStart = _getSliderDimensions2.handleStart;
  var ishorizontal = props.layoutDirection === "horizontal";
  var sliderValue = getCurrentSliderValue(props, color);
  var midPoint = ishorizontal ? width / 2 : height / 2;
  var handlePos = handleStart + sliderValue / 100 * handleRange;
  if (ishorizontal) {
    handlePos = -1 * handlePos + handleRange + handleStart * 2;
  }
  return {
    x: ishorizontal ? midPoint : handlePos,
    y: ishorizontal ? handlePos : midPoint
  };
}
function getSliderGradient(props, color) {
  var hsv = color.hsv;
  var rgb = color.rgb;
  switch (props.sliderType) {
    case "red":
      return [[0, "rgb(0," + rgb.g + "," + rgb.b + ")"], [100, "rgb(255," + rgb.g + "," + rgb.b + ")"]];
    case "green":
      return [[0, "rgb(" + rgb.r + ",0," + rgb.b + ")"], [100, "rgb(" + rgb.r + ",255," + rgb.b + ")"]];
    case "blue":
      return [[0, "rgb(" + rgb.r + "," + rgb.g + ",0)"], [100, "rgb(" + rgb.r + "," + rgb.g + ",255)"]];
    case "alpha":
      return [[0, "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",0)"], [100, "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")"]];
    case "kelvin":
      var stops = [];
      var min = props.minTemperature;
      var max = props.maxTemperature;
      var numStops = 8;
      var range = max - min;
      for (var kelvin = min, stop = 0; kelvin < max; kelvin += range / numStops, stop += 1) {
        var _IroColor$kelvinToRgb = IroColor.kelvinToRgb(kelvin), r = _IroColor$kelvinToRgb.r, g = _IroColor$kelvinToRgb.g, b = _IroColor$kelvinToRgb.b;
        stops.push([100 / numStops * stop, "rgb(" + r + "," + g + "," + b + ")"]);
      }
      return stops;
    case "hue":
      return [[0, "#f00"], [16.666, "#ff0"], [33.333, "#0f0"], [50, "#0ff"], [66.666, "#00f"], [83.333, "#f0f"], [100, "#f00"]];
    case "saturation":
      var noSat = IroColor.hsvToHsl({
        h: hsv.h,
        s: 0,
        v: hsv.v
      });
      var fullSat = IroColor.hsvToHsl({
        h: hsv.h,
        s: 100,
        v: hsv.v
      });
      return [[0, "hsl(" + noSat.h + "," + noSat.s + "%," + noSat.l + "%)"], [100, "hsl(" + fullSat.h + "," + fullSat.s + "%," + fullSat.l + "%)"]];
    case "value":
    default:
      var hsl = IroColor.hsvToHsl({
        h: hsv.h,
        s: hsv.s,
        v: 100
      });
      return [[0, "#000"], [100, "hsl(" + hsl.h + "," + hsl.s + "%," + hsl.l + "%)"]];
  }
}
function getSliderGradientCoords(props) {
  var ishorizontal = props.layoutDirection === "horizontal";
  return {
    x1: "0%",
    y1: ishorizontal ? "100%" : "0%",
    x2: ishorizontal ? "0%" : "100%",
    y2: "0%"
  };
}
var TAU = Math.PI * 2;
var mod = function mod2(a, n) {
  return (a % n + n) % n;
};
var dist = function dist2(x, y) {
  return Math.sqrt(x * x + y * y);
};
function getHandleRange(props) {
  return props.width / 2 - props.padding - props.handleRadius - props.borderWidth;
}
function isInputInsideWheel(props, x, y) {
  var _getWheelDimensions = getWheelDimensions(props), cx = _getWheelDimensions.cx, cy = _getWheelDimensions.cy;
  var r = props.width / 2;
  return dist(cx - x, cy - y) < r;
}
function getWheelDimensions(props) {
  var r = props.width / 2;
  return {
    width: props.width,
    radius: r - props.borderWidth,
    cx: r,
    cy: r
  };
}
function translateWheelAngle(props, angle, invert) {
  var wheelAngle = props.wheelAngle;
  var wheelDirection = props.wheelDirection;
  if (invert && wheelDirection === "clockwise") angle = wheelAngle + angle;
  else if (wheelDirection === "clockwise") angle = 360 - wheelAngle + angle;
  else if (invert && wheelDirection === "anticlockwise") angle = wheelAngle + 180 - angle;
  else if (wheelDirection === "anticlockwise") angle = wheelAngle - angle;
  return mod(angle, 360);
}
function getWheelHandlePosition(props, color) {
  var hsv = color.hsv;
  var _getWheelDimensions2 = getWheelDimensions(props), cx = _getWheelDimensions2.cx, cy = _getWheelDimensions2.cy;
  var handleRange = getHandleRange(props);
  var handleAngle = (180 + translateWheelAngle(props, hsv.h, true)) * (TAU / 360);
  var handleDist = hsv.s / 100 * handleRange;
  var direction = props.wheelDirection === "clockwise" ? -1 : 1;
  return {
    x: cx + handleDist * Math.cos(handleAngle) * direction,
    y: cy + handleDist * Math.sin(handleAngle) * direction
  };
}
function getWheelValueFromInput(props, x, y) {
  var _getWheelDimensions3 = getWheelDimensions(props), cx = _getWheelDimensions3.cx, cy = _getWheelDimensions3.cy;
  var handleRange = getHandleRange(props);
  x = cx - x;
  y = cy - y;
  var hue = translateWheelAngle(props, Math.atan2(-y, -x) * (360 / TAU));
  var handleDist = Math.min(dist(x, y), handleRange);
  return {
    h: Math.round(hue),
    s: Math.round(100 / handleRange * handleDist)
  };
}
function getBoxStyles(props) {
  var _ref;
  return _ref = {}, _ref[props.layoutDirection === "horizontal" ? "marginLeft" : "marginTop"] = props.sliderMargin, _ref;
}
function getBoxDimensions(props) {
  var width = props.width, boxHeight = props.boxHeight, padding = props.padding, handleRadius = props.handleRadius;
  return {
    width,
    height: boxHeight != null ? boxHeight : width,
    radius: padding + handleRadius
  };
}
function getBoxValueFromInput(props, x, y) {
  var _getBoxDimensions = getBoxDimensions(props), width = _getBoxDimensions.width, height = _getBoxDimensions.height, radius = _getBoxDimensions.radius;
  var handleStart = radius;
  var handleRangeX = width - radius * 2;
  var handleRangeY = height - radius * 2;
  var percentX = (x - handleStart) / handleRangeX * 100;
  var percentY = (y - handleStart) / handleRangeY * 100;
  return {
    s: Math.max(0, Math.min(percentX, 100)),
    v: Math.max(0, Math.min(100 - percentY, 100))
  };
}
function getBoxHandlePosition(props, color) {
  var _getBoxDimensions2 = getBoxDimensions(props), width = _getBoxDimensions2.width, height = _getBoxDimensions2.height, radius = _getBoxDimensions2.radius;
  var hsv = color.hsv;
  var handleStart = radius;
  var handleRangeX = width - radius * 2;
  var handleRangeY = height - radius * 2;
  return {
    x: handleStart + hsv.s / 100 * handleRangeX,
    y: handleStart + (handleRangeY - hsv.v / 100 * handleRangeY)
  };
}
function getBoxGradients(props, color) {
  var hue = color.hue;
  return [
    // saturation gradient
    [[0, "#fff"], [100, "hsl(" + hue + ",100%,50%)"]],
    // lightness gradient
    [[0, "rgba(0,0,0,0)"], [100, "#000"]]
  ];
}
var BASE_ELEMENTS;
function resolveSvgUrl(url) {
  if (!BASE_ELEMENTS) BASE_ELEMENTS = document.getElementsByTagName("base");
  var ua = window.navigator.userAgent;
  var isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  var isIos = /iPhone|iPod|iPad/i.test(ua);
  var location = window.location;
  return (isSafari || isIos) && BASE_ELEMENTS.length > 0 ? location.protocol + "//" + location.host + location.pathname + location.search + url : url;
}
function getSvgArcPath(cx, cy, radius, startAngle, endAngle) {
  var largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  startAngle *= Math.PI / 180;
  endAngle *= Math.PI / 180;
  var x1 = cx + radius * Math.cos(endAngle);
  var y1 = cy + radius * Math.sin(endAngle);
  var x2 = cx + radius * Math.cos(startAngle);
  var y2 = cy + radius * Math.sin(startAngle);
  return "M " + x1 + " " + y1 + " A " + radius + " " + radius + " 0 " + largeArcFlag + " 0 " + x2 + " " + y2;
}
function getHandleAtPoint(props, x, y, handlePositions) {
  for (var i = 0; i < handlePositions.length; i++) {
    var dX = handlePositions[i].x - x;
    var dY = handlePositions[i].y - y;
    var dist3 = Math.sqrt(dX * dX + dY * dY);
    if (dist3 < props.handleRadius) {
      return i;
    }
  }
  return null;
}
function cssBorderStyles(props) {
  return {
    boxSizing: "border-box",
    border: props.borderWidth + "px solid " + props.borderColor
  };
}
function cssGradient(type, direction, stops) {
  return type + "-gradient(" + direction + ", " + stops.map(function(_ref) {
    var o = _ref[0], col = _ref[1];
    return col + " " + o + "%";
  }).join(",") + ")";
}
function cssValue(value) {
  if (typeof value === "string") return value;
  return value + "px";
}
var iroColorPickerOptionDefaults = {
  width: 300,
  height: 300,
  color: "#fff",
  colors: [],
  padding: 6,
  layoutDirection: "vertical",
  borderColor: "#fff",
  borderWidth: 0,
  handleRadius: 8,
  activeHandleRadius: null,
  handleSvg: null,
  handleProps: {
    x: 0,
    y: 0
  },
  wheelLightness: true,
  wheelAngle: 0,
  wheelDirection: "anticlockwise",
  sliderSize: null,
  sliderMargin: 12,
  boxHeight: null
};
export {
  IroColor,
  cssBorderStyles,
  cssGradient,
  cssValue,
  getBoxDimensions,
  getBoxGradients,
  getBoxHandlePosition,
  getBoxStyles,
  getBoxValueFromInput,
  getCurrentSliderValue,
  getHandleAtPoint,
  getSliderDimensions,
  getSliderGradient,
  getSliderGradientCoords,
  getSliderHandlePosition,
  getSliderStyles,
  getSliderValueFromInput,
  getSvgArcPath,
  getWheelDimensions,
  getWheelHandlePosition,
  getWheelValueFromInput,
  iroColorPickerOptionDefaults,
  isInputInsideWheel,
  resolveSvgUrl,
  sliderDefaultOptions,
  translateWheelAngle
};
//# sourceMappingURL=@irojs_iro-core.js.map
