export default {
  multipass: true,
  js2svg: {
    pretty: false,
    indent: 0,
  },
  plugins: [
    {
      name: "preset-default",
    },
    {
      name: "convertPathData",
      params: {
        floatPrecision: 2,
      },
    },
    {
      name: "cleanupNumericValues",
      params: {
        floatPrecision: 2,
      },
    },
    {
      name: "removeDimensions",
    },
  ],
};
