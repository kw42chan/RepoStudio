"""Record one official agent-desktop command; never chooses or retries UI actions."""
import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
log_setting = os.environ.get("REPOSTUDIO_QA_LOG_DIR")
if not log_setting:
    raise SystemExit("Set REPOSTUDIO_QA_LOG_DIR to the fresh directory printed by npm run test:smoke.")
log = (root / log_setting).resolve()
runs = (root / "docs/testing/runs").resolve()
if log == runs or not log.is_relative_to(runs) or not (log / "results.json").is_file():
    raise SystemExit("Choose an initialized run under docs/testing/runs/.")
if json.loads((log / "results.json").read_text(encoding="utf-8")).get("status") == "passed":
    raise SystemExit("This run is complete. Create a fresh smoke run instead of appending to it.")
private = log / "private"
private.mkdir(exist_ok=True)
if len(sys.argv) < 3:
    raise SystemExit("Usage: python scripts/desktop-qa.py unique-label agent-desktop-command [arguments...]")
label, *arguments = sys.argv[1:]
if not label or any(c not in "abcdefghijklmnopqrstuvwxyz0123456789-_" for c in label):
    raise SystemExit("Use a simple lowercase log label.")
if (private / f"{label}.json").exists():
    raise SystemExit("That label already has evidence. Choose a new label; existing evidence is preserved.")
node = shutil.which("node")
npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
if not node or not npm:
    raise SystemExit("Node and npm must be installed to run the agent-desktop launcher.")
launcher = Path(subprocess.check_output([npm, "root", "-g"], text=True).strip()) / "agent-desktop/bin/agent-desktop"
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
session_id = os.environ.get("AGENT_DESKTOP_SESSION", "")
if not session_id and arguments[:2] != ["session", "start"] and arguments[0] not in ("status", "version"):
    raise SystemExit("Create a fresh agent-desktop session and set AGENT_DESKTOP_SESSION first.")
scope = ["--session", session_id] if session_id else []
command = [node, str(launcher), *arguments, *scope]
result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=90)
(private / f"{label}.json").write_text(result.stdout, encoding="utf-8")
if result.stderr:
    (private / f"{label}.stderr.txt").write_text(result.stderr, encoding="utf-8")
event = {"time_utc": started, "label": label, "arguments": arguments, "exit_code": result.returncode, "result_file": f"private/{label}.json", "session_id": session_id}
with (log / "commands.jsonl").open("a", encoding="utf-8") as f:
    f.write(json.dumps(event, ensure_ascii=False) + "\n")
try:
    response = json.loads(result.stdout)
except ValueError:
    print(result.stdout)
    print(result.stderr)
    raise SystemExit(result.returncode)
if response.get("command") == "snapshot" and response.get("ok"):
    data = response["data"]
    print(json.dumps({k: v for k,v in data.items() if k != "tree"}, ensure_ascii=False))
    statics = []
    def walk(node):
        role = node.get("role", "")
        if role == "statictext" and node.get("name"):
            statics.append(node["name"])
        elif node.get("ref_id") and role not in ("tab", "group"):
            print(node["ref_id"], role, node.get("name", ""), "value=" + str(node.get("value", ""))[:180], node.get("states", []))
        for child in node.get("children", []):
            walk(child)
    tree = data.get("tree", {})
    def documents(node):
        if node.get("role") == "document" and str(node.get("value", "")).startswith("http://localhost:3100"):
            return [node]
        return [match for child in node.get("children", []) for match in documents(child)]
    for region in documents(tree) or [tree]:
        walk(region)
    if statics:
        print("TEXT:", " | ".join(statics)[:9000])
else:
    print(json.dumps(response, ensure_ascii=False))
raise SystemExit(result.returncode)
