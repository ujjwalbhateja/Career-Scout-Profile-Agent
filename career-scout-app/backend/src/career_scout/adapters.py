"""Real provider bindings, reusing the web app's bounded Gemini/Keenable/Profile code.

The bridge is a fixed local Node program, not a shell or a generic execution tool.
Credentials are inherited in its server environment, never sent in model input.
"""

import asyncio
import json
import os
from pathlib import Path

from career_scout.catalog import TOOL_SPECS, create_registry
from career_scout.policy import WorkflowError


class ProviderBridge:
    def __init__(self, root: Path, node: str):
        self.root, self.node = root.resolve(), node

    async def call(self, name, payload, invocation):
        process = await asyncio.create_subprocess_exec(
            self.node,
            str(self.root / "scripts" / "agent-provider.mjs"),
            cwd=self.root,
            env=os.environ.copy(),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
            limit=2_000_000,
        )
        message = {
            "name": name,
            "owner": invocation.context.owner_id,
            "payload": payload.model_dump(),
            "prompt": invocation.prompt,
        }
        try:
            output, _ = await process.communicate(json.dumps(message).encode())
        except BaseException:
            if process.returncode is None:
                process.kill()
            await process.wait()
            raise
        if len(output) > 2_000_000:
            raise WorkflowError("provider_failed", "Provider output exceeded the limit.")
        try:
            result = json.loads(output)
        except (ValueError, UnicodeError):
            raise WorkflowError("provider_failed", "Provider returned unreadable output.") from None
        if process.returncode or "error" in result:
            # Only this script's fixed redacted error messages are accepted.
            raise WorkflowError("provider_failed", result.get("error", "Provider failed."))
        return result["result"]


def production_registry(bridge, store, owner, request_id):
    registry = create_registry()
    for spec in TOOL_SPECS:

        def bind(spec):
            async def handler(payload, invocation):
                checkpoint_input = payload.model_dump()
                key = store.call_key(spec.name, checkpoint_input, invocation.prompt)
                if spec.name != "load_profile":
                    cached = store.cached(owner, request_id, key)
                    if cached is not None:
                        return spec.output_model.model_validate(cached)
                store.phase(owner, request_id, invocation.agent)
                if spec.name == "save_package":
                    result = store.save_package(owner, request_id, payload)
                else:
                    result = await bridge.call(spec.name, payload, invocation)
                result = spec.output_model.model_validate(result)
                if spec.name != "load_profile":
                    store.cache(owner, request_id, key, result.model_dump())
                return result

            return handler

        registry.bind(spec.name, bind(spec))
    return registry
