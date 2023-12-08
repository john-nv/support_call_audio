const allowedOrigins = [
  'http://localhost:3333',
  'https://call.toolv3.com', 'http://call.toolv3.com'
];

const corsOptions = {
  origin: function (origin, callback) {

    if (!origin) {
      return callback('Origin header is missing', false);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(`Not allowed by CORS => ${origin} => domain`, false);
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 200,
  credentials: true,
};

module.exports = {
  corsOptions
};
