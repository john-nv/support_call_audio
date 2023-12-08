const allowedOrigins = [
  'http://localhost:3333',
  'https://call.toolv3.com', 'http://call.toolv3.com'
];

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 200,
  credentials: true,
};

module.exports = {
  corsOptions
};
