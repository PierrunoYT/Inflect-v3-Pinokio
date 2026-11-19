module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        env: {
          // app.py reads these; it otherwise binds 0.0.0.0:7860.
          INFLECT_HOST: "127.0.0.1",
          PORT: "{{port}}"
        },
        message: "python -u ../launch.py",
        on: [{
          event: "/(http:\\/\\/[0-9.:]+)/",
          done: true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        url: "{{input.event[1]}}"
      }
    }
  ]
}
