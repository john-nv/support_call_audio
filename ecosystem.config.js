module.exports = {
    apps : [
      {
        name: "support-call-web",
        script: "./index.js",
        // instances: "max",
        // exec_mode: "cluster",
        watch: true,
        max_memory_restart: "4G", 
        // env: {
        //   NODE_ENV: "production"
        // },
        // log_date_format: "YYYY-MM-DD HH:mm Z",
        // error_file: "logs/err.log",
        // out_file: "logs/out.log",
        // merge_logs: true,
      }
    ]
  };
  