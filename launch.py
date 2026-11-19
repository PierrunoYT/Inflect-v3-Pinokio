"""Run the cloned Inflect v3 Space locally, on CUDA when available.

app.py selects CUDA only inside a Hugging Face Space (SPACE_ID is set there), so a
local run would always use the CPU. This wrapper injects the device without
modifying the cloned Space. Set INFLECT_DEVICE=cpu to force the CPU.
"""
import os
import runpy
import sys
from pathlib import Path

APP = Path(__file__).resolve().parent / "app"
sys.path.insert(0, str(APP))

import torch  # noqa: E402
import engine  # noqa: E402

DEVICE = os.getenv("INFLECT_DEVICE") or ("cuda" if torch.cuda.is_available() else "cpu")
print("Inflect device:", DEVICE, flush=True)

_studio_init = engine.Studio.__init__


def _studio_init_on_device(self, cache, output, device="cpu"):
    _studio_init(self, cache, output, device=DEVICE)


engine.Studio.__init__ = _studio_init_on_device
runpy.run_path(str(APP / "app.py"), run_name="__main__")
