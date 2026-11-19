# Inflect v3 — Pinokio launcher

1-click launcher for [Inflect v3](https://github.com/owenawsong/Inflect), a family of compact English
text-to-speech models by Owen Song. It runs the official
[Inflect v3 playground](https://huggingface.co/spaces/owensong/Inflect-v3) locally.

- **Models:** Mini (34.3M, best quality), Micro (11.8M), Atom (157K)
- **Voices:** `cassidy`, `mark`, `hope`, `james`, `sophia`, `jasper`
- **Mini extras:** optional 48 kHz enhancement, vocal-event tags
  (`[laugh]` `[sigh]` `[gasp]` `[cough]` `[yawn]` `[inhale]` `[exhale]` `[throat_clear]`)
- **Modes:** Create (one model), Compare (all three models, same text), Quality (Mini 24 kHz vs 48 kHz)

## How it works

| Script | What it does |
| --- | --- |
| `install.js` | Clones the Space into `app/` with LF line endings (the app hash-checks one of its files), creates a Python 3.12 venv (`app/env`), installs `requirements.txt`; on Windows + NVIDIA replaces torch with the CUDA 12.8 build |
| `start.js` | Runs `launch.py` on `127.0.0.1` at a free port, then shows **Open Web UI** |
| `launch.py` | Runs the Space's `app.py` unchanged, but on CUDA when available (the Space only selects CUDA when running on Hugging Face). Set `INFLECT_DEVICE=cpu` to force CPU |
| `update.js` | Pulls this launcher and the Space, then re-runs install |
| `reset.js` | Deletes `app/env` |
| `link.js` | Deduplicates venv packages via Pinokio's virtual drive |

The first start downloads the pinned Mini, Micro and Atom packages into `app/.model-cache`; later
starts are offline. Generated takes are written to the system temp folder (`inflect-v3-takes`) and
cleaned up after an hour — download the ones you want to keep from the UI.

## Usage

1. **Install**, then **Start**.
2. Click **Open Web UI**, type up to 800 characters, pick a model and voice, and generate.
3. Event tags need Mini with the event-tags switch on (max 4 tags per take).

## API

The app exposes a Gradio endpoint `/synthesize`. Replace `PORT` with the port shown in the
Pinokio terminal (`Running on local URL: http://127.0.0.1:PORT`).

Inputs, in order:

| Name | Type | Values |
| --- | --- | --- |
| `text` | string | up to 800 characters |
| `model` | string | `mini`, `micro`, `atom` |
| `voice` | string | `cassidy`, `mark`, `hope`, `james`, `sophia`, `jasper` |
| `enhanced` | bool | 48 kHz output (Mini only) |
| `events` | bool | enable event tags (Mini only) |
| `seed` | int | 0 – 4294967295 |
| `mode` | string | `Create`, `Compare`, `Quality` |

Output: `[files, metadata]` — a list of WAV files and a list of per-take metadata
(`model`, `voice`, `rate`, `seconds`, `compute_seconds`, `seed`, `characters`).

### Python

```sh
pip install gradio_client
```

```python
from gradio_client import Client

client = Client("http://127.0.0.1:PORT/")
files, metadata = client.predict(
    text="You really surprised me. [laugh] That was a good one.",
    model="mini",
    voice="cassidy",
    enhanced=False,
    events=True,
    seed=42,
    mode="Create",
    api_name="/synthesize",
)
print(files[0], metadata[0])  # local path of the downloaded WAV
```

### JavaScript

```sh
npm install @gradio/client
```

```javascript
import { Client } from "@gradio/client";

const client = await Client.connect("http://127.0.0.1:PORT/");
const result = await client.predict("/synthesize", {
  text: "A small idea can become something worth hearing.",
  model: "mini",
  voice: "hope",
  enhanced: true,
  events: false,
  seed: 42,
  mode: "Create",
});
const [files, metadata] = result.data;
console.log(files[0].url, metadata[0]);
```

### Curl

```sh
EVENT_ID=$(curl -s -X POST http://127.0.0.1:PORT/gradio_api/call/synthesize \
  -H "Content-Type: application/json" \
  -d '{"data": ["A small idea can become something worth hearing.", "mini", "cassidy", false, false, 42, "Create"]}' \
  | sed -E 's/.*"event_id": ?"([^"]+)".*/\1/')

curl -s -N http://127.0.0.1:PORT/gradio_api/call/synthesize/$EVENT_ID
```

The stream ends with an `event: complete` line whose `data` holds the file objects (with a `url` to
download the WAV) and the metadata.

## License

The launcher scripts are yours to reuse. Inflect code is Apache 2.0; the v3 model weights use the
[Inflect preview evaluation license](https://huggingface.co/owensong/Inflect-Mini-v3/blob/main/LICENSE.md).
