module.exports = {
  requires: {
    bundle: "ai"
  },
  run: [
    {
      when: "{{!exists('app')}}",
      method: "shell.run",
      params: {
        // engine.py hash-checks event_bank/runtime.py; CRLF conversion on Windows breaks it.
        message: "git clone -c core.autocrlf=false https://huggingface.co/spaces/owensong/Inflect-v3 app"
      }
    },
    {
      // The Space needs Python >= 3.11 (hashlib.file_digest); upstream targets 3.12.
      when: "{{!exists('app/env')}}",
      method: "shell.run",
      params: {
        path: "app",
        message: "uv venv env --python 3.12"
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        message: [
          "python -c \"from pathlib import Path; Path('env/.installed').unlink(missing_ok=True)\"",
          "uv pip install -r requirements.txt"
        ]
      }
    },
    {
      // PyPI ships CPU-only torch on Windows; swap in the CUDA build of the pinned version.
      when: "{{platform === 'win32' && gpu === 'nvidia'}}",
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        message: "uv pip install torch==2.10.0 --index-url https://download.pytorch.org/whl/cu128 --force-reinstall --no-deps"
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        message: "python -c \"import torch, gradio, spaces, misaki, engine; from pathlib import Path; Path('env/.installed').touch(); print('Inflect v3 dependencies verified. CUDA:', torch.cuda.is_available())\""
      }
    },
    {
      when: "{{exists('app/env/.installed')}}",
      method: "input",
      params: {
        title: "Install Complete",
        description: "Inflect v3 installed. Click Start to launch it (Mini, Micro and Atom weights download on first start)."
      }
    }
  ]
}
